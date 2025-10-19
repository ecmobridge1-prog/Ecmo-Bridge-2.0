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

// ============================================
// PATIENT QUERIES
// ============================================

/**
 * Create a new patient
 * @param patientData - Patient data including name, special_care, type, latitude, longitude
 * @returns The newly created patient
 */
export async function createPatient(patientData: {
  name: string;
  special_care: string;
  type: string;
  latitude: number;
  longitude: number;
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
 * @param patientId - The patient's UUID
 * @returns The deleted patient data
 */
export async function deletePatient(patientId: string) {
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