import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Order } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createServiceClient()

  const [{ data: restaurants }, { data: orders }, { data: riders }] = await Promise.all([
    supabase.from('restaurants').select('*').order('name'),
    supabase.from('orders').select('*, restaurants(name, slug)').order('created_at', { ascending: false }).limit(20),
    supabase.from('riders').select('*').order('name'),
  ])

  const activeOrders = (orders ?? []).filter((o: Order) =>
    !['delivered', 'rejected', 'cancelled'].includes(o.status)
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Restaurants" value={restaurants?.length ?? 0} icon="🍽️" href="/admin/restaurants" />
        <StatCard label="Riders" value={riders?.length ?? 0} icon="🛵" href="/admin/riders" />
        <StatCard label="Active Orders" value={activeOrders.length} icon="📋" href="/admin/orders" />
        <StatCard label="Total Orders" value={orders?.length ?? 0} icon="✅" href="/admin/orders" />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
        </div>
        {orders?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Order</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Restaurant</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Customer</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium hidden lg:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer group">
                    <td className="py-3 px-3 font-mono text-xs">
                      <Link href={`/order/${order.tracking_token}`} target="_blank" className="text-orange-500 hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-gray-700 hidden md:table-cell">{order.restaurants?.name}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-400">{order.customer_phone}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-orange-500">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS])}>
                        {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-400 hidden lg:table-cell">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, href }: { label: string; value: number; icon: string; href?: string }) {
  const content = (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : <div>{content}</div>
}
