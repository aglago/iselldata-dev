import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()

    // First, let's try to create the admin_sessions table manually
    console.log("Attempting to create admin_sessions table...")

    // Step 1: Create the table via direct SQL if possible
    const sqlQueries = [
      `CREATE TABLE IF NOT EXISTS public.admin_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        user_data JSONB NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(admin_id)
      );`,
      `ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;`,
      `DO $$ BEGIN
        CREATE POLICY "Allow public access to admin_sessions" 
        ON public.admin_sessions FOR ALL USING (true);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;`,
      `CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);`,
      `CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);`
    ]

    for (const sql of sqlQueries) {
      try {
        const { error } = await supabase.rpc('exec', { sql })
        if (error) {
          console.log(`SQL execution note: ${error.message}`)
        }
      } catch (err) {
        console.log(`SQL execution attempt: ${sql.substring(0, 50)}...`)
      }
    }

    // Test if the table now exists
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'admin_sessions table still does not exist',
        message: 'Please create the table manually in Supabase SQL editor',
        sql: `-- Copy and paste this SQL into your Supabase SQL editor:

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  user_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id)
);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to admin_sessions" 
ON public.admin_sessions FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);`
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'admin_sessions table created and accessible',
      data: data 
    })

  } catch (error) {
    console.error('Table creation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: 'Please create the admin_sessions table manually in Supabase SQL editor'
    }, { status: 500 })
  }
}