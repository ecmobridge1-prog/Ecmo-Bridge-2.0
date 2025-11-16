import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createInstantMeeting, createScheduledMeeting } from '@/lib/zoom';
import { createZoomMeeting, addZoomMeetingParticipant } from '@/lib/queries';
import { clerkIdToUuid } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    const body = await request.json();
    const { 
      patientId = null, // Optional - patient for discussion context
      physicianIds = [], // Array of physician UUIDs to invite
      meetingType, 
      topic, 
      scheduledStartTime, 
      duration, 
      timezone,
      storeMeeting = true // Optional - whether to store meeting in database
    } = body;

    if (!meetingType || !['instant', 'scheduled'].includes(meetingType)) {
      return NextResponse.json(
        { success: false, error: 'Meeting type must be "instant" or "scheduled"' },
        { status: 400 }
      );
    }

    if (meetingType === 'scheduled' && !scheduledStartTime) {
      return NextResponse.json(
        { success: false, error: 'Scheduled start time is required for scheduled meetings' },
        { status: 400 }
      );
    }

    const userUuid = clerkIdToUuid(userId);
    let zoomMeetingData;

    // Create Zoom meeting via API
    if (meetingType === 'instant') {
      zoomMeetingData = await createInstantMeeting(
        topic || `ECMO Bridge Meeting - Patient Discussion`,
        duration || 30
      );
    } else {
      zoomMeetingData = await createScheduledMeeting(
        topic || `ECMO Bridge Meeting - Patient Discussion`,
        scheduledStartTime,
        duration || 60,
        timezone || 'America/Phoenix'
      );
    }

    // Store meeting in database only if requested
    let meetingRecord = null;
    if (storeMeeting) {
      // Validate patientId if provided (must be valid UUID if not null)
      if (patientId && typeof patientId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid patient ID format' },
          { status: 400 }
        );
      }

      meetingRecord = await createZoomMeeting({
        patientId: patientId || null,
        createdByUserId: userUuid,
        meetingType,
        scheduledStartTime: meetingType === 'scheduled' ? scheduledStartTime : null,
        zoomMeetingId: zoomMeetingData.id,
        zoomMeetingNumber: zoomMeetingData.meeting_number,
        joinUrl: zoomMeetingData.join_url,
        startUrl: zoomMeetingData.start_url,
        topic: zoomMeetingData.topic,
        duration: zoomMeetingData.duration,
        timezone: zoomMeetingData.timezone || timezone || 'America/Phoenix',
        password: zoomMeetingData.password || null,
      });

      // Add creator as host participant
      await addZoomMeetingParticipant(meetingRecord.id, userUuid, 'host');

      // Add selected physicians as participants
      if (Array.isArray(physicianIds) && physicianIds.length > 0) {
        // Add all selected physicians as participants
        await Promise.all(
          physicianIds.map((physicianId: string) =>
            addZoomMeetingParticipant(meetingRecord!.id, physicianId, 'participant')
          )
        );
      }
    }

    return NextResponse.json({
      success: true,
      meeting: meetingRecord ? {
        id: meetingRecord.id,
        patientId: meetingRecord.patient_id,
        meetingType: meetingRecord.meeting_type,
        scheduledStartTime: meetingRecord.scheduled_start_time,
        joinUrl: meetingRecord.join_url,
        startUrl: meetingRecord.start_url,
        topic: meetingRecord.topic,
        duration: meetingRecord.duration,
        timezone: meetingRecord.timezone,
        status: meetingRecord.status,
        createdAt: meetingRecord.created_at,
      } : {
        // Return meeting data even if not stored
        id: null,
        patientId: patientId,
        meetingType: meetingType,
        scheduledStartTime: meetingType === 'scheduled' ? scheduledStartTime : null,
        joinUrl: zoomMeetingData.join_url,
        startUrl: zoomMeetingData.start_url,
        topic: zoomMeetingData.topic,
        duration: zoomMeetingData.duration,
        timezone: zoomMeetingData.timezone || timezone || 'America/Phoenix',
        status: 'created',
        createdAt: new Date().toISOString(),
      },
      stored: storeMeeting,
    });
  } catch (error: any) {
    console.error('Error creating Zoom meeting:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create Zoom meeting' 
      },
      { status: 500 }
    );
  }
}

