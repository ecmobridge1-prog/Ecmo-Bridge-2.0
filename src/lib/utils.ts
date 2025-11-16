/**
 * Utility functions shared across the application
 */

/**
 * Convert Clerk user ID to a valid UUID format
 * Uses a deterministic hash function to create a consistent UUID from the Clerk ID
 * 
 * @param clerkUserId - The Clerk user ID (e.g., "user_33oNhBCbh8Pfjw103KJPVKAltbh")
 * @returns A valid UUID string
 */
export function clerkIdToUuid(clerkUserId: string): string {
  // Create a namespace UUID from the Clerk ID
  const bytes = new TextEncoder().encode(clerkUserId);
  let hashStr = '';
  
  for (let i = 0; i < bytes.length; i++) {
    hashStr += bytes[i].toString(16).padStart(2, '0');
  }
  
  // Pad or truncate to 32 hex characters
  hashStr = hashStr.padEnd(32, '0').slice(0, 32);
  
  // Format as UUID v4
  return `${hashStr.slice(0, 8)}-${hashStr.slice(8, 12)}-4${hashStr.slice(13, 16)}-${hashStr.slice(16, 20)}-${hashStr.slice(20, 32)}`;
}

