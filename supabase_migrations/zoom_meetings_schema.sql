-- Migration: Create zoom_meetings and zoom_meeting_participants tables
-- Run this in your Supabase SQL editor

-- Create zoom_meetings table
CREATE TABLE IF NOT EXISTS zoom_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NULL REFERENCES patients(id) ON DELETE CASCADE, -- Optional - for discussion context
  created_by_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meeting_type VARCHAR(20) NOT NULL CHECK (meeting_type IN ('instant', 'scheduled')),
  scheduled_start_time TIMESTAMPTZ,
  zoom_meeting_id BIGINT, -- Zoom's meeting ID
  zoom_meeting_number BIGINT, -- Zoom's meeting number
  join_url TEXT NOT NULL,
  start_url TEXT NOT NULL, -- Host URL
  topic TEXT,
  duration INTEGER, -- Meeting duration in minutes
  timezone VARCHAR(100),
  password VARCHAR(100), -- Meeting password if set
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, started, ended, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create zoom_meeting_participants table
CREATE TABLE IF NOT EXISTS zoom_meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES zoom_meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'participant', -- host, participant
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_patient_id ON zoom_meetings(patient_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_created_by_user_id ON zoom_meetings(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_status ON zoom_meetings(status);
CREATE INDEX IF NOT EXISTS idx_zoom_meeting_participants_meeting_id ON zoom_meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meeting_participants_user_id ON zoom_meeting_participants(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_zoom_meetings_updated_at BEFORE UPDATE ON zoom_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

