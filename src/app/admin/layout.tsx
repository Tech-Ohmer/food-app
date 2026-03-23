import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

const ADMIN_USERNAMES = (process.env.ADMIN_GITHUB_USERNAMES ?? '')
  .split(',').map(u => u.trim().toLowerCase()).filter(Boolean)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userEmail = user.email?.toLowerCase() ?? ''
  const userGithubUsername = (user.user_metadata?.user_name ?? '').toLowerCase()

  const emailAllowed = ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(userEmail)
  const usernameAllowed = ADMIN_USERNAMES.length > 0 && ADMIN_USERNAMES.includes(userGithubUsername)

  if (!emailAllowed && !usernameAllowed) {
    redirect(`/unauthorized?email=${encodeURIComponent(userEmail)}&username=${encodeURIComponent(userGithubUsername)}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">🍔 OhmerEats Admin</span>
          <div className="flex gap-1">
            <Link href="/admin" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 transition-colors">Overview</Link>
            <Link href="/admin/orders" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 transition-colors">Orders</Link>
            <Link href="/admin/restaurants" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 transition-colors">Restaurants</Link>
            <Link href="/admin/riders" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 transition-colors">Riders</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm hidden sm:inline">{user.email}</span>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg hover:border-gray-500 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  )
}
