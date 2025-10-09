"use client";

import { useState } from "react";
import Sidebar from "./_components/sidebar";
import PatientsECMOs from "./_components/patients-ecmos";
import MatchList from "./_components/match-list";
import Chat from "./_components/chat";
import UserSync from "./_components/user-sync";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("patients-ecmos");

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-600 to-purple-400">
      <UserSync />
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="ml-64 pt-20 px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
