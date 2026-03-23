import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GitHub OAuth (for Super Admin)
export async function POST() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })
  if (error || !data.url) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', process.env.NEXT_PUBLIC_APP_URL!), { status: 303 })
  }
  return NextResponse.redirect(data.url, { status: 303 })
}
