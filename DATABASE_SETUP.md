# Supabase Database Setup Guide

## Prerequisites

You need a Supabase account and project. Supabase provides a PostgreSQL database with a nice API.

### Setup Steps

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Get Your Credentials**
   - Go to your project dashboard
   - Navigate to Settings > API
   - Copy your Project URL and anon public key

3. **Add to Environment Variables**
   - Create `.env.local` file in your project root
   - Add your Supabase credentials

## Environment Variables

Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Database Schema

Create these tables in your Supabase database using the SQL Editor:

```sql
-- Patients table
CREATE TABLE patients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  condition TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  ecmo_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ECMO Machines table
CREATE TABLE ecmo_machines (
  id BIGSERIAL PRIMARY KEY,
  machine_id VARCHAR(100) UNIQUE NOT NULL,
  model VARCHAR(255),
  status VARCHAR(50) DEFAULT 'available',
  assigned_patient_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  ecmo_id BIGINT REFERENCES ecmo_machines(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_ecmo_status ON ecmo_machines(status);
CREATE INDEX idx_matches_patient ON matches(patient_id);
CREATE INDEX idx_matches_ecmo ON matches(ecmo_id);

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecmo_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize based on your needs)
CREATE POLICY "Allow all operations on patients" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all operations on ecmo_machines" ON ecmo_machines FOR ALL USING (true);
CREATE POLICY "Allow all operations on matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages FOR ALL USING (true);
```

## Usage Examples

### Basic Supabase Query
```typescript
import { supabase } from '@/lib/db';

const { data, error } = await supabase
  .from('patients')
  .select('*');
```

### Using Helper Functions
```typescript
import { getAllPatients, createPatient } from '@/lib/queries';

// Get all patients
const patients = await getAllPatients();

// Create a new patient
const newPatient = await createPatient({
  name: 'John Doe',
  age: 45,
  condition: 'Respiratory failure'
});
```

### Real-time Subscriptions
```typescript
import { supabase } from '@/lib/db';

// Listen to changes in patients table
const subscription = supabase
  .channel('patients')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'patients' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
```

## Testing Your Connection

Create a test API route at `src/app/api/test-db/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('count(*)');
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      count: data[0].count 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

Then visit: `http://localhost:3000/api/test-db`

## Important Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Supabase handles connection pooling** - No need to manage connections
3. **Built-in security** - Row Level Security (RLS) is enabled
4. **Real-time features** - Built-in subscriptions for live updates
5. **Type safety** - Generate TypeScript types from your schema

## Supabase Features

- ✅ **PostgreSQL database** - Full SQL support
- ✅ **Real-time subscriptions** - Live data updates
- ✅ **Authentication** - Built-in user management
- ✅ **Storage** - File uploads
- ✅ **Edge Functions** - Serverless functions
- ✅ **Dashboard** - Visual database management

## Troubleshooting

### Connection Issues
- Verify your Supabase URL and anon key
- Check if your project is active
- Ensure you're using the correct environment variables

### RLS (Row Level Security) Issues
- Check your table policies in Supabase dashboard
- Make sure policies allow the operations you're trying to perform
- Test with the Supabase dashboard first

### Type Generation
Generate TypeScript types from your schema:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```
