"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Sidebar from "./_components/sidebar";
import PatientsECMOs from "./_components/patients-ecmos";
import MatchList from "./_components/match-list";
import Chat from "./_components/chat";
import UserSync from "./_components/user-sync";
import NotificationBell from "./_components/notification-bell";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("patients-ecmos");
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk to load
    
    if (!user) {
      // User is not authenticated, redirect to sign in
      router.push('/sign-in');
      return;
    }

    const userId = user.id;
    const userEmail = user.primaryEmailAddress?.emailAddress;
    const isEduEmail = userEmail?.toLowerCase().endsWith('.edu');

    // Bypass NPI verification for .edu emails
    if (isEduEmail) {
      const sessionKey = `npi_verified_${userId}`;
      const verifiedAtKey = `npi_verified_at_${userId}`;
      sessionStorage.setItem(sessionKey, 'true');
      sessionStorage.setItem(verifiedAtKey, new Date().toISOString());
      setIsVerifying(false);
      return;
    }

    // Get the current user's ID for session storage key
    const sessionKey = `npi_verified_${userId}`;
    const verifiedAtKey = `npi_verified_at_${userId}`;
    
    // Check if this specific user has verified NPI in this session
    const npiVerified = sessionStorage.getItem(sessionKey);
    const verifiedAt = sessionStorage.getItem(verifiedAtKey);
    
    if (!npiVerified || !verifiedAt) {
      // No NPI verification found for this user, redirect to verification
      router.push('/verify-npi');
    } else {
      // Optional: Check if verification is too old (e.g., 24 hours)
      const verificationTime = new Date(verifiedAt).getTime();
      const now = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - verificationTime > twentyFourHours) {
        // Verification expired, clear and redirect
        sessionStorage.removeItem(sessionKey);
        sessionStorage.removeItem(verifiedAtKey);
        router.push('/verify-npi');
      } else {
        // User is verified and verification is still valid
        setIsVerifying(false);
      }
    }
  }, [router, user, isLoaded]);

  const renderContent = () => {
    switch (activeSection) {
      case "patients-ecmos":
        return <PatientsECMOs />;
      case "match-list":
        return <MatchList />;
      case "chat":
        return <Chat />;
      default:
        return <PatientsECMOs />;
    }
  };

  // Show loading state while verifying NPI
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <UserSync />
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Notification Bell - Top Right */}
      <div className="fixed top-6 right-8 z-50">
        <NotificationBell />
      </div>

      <main className="ml-64 pt-20 px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
