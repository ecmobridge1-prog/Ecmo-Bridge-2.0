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
    <div className="w-64 bg-black/80 backdrop-blur-xl shadow-2xl h-screen pt-6 fixed left-0 top-20 border-r border-purple-500/20">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-8">Dashboard</h2>

        {/* ECMO Status Section */}
        <div className="mb-8 pb-6 border-b border-purple-500/20">
          {/* Instructions */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Toggle if your hospital has ECMO machines available.
            </p>
          </div>

          {/* ECMO Status Card */}
          <div
            className={`p-4 rounded-xl border transition-all duration-300 ${
              hasECMO
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                : 'bg-black/40 border-purple-500/20'
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
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
              hasECMO ? 'text-emerald-400' : 'text-gray-500'
            }`}>
              {hasECMO ? 'Your hospital has ECMO machines' : 'No ECMO machines available'}
            </p>
          </div>
        </div>

        <nav className="space-y-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 flex items-center space-x-3 group ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/40'
                  : 'text-gray-300 hover:bg-black/40 hover:text-white border border-purple-500/10 hover:border-purple-500/30'
              }`}
            >
              <span className="flex-shrink-0">
                {section.icon}
              </span>
              <span className="font-semibold">
                {section.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

