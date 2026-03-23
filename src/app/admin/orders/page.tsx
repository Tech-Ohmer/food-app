import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import AdminOrderActions from '@/components/admin/OrderActions'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const supabase = await createServiceClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, restaurants(name), riders(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const active = (orders ?? []).filter((o: any) => !['delivered', 'rejected', 'cancelled'].includes(o.status))
  const history = (orders ?? []).filter((o: any) => ['delivered', 'rejected', 'cancelled'].includes(o.status))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Orders</h1>

      {/* Active orders */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Active — {active.length}
        </h2>
        <div className="space-y-3">
          {active.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">No active orders.</div>
          ) : active.map((order: any) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            History — {history.length}
          </h2>
          <div className="space-y-2">
            {history.map((order: any) => (
              <OrderRow key={order.id} order={order} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OrderRow({ order, compact = false }: { order: any; compact?: boolean }) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm', compact ? 'p-3' : 'p-5')}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/order/${order.tracking_token}`}
              target="_blank"
              className="font-bold text-gray-900 hover:text-orange-500 font-mono"
            >
              {order.order_number}
            </Link>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS])}>
              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
            </span>
          </div>
          {!compact && (
            <div className="text-sm text-gray-600 space-y-0.5">
              <p><span className="text-gray-400">Restaurant:</span> {order.restaurants?.name}</p>
              <p><span className="text-gray-400">Customer:</span> {order.customer_name} · {order.customer_phone}</p>
              <p><span className="text-gray-400">Address:</span> {order.delivery_address}</p>
              {order.notes && <p><span className="text-gray-400">Notes:</span> {order.notes}</p>}
            </div>
          )}
          {compact && (
            <p className="text-xs text-gray-400">{order.restaurants?.name} · {order.customer_name} · {formatDate(order.created_at)}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold text-orange-500 text-lg">{formatCurrency(order.total)}</p>
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
        </div>
      </div>

      {!compact && !['delivered', 'rejected', 'cancelled'].includes(order.status) && (
        <AdminOrderActions orderId={order.id} currentStatus={order.status} />
      )}
    </div>
  )
}
