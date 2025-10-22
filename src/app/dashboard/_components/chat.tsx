"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { getAllUsers, createChatWithMembers, getUserChats, getChatMessages, sendMessage, leaveChatMember } from "@/lib/queries";
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

interface Chat {
  id: string;
  title: string;
  is_group: boolean;
  created_at: string;
}

interface Message {
  id: number;
  content: string;
  sender_id: string;
  created_at: string;
  profiles: {
    username: string | null;
    full_name: string | null;
  } | null;
}

export default function Chat() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
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

  // Fetch user's chats on component mount
  useEffect(() => {
    if (user) {
      fetchUserChats();
    }
  }, [user]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
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

    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    setCreatingChat(true);
    try {
      // Convert Clerk ID to UUID format
      const currentUserUuid = clerkIdToUuid(user.id);
      await createChatWithMembers(chatName, selectedUsers, currentUserUuid);
      
      // Success! Close modal and reset form
      setIsModalOpen(false);
      setChatName("");
      setSelectedUsers([]);
      
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
              {selectedChat.is_group && (
                <p className="text-sm text-gray-500">Group chat</p>
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

        {/* Messages Area */}
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
            messages.map((message) => {
              const isMyMessage = message.sender_id === currentUserUuid;
              const timeAgo = getTimeAgo(message.created_at);
              const senderName = message.profiles?.full_name || message.profiles?.username || 'Unknown';

              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
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
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
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
              onClick={() => setIsModalOpen(false)}
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

            {/* User Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Users
              </label>
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No users found</p>
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
                {selectedUsers.length} user(s) selected
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={creatingChat}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={creatingChat || !chatName.trim() || selectedUsers.length === 0}
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

