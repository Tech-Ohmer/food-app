import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { MenuItem, MenuCategory } from '@/types'
import DashboardMenuEditor from '@/components/dashboard/MenuEditor'

export const dynamic = 'force-dynamic'

export default async function DashboardMenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = await createServiceClient()

  const { data: restaurant } = await serviceClient
    .from('restaurants')
    .select('*')
    .eq('owner_email', user.email ?? '')
    .single()

  if (!restaurant) redirect('/login')

  const { data: categories } = await serviceClient
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order')

  const { data: items } = await serviceClient
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">{restaurant.name}</p>
      </div>
      <DashboardMenuEditor
        restaurant={restaurant}
        categories={(categories ?? []) as MenuCategory[]}
        items={(items ?? []) as MenuItem[]}
      />
    </div>
  )
}
