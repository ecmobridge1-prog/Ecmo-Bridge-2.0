"use client";

import { useState, useEffect, useRef } from 'react';

interface Notification {
  id: number;
  patientName: string;
  doctorEmail: string;
  timestamp: string;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    patientName: "John Doe",
    doctorEmail: "dr.smith@hospital.edu",
    timestamp: "5 minutes ago"
  },
  {
    id: 2,
    patientName: "Jane Smith",
    doctorEmail: "dr.jones@medical.edu",
    timestamp: "1 hour ago"
  },
  {
    id: 3,
    patientName: "Robert Johnson",
    doctorEmail: "dr.williams@clinic.edu",
    timestamp: "2 hours ago"
  }
];

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<Notification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Notifications"
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Notification Badge */}
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Notifications
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({notifications.length})
              </span>
            </h3>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 mb-1">
                        🔔 New Patient Added
                      </p>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Patient:</span> {notification.patientName}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Added by:</span> {notification.doctorEmail}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Empty State
              <div className="px-4 py-8 text-center">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-gray-500 text-sm">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
