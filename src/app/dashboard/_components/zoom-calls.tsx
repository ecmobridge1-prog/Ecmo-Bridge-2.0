"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { getAllPatients, getAllZoomMeetings, getZoomMeetingsByPatient, getAllUsers } from "@/lib/queries";
import { clerkIdToUuid } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
}

interface Physician {
  id: string;
  username: string | null;
  full_name: string | null;
}

interface ZoomMeeting {
  id: string;
  patient_id?: string;
  patientId?: string;
  created_by_user_id?: string;
  createdByUserId?: string;
  meeting_type?: 'instant' | 'scheduled';
  meetingType?: 'instant' | 'scheduled';
  scheduled_start_time?: string | null;
  scheduledStartTime?: string | null;
  zoom_meeting_id?: number;
  zoom_meeting_number?: number;
  join_url?: string;
  joinUrl?: string;
  start_url?: string;
  startUrl?: string;
  topic?: string | null;
  duration?: number;
  timezone?: string;
  password?: string | null;
  status?: string;
  created_at?: string;
  createdAt?: string;
  patients?: {
    id: string;
    name: string;
  } | null;
  profiles?: {
    id: string;
    username: string | null;
    full_name: string | null;
  } | null;
}

export default function ZoomCalls() {
  const { user } = useUser();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loadingPhysicians, setLoadingPhysicians] = useState(false);
  const [selectedPhysicianIds, setSelectedPhysicianIds] = useState<string[]>([]);
  const [meetingType, setMeetingType] = useState<'instant' | 'scheduled'>('instant');
  const [storeMeeting, setStoreMeeting] = useState(true); // Option to store meeting in database
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPastMeetings, setShowPastMeetings] = useState(false); // Toggle to show/hide past meetings
  
  // Scheduled meeting form state
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState("");
  
  // Past meetings state
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [createdMeeting, setCreatedMeeting] = useState<ZoomMeeting | null>(null);
  
  // Pre-join meeting state (camera/mic selection)
  const [showPreJoin, setShowPreJoin] = useState(false);
  const [meetingToJoin, setMeetingToJoin] = useState<{ joinUrl: string } | null>(null);
  const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[]; microphones: MediaDeviceInfo[] }>({ cameras: [], microphones: [] });
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const patientsData = await getAllPatients();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPhysicians = async () => {
    try {
      setLoadingPhysicians(true);
      const physiciansData = await getAllUsers();
      // Filter out current user from the list (they're automatically added as host)
      const filteredPhysicians = physiciansData.filter(
        (p) => user && clerkIdToUuid(user.id) !== p.id
      );
      setPhysicians(filteredPhysicians);
    } catch (error) {
      console.error('Error fetching physicians:', error);
      setError('Failed to load physicians');
    } finally {
      setLoadingPhysicians(false);
    }
  };

  const fetchMeetings = useCallback(async () => {
    try {
      setLoadingMeetings(true);
      setError(null); // Clear previous errors
      let meetingsData;
      if (selectedPatientId) {
        meetingsData = await getZoomMeetingsByPatient(selectedPatientId);
      } else {
        meetingsData = await getAllZoomMeetings();
      }
      setMeetings(meetingsData || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      // Only show error if user is trying to view meetings
      if (showPastMeetings) {
        setError('Failed to load meetings. Make sure the database tables are set up.');
      }
    } finally {
      setLoadingMeetings(false);
    }
  }, [selectedPatientId, showPastMeetings]);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch physicians when user is available
  useEffect(() => {
    if (user) {
      fetchPhysicians();
    }
  }, [user]);

  // Fetch meetings only if user wants to see past meetings
  useEffect(() => {
    if (showPastMeetings) {
      fetchMeetings();
    }
  }, [showPastMeetings, fetchMeetings]);

  const handlePhysicianToggle = (physicianId: string) => {
    setSelectedPhysicianIds((prev) => {
      if (prev.includes(physicianId)) {
        return prev.filter((id) => id !== physicianId);
      } else {
        return [...prev, physicianId];
      }
    });
  };

  const handleCreateMeeting = async () => {
    if (!user) {
      setError('You must be logged in to create a meeting');
      return;
    }

    if (meetingType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        setError('Please select both date and time for scheduled meeting');
        return;
      }
    }

    setCreatingMeeting(true);
    setError(null);
    setSuccess(null);

    try {
      const scheduledStartTime = meetingType === 'scheduled' 
        ? `${scheduledDate}T${scheduledTime}:00`
        : null;

      const response = await fetch('/api/zoom/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatientId || null,
          physicianIds: selectedPhysicianIds,
          meetingType: meetingType,
          topic: topic || (selectedPatientId ? `ECMO Bridge Meeting - Patient Discussion` : `ECMO Bridge Meeting`),
          scheduledStartTime: scheduledStartTime,
          duration: duration,
          timezone: 'America/Phoenix',
          storeMeeting: storeMeeting,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create meeting');
      }

      setCreatedMeeting(data.meeting);
      setSuccess('Meeting created successfully!');
      
      // Reset form
      if (meetingType === 'scheduled') {
        setScheduledDate("");
        setScheduledTime("");
        setTopic("");
      }
      setSelectedPhysicianIds([]);
      
      // Refresh meetings list if showing past meetings
      if (showPastMeetings) {
        await fetchMeetings();
      }
    } catch (err: any) {
      console.error('Error creating meeting:', err);
      setError(err.message || 'Failed to create meeting');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'started':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isMeetingUpcoming = (meeting: ZoomMeeting) => {
    const meetingType = meeting.meeting_type || meeting.meetingType;
    const scheduledTime = meeting.scheduled_start_time || meeting.scheduledStartTime;
    if (meetingType === 'instant') return false;
    if (!scheduledTime) return false;
    return new Date(scheduledTime) > new Date();
  };

  // Load available cameras and microphones
  const loadDevices = async () => {
    try {
      setLoadingDevices(true);
      // Request permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Get all devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = allDevices.filter(device => device.kind === 'videoinput');
      const microphones = allDevices.filter(device => device.kind === 'audioinput');
      
      setDevices({ cameras, microphones });
      
      // Set default selections
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
      if (microphones.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(microphones[0].deviceId);
      }
      
      // Set up local preview
      setLocalStream(stream);
    } catch (error) {
      console.error('Error loading devices:', error);
      setError('Failed to access camera/microphone. Please check your browser permissions.');
    } finally {
      setLoadingDevices(false);
    }
  };

  // Handle opening pre-join screen
  const handleJoinMeeting = (meeting: ZoomMeeting | any) => {
    // Handle both camelCase (from API) and snake_case (from database) formats
    const joinUrl = meeting.join_url || meeting.joinUrl;
    
    if (!joinUrl) {
      setError('Meeting URL not found. Please try creating a new meeting.');
      return;
    }
    
    setMeetingToJoin({
      joinUrl: joinUrl,
    });
    setShowPreJoin(true);
    loadDevices();
  };

  // Handle actually joining the meeting
  const handleConfirmJoin = () => {
    if (!meetingToJoin) return;
    
    // Stop local preview
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Determine which URL to use
    const url: string | null = meetingToJoin.joinUrl || null;
    
    // Validate URL before opening
    if (!url || !url.startsWith('http')) {
      setError('Invalid meeting URL. Please try creating a new meeting.');
      setShowPreJoin(false);
      setMeetingToJoin(null);
      return;
    }
    
    // Open Zoom meeting in new tab
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    if (!newWindow) {
      setError('Popup blocked. Please allow popups for this site and try again.');
      return;
    }
    
    // Close pre-join screen
    setShowPreJoin(false);
    setMeetingToJoin(null);
  };

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && localStream && cameraEnabled) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    } else if (videoRef.current && !cameraEnabled) {
      videoRef.current.srcObject = null;
    }
  }, [localStream, cameraEnabled]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [localStream]);

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Zoom Calls</h2>
        <p className="text-sm text-gray-600 mb-6">
          Create Zoom meetings between physicians to discuss patient cases. Meetings are physician-to-physician only.
        </p>
        
        {/* Patient Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Patient (optional - for discussion context)
          </label>
          {loadingPatients ? (
            <div className="flex items-center justify-center py-8 border border-gray-300 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg">
              <p>No patients found</p>
            </div>
          ) : (
            <select
              value={selectedPatientId || ''}
              onChange={(e) => setSelectedPatientId(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="">-- No patient selected (optional) --</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Physician Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Physicians to Invite (optional - you can select any number)
          </label>
          {loadingPhysicians ? (
            <div className="flex items-center justify-center py-8 border border-gray-300 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : physicians.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg">
              <p>No other physicians found</p>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
              {physicians.map((physician) => (
                <label
                  key={physician.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPhysicianIds.includes(physician.id)}
                    onChange={() => handlePhysicianToggle(physician.id)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    {physician.full_name || physician.username || 'Unknown'}
                  </span>
                </label>
              ))}
            </div>
          )}
          {selectedPhysicianIds.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {selectedPhysicianIds.length} physician{selectedPhysicianIds.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Meeting Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setMeetingType('instant')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                meetingType === 'instant'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Instant Meeting
            </button>
            <button
              onClick={() => setMeetingType('scheduled')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                meetingType === 'scheduled'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Schedule Meeting
            </button>
          </div>
        </div>

        {/* Scheduled Meeting Form */}
        {meetingType === 'scheduled' && (
          <div className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic/Description
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter meeting topic..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="storeMeetingScheduled"
                checked={storeMeeting}
                onChange={(e) => setStoreMeeting(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="storeMeetingScheduled" className="text-sm text-gray-700">
                Store meeting in database (for future reference)
              </label>
            </div>
          </div>
        )}

        {/* Instant Meeting Options */}
        {meetingType === 'instant' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic/Description (optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter meeting topic..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="storeMeeting"
                checked={storeMeeting}
                onChange={(e) => setStoreMeeting(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="storeMeeting" className="text-sm text-gray-700">
                Store meeting in database (for future reference)
              </label>
            </div>
          </div>
        )}

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Create Meeting Button */}
        <button
          onClick={handleCreateMeeting}
          disabled={creatingMeeting || (meetingType === 'scheduled' && (!scheduledDate || !scheduledTime))}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            creatingMeeting || (meetingType === 'scheduled' && (!scheduledDate || !scheduledTime))
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {creatingMeeting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Meeting...
            </div>
          ) : meetingType === 'instant' ? (
            'Start Instant Meeting'
          ) : (
            'Schedule Meeting'
          )}
        </button>

        {/* Created Meeting Info */}
        {createdMeeting && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Meeting Created Successfully!</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-black">Join URL:</strong>{" "}
                <a
                  href={createdMeeting.join_url || createdMeeting.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black hover:underline"
                >
                  {createdMeeting.join_url || createdMeeting.joinUrl}
                </a>
              </p>
              {createdMeeting.password && (
                <p><strong>Password:</strong> {createdMeeting.password}</p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  const joinUrl = createdMeeting.join_url || createdMeeting.joinUrl;
                  if (joinUrl) {
                    handleJoinMeeting(createdMeeting);
                  } else {
                    setError('Join URL not available');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Join Meeting
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Past Meetings List */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {selectedPatientId ? 'Meetings for Selected Patient' : 'All Meetings'}
          </h3>
          <button
            onClick={() => {
              setShowPastMeetings(!showPastMeetings);
              if (!showPastMeetings) {
                fetchMeetings();
              }
            }}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            {showPastMeetings ? 'Hide Past Meetings' : 'Show Past Meetings'}
          </button>
        </div>
        
        {!showPastMeetings ? (
          <div className="text-center py-8 text-gray-500">
            <p>Click "Show Past Meetings" to view stored meetings</p>
          </div>
        ) : loadingMeetings ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No meetings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {meeting.topic || 'ECMO Bridge Meeting'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Patient: {meeting.patients?.name || 'Unknown'}
                    </p>
                    {meeting.profiles && (
                      <p className="text-sm text-gray-600">
                        Created by: {meeting.profiles.full_name || meeting.profiles.username || 'Unknown'}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status || 'scheduled')}`}>
                    {meeting.status || 'scheduled'}
                  </span>
                </div>
                
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p><strong>Type:</strong> {(meeting.meeting_type || meeting.meetingType) === 'instant' ? 'Instant' : 'Scheduled'}</p>
                  {(meeting.meeting_type || meeting.meetingType) === 'scheduled' && (meeting.scheduled_start_time || meeting.scheduledStartTime) && (
                    <p><strong>Scheduled:</strong> {formatDateTime(meeting.scheduled_start_time || meeting.scheduledStartTime || '')}</p>
                  )}
                  <p><strong>Duration:</strong> {meeting.duration || 'N/A'} minutes</p>
                  <p><strong>Created:</strong> {formatDateTime(meeting.created_at || meeting.createdAt || '')}</p>
                </div>

                <div className="mt-4 flex gap-2">
                  {isMeetingUpcoming(meeting) && (
                    <button
                      onClick={() => handleJoinMeeting(meeting)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Join Meeting
                    </button>
                  )}
                  <a
                    href={meeting.join_url || meeting.joinUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    View Link
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-Join Meeting Modal */}
      {showPreJoin && meetingToJoin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Join Meeting</h3>
              <p className="text-gray-600 mb-6">Select your camera and microphone before joining</p>

              {/* Camera Preview */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Camera Preview
                </label>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  {localStream && cameraEnabled ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setCameraEnabled(!cameraEnabled);
                      if (localStream) {
                        const videoTrack = localStream.getVideoTracks()[0];
                        if (videoTrack) {
                          videoTrack.enabled = !cameraEnabled;
                        }
                      }
                    }}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      cameraEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                    } text-white transition-colors`}
                  >
                    {cameraEnabled ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Camera Selection */}
              {loadingDevices ? (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading devices...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Camera
                    </label>
                    <select
                      value={selectedCamera}
                      onChange={(e) => {
                        setSelectedCamera(e.target.value);
                        // Update video track
                        if (localStream) {
                          const videoTrack = localStream.getVideoTracks()[0];
                          if (videoTrack) {
                            videoTrack.stop();
                          }
                          navigator.mediaDevices.getUserMedia({
                            video: { deviceId: { exact: e.target.value } },
                            audio: microphoneEnabled ? (selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true) : false,
                          }).then(newStream => {
                            if (localStream) {
                              localStream.getVideoTracks().forEach(track => track.stop());
                            }
                            setLocalStream(newStream);
                          });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {devices.cameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Microphone Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Microphone
                    </label>
                    <select
                      value={selectedMicrophone}
                      onChange={(e) => {
                        setSelectedMicrophone(e.target.value);
                        // Update audio track
                        if (localStream) {
                          const audioTrack = localStream.getAudioTracks()[0];
                          if (audioTrack) {
                            audioTrack.stop();
                          }
                          navigator.mediaDevices.getUserMedia({
                            video: cameraEnabled ? (selectedCamera ? { deviceId: { exact: selectedCamera } } : true) : false,
                            audio: { deviceId: { exact: e.target.value } },
                          }).then(newStream => {
                            if (localStream) {
                              localStream.getAudioTracks().forEach(track => track.stop());
                            }
                            setLocalStream(newStream);
                          });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {devices.microphones.map((mic) => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                          {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setMicrophoneEnabled(!microphoneEnabled);
                        if (localStream) {
                          const audioTrack = localStream.getAudioTracks()[0];
                          if (audioTrack) {
                            audioTrack.enabled = !microphoneEnabled;
                          }
                        }
                      }}
                      className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        microphoneEnabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {microphoneEnabled ? '✓ Microphone On' : '✗ Microphone Off'}
                    </button>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (localStream) {
                      localStream.getTracks().forEach(track => track.stop());
                      setLocalStream(null);
                    }
                    setShowPreJoin(false);
                    setMeetingToJoin(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmJoin}
                  disabled={loadingDevices}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Join Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

