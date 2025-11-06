"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserProfile, updateEcmoAvailability } from '@/lib/queries';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { user } = useUser();
  const [hasECMO, setHasECMO] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load initial ECMO status from database
  useEffect(() => {
    async function loadEcmoStatus() {
      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          setHasECMO(profile.has_ecmo_available || false);
        } catch (error) {
          console.error('Error loading ECMO status:', error);
        }
      }
    }
    loadEcmoStatus();
  }, [user]);

  const handleEcmoToggle = async () => {
    if (!user) return;
    
    const newValue = !hasECMO;
    setLoading(true);
    
    try {
      await updateEcmoAvailability(user.id, newValue);
      setHasECMO(newValue);
    } catch (error) {
      console.error('Error updating ECMO availability:', error);
      // Optionally show error message to user
    } finally {
      setLoading(false);
    }
  };
  const sections = [
    { 
      id: 'patients-ecmos', 
      label: 'Patients and ECMOs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      id: 'match-list', 
      label: 'Match-List',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { 
      id: 'chat', 
      label: 'Chat',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
  ];

  return (
    <div className="w-64 bg-[#1a1a1a] border-r border-gray-800 shadow-lg min-h-screen pt-20 fixed left-0 top-0">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-100 mb-6">Dashboard</h2>
        
        {/* ECMO Status Section */}
        <div className="mb-6 pb-6 border-b border-gray-700">
          {/* Instructions */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-3">
              Toggle if your hospital has ECMO machines available.
            </p>
          </div>

          {/* ECMO Status Card */}
          <div
            className={`p-3 rounded-lg border-2 transition-all duration-300 ${
              hasECMO
                ? 'bg-emerald-500/10 border-emerald-500/50'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🏥</span>
                <span className={`text-sm font-medium ${
                  hasECMO ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  ECMO Available
                </span>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={handleEcmoToggle}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${
                  hasECMO
                    ? 'bg-emerald-600 focus:ring-emerald-500'
                    : 'bg-gray-600 focus:ring-gray-500'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="switch"
                aria-checked={hasECMO}
                aria-label="Toggle ECMO availability"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    hasECMO ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Status Text */}
            <p className={`mt-2 text-xs ${
              hasECMO ? 'text-emerald-400/80' : 'text-gray-500'
            }`}>
              {hasECMO ? 'Your hospital has ECMO machines' : 'No ECMO machines available'}
            </p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                activeSection === section.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-purple-400'
              }`}
            >
              <span className="flex-shrink-0">
                {section.icon}
              </span>
              <span className="font-medium">
                {section.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

