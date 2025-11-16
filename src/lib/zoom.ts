/**
 * Zoom API integration utilities
 * Handles Server-to-Server OAuth token generation and Zoom API client setup
 */

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
  console.warn('Zoom OAuth credentials not found. Zoom features will not work.');
}

// Cache for access token to avoid regenerating on every request
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth access token for Zoom API
 * Uses Server-to-Server OAuth flow
 * Tokens are cached and refreshed automatically
 */
export async function getZoomAccessToken(): Promise<string> {
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error('Zoom OAuth credentials are not configured. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in your .env file.');
  }

  // Check if we have a valid cached token (with 5 minute buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  // Create Basic Auth header (ClientID:ClientSecret, Base64 encoded)
  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

  // Request access token using Server-to-Server OAuth
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(ZOOM_ACCOUNT_ID)}`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error', error_description: response.statusText }));
    const errorMessage = errorData.error_description || errorData.error || response.statusText;
    
    // Provide helpful error messages
    if (errorData.error === 'invalid_client') {
      throw new Error(
        `Invalid Zoom OAuth credentials. Please verify:\n` +
        `1. ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET are correct\n` +
        `2. Your Server-to-Server OAuth app is activated in Zoom Marketplace\n` +
        `3. The credentials match exactly (no extra spaces or quotes)\n` +
        `Original error: ${errorMessage}`
      );
    }
    
    throw new Error(`Failed to get Zoom access token: ${errorMessage}`);
  }

  const data = await response.json();
  
  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000), // expires_in is in seconds
  };

  return cachedToken.token;
}

/**
 * Create an "instant" Zoom meeting.
 *
 * Implementation detail:
 * - We actually create a scheduled meeting that starts "now" (type 2)
 *   instead of Zoom's true instant meeting (type 1).
 * - Scheduled meetings respect `join_before_host` more reliably, which
 *   helps avoid the "Waiting for the host to start this meeting" screen.
 *
 * @param topic - Meeting topic/name
 * @param duration - Meeting duration in minutes (optional, default 30)
 * @returns Zoom meeting details
 */
export async function createInstantMeeting(
  topic: string,
  duration: number = 30
): Promise<{
  id: number;
  join_url: string;
  start_url: string;
  meeting_number: number;
  password?: string;
  topic: string;
  duration: number;
  timezone: string;
}> {
  const token = await getZoomAccessToken();

  // Start the meeting "now" so it behaves like an instant meeting for users
  const startTime = new Date().toISOString();

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: topic || 'ECMO Bridge Meeting',
      type: 2, // Scheduled meeting (starting now, behaves like instant)
      start_time: startTime,
      timezone: 'America/Phoenix',
      duration: duration,
      settings: {
        host_video: true,
        participant_video: true,
        // Allow participants (physicians) to join without a host and without a waiting room
        join_before_host: true,
        mute_upon_entry: false,
        waiting_room: false,
        approval_type: 0, // Automatically approve
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Zoom API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  
  return {
    id: data.id,
    join_url: data.join_url,
    start_url: data.start_url,
    meeting_number: data.meeting_number,
    password: data.password,
    topic: data.topic,
    duration: data.duration,
    timezone: data.timezone,
  };
}

/**
 * Create a scheduled Zoom meeting
 * @param topic - Meeting topic/name
 * @param startTime - ISO 8601 formatted start time
 * @param duration - Meeting duration in minutes
 * @param timezone - Timezone (e.g., 'America/Phoenix')
 * @returns Zoom meeting details
 */
export async function createScheduledMeeting(
  topic: string,
  startTime: string,
  duration: number = 60,
  timezone: string = 'America/Phoenix'
): Promise<{
  id: number;
  join_url: string;
  start_url: string;
  meeting_number: number;
  password?: string;
  topic: string;
  duration: number;
  start_time: string;
  timezone: string;
}> {
  const token = await getZoomAccessToken();

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: topic || 'ECMO Bridge Meeting',
      type: 2, // Scheduled meeting
      start_time: startTime,
      duration: duration,
      timezone: timezone,
      settings: {
        host_video: true,
        participant_video: true,
        // Allow participants (physicians) to join without a host and without a waiting room
        join_before_host: true,
        mute_upon_entry: false,
        waiting_room: false,
        approval_type: 0, // Automatically approve
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Zoom API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  
  return {
    id: data.id,
    join_url: data.join_url,
    start_url: data.start_url,
    meeting_number: data.meeting_number,
    password: data.password,
    topic: data.topic,
    duration: data.duration,
    start_time: data.start_time,
    timezone: data.timezone,
  };
}

