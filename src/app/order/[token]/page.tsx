import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { OrderWithDetails, OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_STEPS } from '@/types'
import dynamic from 'next/dynamic'

const LiveMap = dynamic(() => import('@/components/customer/LiveMap'), { ssr: false })

export const dynamic_config = 'force-dynamic'

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, restaurants(*), riders(*), order_items(*)')
    .eq('tracking_token', token)
    .single()

  if (!order) notFound()

  const typedOrder = order as OrderWithDetails
  const stepIndex = ORDER_STATUS_STEPS.indexOf(typedOrder.status)
  const hasRider = typedOrder.riders && typedOrder.riders.current_lat && typedOrder.riders.current_lng

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-500 text-white py-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-bold text-lg">🍔 OhmerEats</span>
          <Link href="/" className="text-orange-100 hover:text-white text-sm">Order more</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <p className="text-xs font-mono text-gray-400 mb-1">{typedOrder.order_number}</p>
              <h1 className="text-xl font-bold text-gray-900">{typedOrder.restaurants.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{formatDate(typedOrder.created_at)}</p>
            </div>
            <span className={cn('text-sm px-3 py-1.5 rounded-full font-semibold', ORDER_STATUS_COLORS[typedOrder.status])}>
              {ORDER_STATUS_LABELS[typedOrder.status]}
            </span>
          </div>

          {/* Progress Steps */}
          {typedOrder.status !== 'rejected' && typedOrder.status !== 'cancelled' && (
            <div className="flex items-start mt-4">
              {ORDER_STATUS_STEPS.map((step, idx) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0',
                      idx <= stepIndex ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-300 text-gray-400'
                    )}>
                      {idx < stepIndex ? '✓' : idx + 1}
                    </div>
                    <span className={cn('text-xs mt-1 text-center leading-tight', idx <= stepIndex ? 'text-orange-600 font-medium' : 'text-gray-400')}>
                      {ORDER_STATUS_LABELS[step]}
                    </span>
                  </div>
                  {idx < ORDER_STATUS_STEPS.length - 1 && (
                    <div className={cn('h-0.5 flex-1 mb-4', idx < stepIndex ? 'bg-orange-500' : 'bg-gray-200')} />
                  )}
                </div>
              ))}
            </div>
          )}

          {(typedOrder.status === 'rejected' || typedOrder.status === 'cancelled') && (
            <div className="bg-red-50 rounded-lg px-4 py-3 text-sm text-red-700 mt-4">
              Your order was {typedOrder.status}. Please try ordering again.
            </div>
          )}
        </div>

        {/* Live Map (when rider is assigned and out for delivery) */}
        {typedOrder.status === 'out_for_delivery' && typedOrder.riders && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">🛵 Rider on the way!</h2>
              <p className="text-sm text-gray-500">{typedOrder.riders.name}</p>
            </div>
            <div className="h-64">
              <LiveMap
                orderId={typedOrder.id}
                riderId={typedOrder.rider_id ?? ''}
                initialLat={typedOrder.riders.current_lat ?? 14.5995}
                initialLng={typedOrder.riders.current_lng ?? 120.9842}
              />
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Your Order</h2>
          <div className="space-y-2">
            {typedOrder.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(typedOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery fee</span><span>{formatCurrency(typedOrder.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span className="text-orange-500">{formatCurrency(typedOrder.total)}</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">Payment: Cash on Delivery</div>
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Delivery Details</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{typedOrder.customer_name}</span></div>
            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{typedOrder.customer_phone}</span></div>
            <div><span className="text-gray-500">Address:</span> <span className="font-medium">{typedOrder.delivery_address}</span></div>
            {typedOrder.notes && <div><span className="text-gray-500">Notes:</span> <span className="font-medium">{typedOrder.notes}</span></div>}
          </div>
        </div>

        <p className="text-xs text-center text-gray-400">
          Bookmark this page to track your order anytime.
        </p>
      </div>
    </div>
  )
}
