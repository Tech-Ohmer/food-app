import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client to bypass RLS — restaurant owners can see their restaurant even if deactivated
  const serviceClient = await createServiceClient()
  const { data: restaurant } = await serviceClient
    .from('restaurants')
    .select('id, name, slug, is_open')
    .eq('owner_email', user.email ?? '')
    .single()

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">🍽️</div>
          <p className="text-lg font-medium">No restaurant found for your account.</p>
          <p className="text-sm mt-1">Contact the super admin to set up your restaurant.</p>
          <form action="/api/auth/logout" method="POST" className="mt-4">
            <button className="text-sm text-red-500 hover:underline">Sign out</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-orange-500 text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">🍔 {restaurant.name}</span>
          <div className="flex gap-1">
            <Link href="/dashboard" className="px-3 py-1.5 text-sm rounded-lg hover:bg-orange-400 transition-colors">
              Orders
            </Link>
            <Link href="/dashboard/menu" className="px-3 py-1.5 text-sm rounded-lg hover:bg-orange-400 transition-colors">
              Menu
            </Link>
            <Link href="/dashboard/remittances" className="px-3 py-1.5 text-sm rounded-lg hover:bg-orange-400 transition-colors">
              💰 Remittances
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${restaurant.is_open ? 'bg-green-400 text-white' : 'bg-white/20 text-white'}`}>
            {restaurant.is_open ? 'Open' : 'Closed'}
          </span>
          <span className="text-orange-200 text-sm hidden sm:inline">{user.email}</span>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm text-white/70 border border-white/30 px-3 py-1.5 rounded-lg hover:bg-orange-400 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
