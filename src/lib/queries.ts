import { supabase } from './db';
import { clerkIdToUuid } from './utils';

// ============================================
// USER PROFILE QUERIES
// ============================================

/**
 * Sync Clerk user to Supabase profiles table
 * Creates a profile if it doesn't exist
 * 
 * @param clerkUserId - The Clerk user ID (used as UUID for profile ID)
 * @param username - Username from Clerk (optional)
 * @param fullName - Full name from Clerk (optional)
 * @returns The user profile
 */
export async function syncUserProfile(
  clerkUserId: string,
  username?: string | null,
  fullName?: string | null
) {
  // Convert Clerk ID to UUID
  const uuid = clerkIdToUuid(clerkUserId);
  
  console.log('Converting Clerk ID to UUID:', { clerkUserId, uuid });

  // First, check if user already exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uuid)
    .single();

  // If user exists, return it
  if (existingUser && !fetchError) {
    return existingUser;
  }

  // If user doesn't exist, create new profile
  const { data: newUser, error: insertError } = await supabase
    .from('profiles')
    .insert([
      {
        id: uuid,
        username: username || clerkUserId, // Use Clerk ID as fallback
        full_name: fullName || null,
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error('Error creating user profile:', {
      error: insertError,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      code: insertError.code,
      clerkUserId,
      uuid,
      username,
      fullName
    });
    throw insertError;
  }

  return newUser;
}

/**
 * Get user profile by Clerk ID
 */
export async function getUserProfile(clerkUserId: string) {
  const uuid = clerkIdToUuid(clerkUserId);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uuid)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  clerkUserId: string,
  updates: {
    username?: string;
    full_name?: string;
    has_ecmo_available?: boolean;
  }
) {
  const uuid = clerkIdToUuid(clerkUserId);
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', uuid)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user's ECMO availability status
 * @param clerkUserId - The Clerk user ID
 * @param hasEcmo - Whether the user has ECMO machines available
 * @returns The updated profile
 */
export async function updateEcmoAvailability(
  clerkUserId: string,
  hasEcmo: boolean
) {
  const uuid = clerkIdToUuid(clerkUserId);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ has_ecmo_available: hasEcmo })
    .eq('id', uuid)
    .select()
    .single();

  if (error) {
    console.error('Error updating ECMO availability:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get all users from profiles table
 * Used for populating user selection dropdowns
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .order('username', { ascending: true });

  if (error) throw error;
  return data;
}

// ============================================
// CHAT QUERIES
// ============================================

/**
 * Create a new chat
 * @param title - Chat title/name
 * @param isGroup - Whether this is a group chat
 * @returns The newly created chat
 */
export async function createChat(title: string, isGroup: boolean = false) {
  const { data, error } = await supabase
    .from('chats')
    .insert([
      {
        title: title,
        is_group: isGroup,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating chat:', error);
    throw error;
  }

  return data;
}

/**
 * Add members to a chat
 * @param chatId - The chat ID
 * @param memberIds - Array of user IDs to add
 */
export async function addChatMembers(chatId: string, memberIds: string[]) {
  // Create an array of chat member records
  const chatMembers = memberIds.map((memberId) => ({
    chat_id: chatId,
    user_id: memberId,
    role: 'member',
  }));

  const { data, error } = await supabase
    .from('chat_members')
    .insert(chatMembers)
    .select();

  if (error) {
    console.error('Error adding chat members:', error);
    throw error;
  }

  return data;
}

/**
 * Create a chat with members in one transaction
 * @param title - Chat title
 * @param memberIds - Array of user IDs to add to the chat
 * @param currentUserId - The ID of the user creating the chat (will be added automatically)
 */
export async function createChatWithMembers(
  title: string,
  memberIds: string[],
  currentUserId: string
) {
  try {
    // Determine if it's a group chat (more than 2 members including creator)
    const isGroup = memberIds.length > 1;

    // Create the chat
    const newChat = await createChat(title, isGroup);

    // Add all members including the creator
    const allMemberIds = [...new Set([currentUserId, ...memberIds])]; // Remove duplicates
    await addChatMembers(newChat.id, allMemberIds);

    return newChat;
  } catch (error) {
    console.error('Error creating chat with members:', error);
    throw error;
  }
}

/**
 * Get all chats for a specific user
 * @param userId - The user's UUID
 * @returns Array of chats the user is a member of
 */
export async function getUserChats(userId: string) {
  const { data, error } = await supabase
    .from('chat_members')
    .select(`
      chat_id,
      chats (
        id,
        title,
        is_group,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('Error fetching user chats:', error);
    throw error;
  }

  // Transform the data to return just the chat objects
  return data.map((item: any) => item.chats).filter(Boolean);
}

/**
 * Get all messages for a specific chat
 * @param chatId - The chat UUID
 * @returns Array of messages with sender information
 */
export async function getChatMessages(chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      sender_id,
      created_at,
      is_questionnaire,
      questionnaire_id,
      questionnaires:questionnaire_id (
        id,
        title
      ),
      profiles:sender_id (
        username,
        full_name
      )
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }

  return data;
}

/**
 * Create a questionnaire record
 * @param chatId - The chat UUID
 * @param openedByUserId - The user UUID opening the questionnaire
 * @param title - Questionnaire title
 */
export async function createQuestionnaire(
  chatId: string,
  openedByUserId: string,
  title: string
) {
  const { data, error } = await supabase
    .from('questionnaires')
    .insert([
      { chat_id: chatId, opened_by_user_id: openedByUserId, title }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating questionnaire:', error);
    throw error;
  }
  return data as { id: string; chat_id: string; opened_by_user_id: string; title: string };
}

/**
 * Send a questionnaire message into the chat
 * @param chatId - The chat UUID
 * @param senderId - The sender's UUID
 * @param questionnaireId - The questionnaire UUID
 */
export async function sendQuestionnaireMessage(
  chatId: string,
  senderId: string,
  questionnaireId: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        chat_id: chatId,
        sender_id: senderId,
        content: 'Questionnaire opened',
        is_questionnaire: true,
        questionnaire_id: questionnaireId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error sending questionnaire message:', error);
    throw error;
  }

  return data;
}

// ============================================
// QUESTIONNAIRE Q&A QUERIES
// ============================================

/**
 * Get questionnaires for a given chat
 */
export async function getQuestionnairesByChat(chatId: string) {
  const { data, error } = await supabase
    .from('questionnaires')
    .select(`
      id,
      chat_id,
      opened_by_user_id,
      title,
      created_at,
      profiles:opened_by_user_id ( id, username, full_name )
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching questionnaires by chat:', error);
    throw error;
  }

  return data;
}

/**
 * Get single questionnaire by id
 */
export async function getQuestionnaireById(questionnaireId: string) {
  const { data, error } = await supabase
    .from('questionnaires')
    .select(`
      id,
      chat_id,
      opened_by_user_id,
      title,
      created_at,
      profiles:opened_by_user_id ( id, username, full_name )
    `)
    .eq('id', questionnaireId)
    .single();

  if (error) {
    console.error('Error fetching questionnaire by id:', error);
    throw error;
  }

  return data;
}

/**
 * Get questions for a questionnaire
 */
export async function getQuestionsByQuestionnaire(questionnaireId: string) {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      questionnaire_id,
      question_text
    `)
    .eq('questionnaire_id', questionnaireId);

  if (error) {
    console.error('Error fetching questions by questionnaire:', error);
    throw error;
  }

  return data;
}

/**
 * Get responses for a question with responder profile
 */
export async function getResponsesByQuestion(questionId: string) {
  const { data, error } = await supabase
    .from('responses')
    .select(`
      id,
      question_id,
      responder_id,
      response_text,
      created_at,
      profiles:responder_id ( id, username, full_name )
    `)
    .eq('question_id', questionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching responses by question:', error);
    throw error;
  }

  return data;
}

/**
 * Get questions with nested responses (and responder profiles) for a questionnaire
 */
export async function getQuestionsWithResponses(questionnaireId: string) {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      questionnaire_id,
      question_text,
      responses (
        id,
        question_id,
        responder_id,
        response_text,
        created_at,
        profiles:responder_id ( id, username, full_name )
      )
    `)
    .eq('questionnaire_id', questionnaireId);

  if (error) {
    console.error('Error fetching questions with responses:', error);
    throw error;
  }

  // Sort nested responses ascending by created_at if present
  const sorted = (data || []).map((q: any) => ({
    ...q,
    responses: Array.isArray(q.responses)
      ? [...q.responses].sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })
      : []
  }));

  return sorted;
}

/**
 * Add a new question to a questionnaire
 */
export async function addQuestion(questionnaireId: string, questionText: string) {
  const { data, error } = await supabase
    .from('questions')
    .insert([
      {
        questionnaire_id: questionnaireId,
        question_text: questionText
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding question:', error);
    throw error;
  }

  return data;
}

/**
 * Add a new response to a question
 */
export async function addResponse(questionId: string, responderId: string, responseText: string) {
  const { data, error } = await supabase
    .from('responses')
    .insert([
      {
        question_id: questionId,
        responder_id: responderId,
        response_text: responseText
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding response:', error);
    throw error;
  }

  return data;
}

/**
 * Send a new message to a chat
 * @param chatId - The chat UUID
 * @param senderId - The sender's UUID
 * @param content - The message content
 * @returns The created message
 */
export async function sendMessage(chatId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        chat_id: chatId,
        sender_id: senderId,
        content: content,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data;
}

/**
 * Remove a user from a chat
 * @param chatId - The chat UUID
 * @param userId - The user's UUID
 * @returns void
 */
export async function leaveChatMember(chatId: string, userId: string) {
  const { error } = await supabase
    .from('chat_members')
    .delete()
    .eq('chat_id', chatId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error leaving chat:', error);
    throw error;
  }
}

/**
 * Get all members of a specific chat
 * @param chatId - The chat UUID
 * @returns Array of users who are members of the chat
 */
export async function getChatMembers(chatId: string) {
  const { data, error } = await supabase
    .from('chat_members')
    .select(`
      user_id,
      profiles:user_id (
        id,
        username,
        full_name
      )
    `)
    .eq('chat_id', chatId);

  if (error) {
    console.error('Error fetching chat members:', error);
    throw error;
  }

  // Transform the data to return user profiles
  return data.map((item: any) => item.profiles).filter(Boolean);
}

// ============================================
// PATIENT QUERIES
// ============================================

/**
 * Create a new patient
 * @param patientData - Patient data including name, special_care, type, latitude, longitude, and all new fields
 * @returns The newly created patient
 */
export async function createPatient(patientData: {
  name: string;
  special_care: string;
  type: string;
  latitude: number;
  longitude: number;
  // New demographics fields
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  dob?: string;
  mrn?: string;
  insurance?: string;
  // New vitals fields
  weight?: number;
  blood_pressure?: string;
  pulse?: number;
  temperature?: number;
  respiration_rate?: number;
  pulse_oximetry?: number;
  // New medical fields
  failure_type?: string;
  notes?: string;
  // Creator information
  created_by_user_id?: string;
}) {
  const { data, error } = await supabase
    .from('patients')
    .insert([patientData])
    .select()
    .single();

  if (error) {
    console.error('Error creating patient:', error);
    throw error;
  }

  return data;
}

/**
 * Get all patients
 * @returns Array of all patients
 */
export async function getAllPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a patient by ID
 * Also deletes all associated notifications
 * @param patientId - The patient's UUID
 * @returns The deleted patient data
 */
export async function deletePatient(patientId: string) {
  // First, delete all notifications associated with this patient
  const { error: notificationError } = await supabase
    .from('notifications')
    .delete()
    .eq('patient_id', patientId);

  if (notificationError) {
    console.error('Error deleting patient notifications:', notificationError);
    throw notificationError;
  }

  // Then delete the patient
  const { data, error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId)
    .select()
    .single();

  if (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }

  return data;
}

// ============================================
// NOTIFICATION QUERIES
// ============================================

/**
 * Get all notifications for a user
 * @param clerkUserId - The Clerk user ID
 * @returns Array of notifications ordered by newest first
 */
export async function getUserNotifications(clerkUserId: string) {
  const uuid = clerkIdToUuid(clerkUserId);
  
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      message,
      created_at,
      patients!patient_id (
        name
      )
    `)
    .eq('user_id', uuid)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }

  return data;
}

/**
 * Clear all notifications for a user
 * @param clerkUserId - The Clerk user ID
 * @returns void
 */
export async function clearUserNotifications(clerkUserId: string) {
  const uuid = clerkIdToUuid(clerkUserId);
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', uuid);

  if (error) {
    console.error('Error clearing notifications:', error);
    throw error;
  }
}