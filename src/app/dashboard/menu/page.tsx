import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import MenuManager from '@/components/dashboard/MenuManager'

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Menu Management</h1>
      <MenuManager
        restaurant={restaurant}
        categories={categories ?? []}
        items={items ?? []}
      />
    </div>
  )
}
