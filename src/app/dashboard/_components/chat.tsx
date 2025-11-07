"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { getAllUsers, getAllPatients, createChatWithMembers, getUserChats, getChatMessages, sendMessage, leaveChatMember, getChatMembers, createQuestionnaire, sendQuestionnaireMessage, getQuestionnaireById, getQuestionsWithResponses, addQuestion, addResponse } from "@/lib/queries";
import { clerkIdToUuid } from "@/lib/utils";

// Helper function to get time ago
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
}

interface Patient {
  id: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  dob?: string;
  mrn?: string;
  insurance?: string;
  special_care: string;
  type: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  is_group: boolean;
  created_at: string;
  patient_id?: string;
  patients?: {
    id: string;
    name: string;
  } | null;
}

interface Message {
  id: number;
  content: string;
  sender_id: string;
  created_at: string;
  is_questionnaire?: boolean;
  questionnaire_id?: string | null;
  questionnaires?: { id: string; title: string } | null;
  profiles: {
    username: string | null;
    full_name: string | null;
  } | null;
}

interface FAQQuestion {
  id: string;
  question: string;
  answer?: string;
  submittedBy: string;
  submittedByName: string;
  answeredBy?: string;
  answeredByName?: string;
}

interface FAQData {
  id: string;
  title: string;
  description: string;
  questions: FAQQuestion[];
  status: 'open' | 'answering' | 'completed';
  chatId: string; // Which chat this questionnaire belongs to
  createdForUserId: string; // The patient this questionnaire is for
  createdForUserName: string; // Display name of the patient
  createdByUserId: string; // Who created this questionnaire
  createdByUserName: string; // Display name of creator
  isGroupQuestionnaire: boolean; // Whether this is for all members in a group
}

export default function Chat() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [chatName, setChatName] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [leavingChat, setLeavingChat] = useState<string | null>(null);
  
  // Questionnaire states (UI only)
  const [isCreatingQuestionnaire, setIsCreatingQuestionnaire] = useState(false);
  const [questionnaireTitle, setQuestionnaireTitle] = useState("");
  const [chatMembers, setChatMembers] = useState<User[]>([]);
  const [openQuestionnaireId, setOpenQuestionnaireId] = useState<string | null>(null);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(null);
  const [questionnaireMeta, setQuestionnaireMeta] = useState<{ id: string; title: string } | null>(null);
  const [questionsData, setQuestionsData] = useState<Array<{ id: string; question_text: string; responses?: Array<{ id: string; response_text: string; created_at?: string; profiles?: { id: string; full_name: string | null; username: string | null } }> }>>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  // No localStorage or Q/A for now

  // Fetch user's chats on component mount
  useEffect(() => {
    if (user) {
      fetchUserChats();
    }
  }, [user]);

  // Fetch messages and chat members when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      fetchChatMembers();
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup polling when component unmounts or chat changes
    return () => {
      stopPolling();
    };
  }, [selectedChat]);

  // Fetch all users when modal opens
  useEffect(() => {
    if (isModalOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isModalOpen]);

  // Fetch all patients when modal opens
  useEffect(() => {
    if (isModalOpen && patients.length === 0) {
      fetchPatients();
    }
  }, [isModalOpen]);
  // Load questionnaire data when a questionnaire is opened
  useEffect(() => {
    const loadQuestionnaire = async () => {
      if (!openQuestionnaireId) return;
      setQuestionnaireLoading(true);
      setQuestionnaireError(null);
      try {
        const meta = await getQuestionnaireById(openQuestionnaireId);
        setQuestionnaireMeta(meta ? { id: meta.id, title: meta.title } : null);
        const q = await getQuestionsWithResponses(openQuestionnaireId);
        setQuestionsData(Array.isArray(q) ? q : []);
      } catch (e: any) {
        setQuestionnaireError(e?.message || 'Failed to load questionnaire');
      } finally {
        setQuestionnaireLoading(false);
      }
    };
    loadQuestionnaire();
  }, [openQuestionnaireId]);

  const refreshQuestions = async () => {
    if (!openQuestionnaireId) return;
    const q = await getQuestionsWithResponses(openQuestionnaireId);
    setQuestionsData(Array.isArray(q) ? q : []);
  };

  const handleAddQuestionBackend = async () => {
    if (!openQuestionnaireId || !newQuestion.trim()) return;
    try {
      await addQuestion(openQuestionnaireId, newQuestion.trim());
      setNewQuestion("");
      await refreshQuestions();
    } catch (e) {
      console.error('Error adding question', e);
      alert('Failed to add question');
    }
  };

  const handleAnswerQuestionBackend = async (questionId: string) => {
    if (!answerText.trim() || !user) return;
    try {
      const currentUserUuid = clerkIdToUuid(user.id);
      await addResponse(questionId, currentUserUuid, answerText.trim());
      setAnswerText("");
      setAnsweringQuestionId(null);
      await refreshQuestions();
    } catch (e) {
      console.error('Error adding response', e);
      alert('Failed to submit answer');
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const allPatients = await getAllPatients();
      setPatients(allPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchChatMembers = async () => {
    if (!selectedChat) return;
    
    try {
      const members = await getChatMembers(selectedChat.id);
      setChatMembers(members);
    } catch (error) {
      console.error('Error fetching chat members:', error);
    }
  };

  const fetchUserChats = async () => {
    if (!user) return;
    
    setLoadingChats(true);
    try {
      const userUuid = clerkIdToUuid(user.id);
      const userChats = await getUserChats(userUuid);
      setChats(userChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchMessages = async (silent = false) => {
    if (!selectedChat) return;

    if (!silent) {
      setLoadingMessages(true);
    }
    try {
      const chatMessages = await getChatMessages(selectedChat.id);
      // Transform the data to match our Message interface
      const transformedMessages = chatMessages.map((msg: any) => ({
        ...msg,
        profiles: Array.isArray(msg.profiles) && msg.profiles.length > 0 
          ? msg.profiles[0] 
          : msg.profiles
      }));
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  };

  const startPolling = () => {
    // Clear any existing polling
    stopPolling();
    
    // Start polling every 3 seconds
    const interval = setInterval(() => {
      fetchMessages(true); // Silent fetch (no loading spinner)
    }, 3000);
    
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !user || !messageText.trim()) {
      return;
    }

    setSendingMessage(true);
    try {
      const currentUserUuid = clerkIdToUuid(user.id);
      await sendMessage(selectedChat.id, currentUserUuid, messageText.trim());
      
      // Clear the input field
      setMessageText("");
      
      // Refresh messages to show the new one (silent to avoid loading spinner)
      await fetchMessages(true);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateChat = async () => {
    if (!user) {
      console.error('User not logged in');
      return;
    }

    if (!chatName.trim()) {
      alert('Please enter a chat name');
      return;
    }

    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    setCreatingChat(true);
    try {
      // Convert Clerk ID to UUID format
      const currentUserUuid = clerkIdToUuid(user.id);
      await createChatWithMembers(chatName, selectedPatientId!, selectedUsers, currentUserUuid);
      
      // Success! Close modal and reset form
      setIsModalOpen(false);
      setChatName("");
      setSelectedUsers([]);
      setSelectedPatientId(null);
      
      // Refresh chat list
      await fetchUserChats();
      console.log('Chat created successfully!');
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleLeaveChat = async (chatId: string) => {
    if (!user) {
      console.error('User not logged in');
      return;
    }

    setLeavingChat(chatId);
    try {
      const currentUserUuid = clerkIdToUuid(user.id);
      await leaveChatMember(chatId, currentUserUuid);
      
      // If we're currently viewing this chat, go back to chat list
      if (selectedChat && selectedChat.id === chatId) {
        setSelectedChat(null);
      }
      
      // Refresh chat list
      await fetchUserChats();
      console.log('Left chat successfully!');
    } catch (error) {
      console.error('Error leaving chat:', error);
      alert('Failed to leave chat. Please try again.');
    } finally {
      setLeavingChat(null);
    }
  };

  // Questionnaire Functions (DB only)
  const handleCreateQuestionnaire = async () => {
    if (!questionnaireTitle.trim()) {
      alert('Please enter a questionnaire title');
      return;
    }

    if (!user || !selectedChat) return;
    try {
      const currentUserUuid = clerkIdToUuid(user.id);
      const created = await createQuestionnaire(selectedChat.id, currentUserUuid, questionnaireTitle.trim());
      await sendQuestionnaireMessage(selectedChat.id, currentUserUuid, created.id);
      setIsCreatingQuestionnaire(false);
      setQuestionnaireTitle("");
      await fetchMessages(true);
    } catch (e) {
      console.error('Error creating questionnaire:', e);
      alert('Failed to create questionnaire.');
    }
  };

  // (legacy in-memory questionnaire handlers removed; using backend handlers instead)

  // Removed expand/collapse; using modal instead

  // If a chat is selected, show the chat view
  if (selectedChat) {
    // Convert current user's Clerk ID to UUID for comparison
    const currentUserUuid = user ? clerkIdToUuid(user.id) : null;
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedChat(null)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedChat.title}
              </h2>
              {selectedChat.patients?.name ? (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Patient:</span>{' '}
                  <span className="font-semibold text-gray-800">{selectedChat.patients.name}</span>
                </div>
              ) : selectedChat.patient_id ? (
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Patient:</span> Unknown
                </div>
              ) : null}
              {selectedChat.is_group && (
                <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                  <div>
                    <span className="font-medium">Members:</span>{' '}
                    {chatMembers
                      .filter(m => m.id !== currentUserUuid)
                      .map(m => m.full_name || m.username || 'Unknown')
                      .join(', ') || 'None'}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => handleLeaveChat(selectedChat.id)}
            disabled={leavingChat === selectedChat.id}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {leavingChat === selectedChat.id ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Leaving...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Leave Chat</span>
              </>
            )}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages including questionnaire markers */}
              {messages.map((message) => {
                const isMyMessage = message.sender_id === currentUserUuid;
                const timeAgo = getTimeAgo(message.created_at);
                const senderName = message.profiles?.full_name || message.profiles?.username || 'Unknown';

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.is_questionnaire ? (
                      <button
                        onClick={() => setOpenQuestionnaireId(message.questionnaire_id || null)}
                        className={`max-w-[70%] text-left rounded-lg p-3 border-2 ${
                          isMyMessage
                            ? 'bg-purple-50 border-purple-300 text-gray-800'
                            : 'bg-blue-50 border-blue-200 text-gray-800'
                        }`}
                      >
                        {!isMyMessage && (
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {senderName}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            Click to open question {message.questionnaires?.title || 'Questionnaire'}
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-gray-500">{timeAgo}</p>
                      </button>
                    ) : (
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isMyMessage
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {!isMyMessage && (
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {senderName}
                          </p>
                        )}
                        <p>{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMyMessage ? 'text-purple-200' : 'text-gray-500'
                          }`}
                        >
                          {timeAgo}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Message Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreatingQuestionnaire(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Launch Questionnaire</span>
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sendingMessage}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageText.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingMessage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Questionnaire Creation Modal */}
        {isCreatingQuestionnaire && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
              <button
                onClick={() => {
                  setIsCreatingQuestionnaire(false);
                  setQuestionnaireTitle("");
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                Create Questionnaire
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={questionnaireTitle}
                    onChange={(e) => setQuestionnaireTitle(e.target.value)}
                    placeholder="e.g., Patient Care Questions"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">How it works:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>The questionnaire will appear in this chat for everyone</li>
                        <li>Patients can add their questions directly</li>
                        <li>Healthcare providers can answer questions as they come in</li>
                        <li>All questions and answers appear in the chat window</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreatingQuestionnaire(false);
                    setQuestionnaireTitle("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateQuestionnaire}
                  disabled={!questionnaireTitle.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Questionnaire
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questionnaire View Modal (UI-only placeholder) */
        }
        {openQuestionnaireId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
              <button
                onClick={() => {
                  setOpenQuestionnaireId(null);
                  setQuestionnaireMeta(null);
                  setQuestionsData([]);
                  setQuestionnaireError(null);
                  setQuestionnaireLoading(false);
                  setAnsweringQuestionId(null);
                  setAnswerText("");
                  setNewQuestion("");
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-xl font-bold text-gray-800">{questionnaireMeta?.title || 'Questionnaire'}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
                        Open for Questions
                      </span>
                      <span className="text-sm text-gray-500">{questionsData?.length || 0} question(s)</span>
                    </div>
                  </div>
                </div>

                {questionnaireLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : questionnaireError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{questionnaireError}</div>
                ) : (
                  <>
                    {/* Add Question Section */}
                    <div className="bg-white p-4 rounded-lg mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Your Question
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder="Type your question here..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newQuestion.trim()) {
                              handleAddQuestionBackend();
                            }
                          }}
                        />
                        <button
                          onClick={handleAddQuestionBackend}
                          disabled={!newQuestion.trim()}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Questions List */}
                    {questionsData && questionsData.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800">Questions:</h4>
                        {questionsData.map((q) => (
                          <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <p className="font-medium text-gray-800 mb-1">{q.question_text}</p>

                            {q.responses && q.responses.length > 0 ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                                <p className="text-sm font-medium text-green-800 mb-2">Responses</p>
                                <div className="space-y-2">
                                  {q.responses.map((r) => (
                                    <div key={r.id} className="text-gray-700">
                                      <p>{r.response_text}</p>
                                      {r.profiles && (
                                        <p className="text-xs text-gray-500 mt-1">By {r.profiles.full_name || r.profiles.username || 'Unknown'}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 text-sm text-gray-500 italic">
                                No responses yet
                              </div>
                            )}

                            {/* Answer input */}
                            {answeringQuestionId === q.id ? (
                              <div className="mt-3">
                                <textarea
                                  value={answerText}
                                  onChange={(e) => setAnswerText(e.target.value)}
                                  placeholder="Type your answer..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  rows={3}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleAnswerQuestionBackend(q.id)}
                                    disabled={!answerText.trim()}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    Submit Answer
                                  </button>
                                  <button
                                    onClick={() => { setAnsweringQuestionId(null); setAnswerText(""); }}
                                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAnsweringQuestionId(q.id)}
                                className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                              >
                                Answer this question
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                        <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No questions yet</p>
                        <p className="text-xs text-gray-400">Add a question to get started</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Otherwise, show the chat list
  return (
    <div className="space-y-6">
      {/* Create New Chat Section */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Create New Chat
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedPatientId(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
              Create New Chat
            </h3>

            {/* Chat Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chat Name
              </label>
              <input
                type="text"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Enter chat name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Patient Selection (Which patient this chat is regarding) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Patient <span className="text-red-500">*</span>
              </label>
              {loadingPatients ? (
                <div className="flex items-center justify-center py-8 border border-gray-300 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg">
                  <p>No patients found</p>
                </div>
              ) : (
                <select
                  value={selectedPatientId || ''}
                  onChange={(e) => setSelectedPatientId(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Select a patient --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* User Selection (Select users to add to chat) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Users to Add
              </label>
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No patients found</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-800">
                          {user.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{user.username || 'no-username'}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {selectedUsers.length} patient(s) selected
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPatientId(null);
                }}
                disabled={creatingChat}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={creatingChat || !chatName.trim() || !selectedPatientId || selectedUsers.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creatingChat ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  'Create Chat'
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Your Chats Section */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Your Chats
        </h2>
        
        <div className="space-y-3">
          {loadingChats ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-4 text-gray-500">No chats yet</p>
              <p className="text-sm text-gray-400">Create a new chat to get started</p>
            </div>
          ) : (
            chats.map((chat) => {
              const timeAgo = getTimeAgo(chat.created_at);
              return (
                <div
                  key={chat.id}
                  className="bg-gray-50 hover:bg-purple-50 border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:border-purple-300"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-800">
                          {chat.title}
                        </h3>
                        {chat.is_group && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            Group
                          </span>
                        )}
                      </div>
                      {chat.patients?.name ? (
                        <p className="text-sm text-gray-600 mt-1">
                          Patient: <span className="font-medium">{chat.patients.name}</span>
                        </p>
                      ) : chat.patient_id ? (
                        <p className="text-sm text-gray-500 mt-1">
                          Patient: Unknown
                        </p>
                      ) : null}
                      <p className="text-sm text-gray-500 mt-1">
                        Click to open chat
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-400">
                        {timeAgo}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveChat(chat.id);
                        }}
                        disabled={leavingChat === chat.id}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {leavingChat === chat.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            <span>Leaving...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Leave</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

