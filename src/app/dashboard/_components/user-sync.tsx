"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { syncUserProfile } from "@/lib/queries";

/**
 * Component to sync Clerk user with Supabase database
 * This should be rendered in the dashboard to ensure logged-in users are added to the database
 */
export default function UserSync() {
  const { user, isLoaded } = useUser();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    async function syncUser() {
      if (isLoaded && user && !synced) {
        try {
          await syncUserProfile(
            user.id,
            user.username || user.primaryEmailAddress?.emailAddress,
            user.fullName
          );
          console.log('User synced to database:', user.id);
          setSynced(true);
        } catch (error: any) {
          console.error('Error syncing user to database:', {
            error,
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            userId: user?.id,
            username: user?.username,
            email: user?.primaryEmailAddress?.emailAddress
          });
        }
      }
    }

    syncUser();
  }, [user, isLoaded, synced]);

  // This component doesn't render anything
  return null;
}

