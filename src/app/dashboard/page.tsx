import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Order, OrderItem, OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import DashboardOrderList from '@/components/dashboard/OrderList'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
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

  const { data: orders } = await serviceClient
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const activeOrders = (orders ?? []).filter((o: Order) =>
    !['delivered', 'rejected', 'cancelled'].includes(o.status)
  ) as (Order & { order_items: OrderItem[] })[]

  const historyOrders = (orders ?? []).filter((o: Order) =>
    ['delivered', 'rejected', 'cancelled'].includes(o.status)
  ) as (Order & { order_items: OrderItem[] })[]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <ToggleOpenButton restaurantId={restaurant.id} isOpen={restaurant.is_open} slug={restaurant.slug} />
        </div>
      </div>

      <DashboardOrderList
        activeOrders={activeOrders}
        historyOrders={historyOrders}
        restaurantId={restaurant.id}
      />
    </div>
  )
}

function ToggleOpenButton({ restaurantId, isOpen, slug }: { restaurantId: string; isOpen: boolean; slug: string }) {
  return (
    <form action={async () => {
      'use server'
      const { toggleRestaurantOpen } = await import('@/app/actions/menu')
      await toggleRestaurantOpen(restaurantId, !isOpen, slug)
    }}>
      <button
        type="submit"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isOpen
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        {isOpen ? 'Close Restaurant' : 'Open Restaurant'}
      </button>
    </form>
  )
}
