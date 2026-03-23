'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateRiderLocation, markOrderDelivered } from '@/app/actions/riders'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Order, OrderItem, Restaurant } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'

type OrderWithDetails = Order & { restaurants: Restaurant; order_items: OrderItem[] }

export default function RiderPage() {
  const [rider, setRider] = useState<any>(null)
  const [currentOrder, setCurrentOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [delivering, setDelivering] = useState(false)
  const [delivered, setDelivered] = useState(false)

  useEffect(() => {
    async function loadRider() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: riderData } = await supabase
        .from('riders')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!riderData) { setError('Rider profile not found. Contact admin.'); setLoading(false); return }

      setRider(riderData)

      // Get current assigned order
      const { data: order } = await supabase
        .from('orders')
        .select('*, restaurants(*), order_items(*)')
        .eq('rider_id', riderData.id)
        .eq('status', 'out_for_delivery')
        .single()

      setCurrentOrder(order as OrderWithDetails)
      setLoading(false)
    }
    loadRider()
  }, [])

  const startSharingLocation = useCallback(() => {
    if (!rider) return
    setSharing(true)

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        await updateRiderLocation(rider.id, pos.coords.latitude, pos.coords.longitude)
      },
      (err) => console.error('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [rider])

  async function handleMarkDelivered() {
    if (!currentOrder || delivering) return
    setDelivering(true)
    setError(null)
    try {
      const result = await markOrderDelivered(currentOrder.id)
      if (result.success) {
        setDelivered(true)
        setCurrentOrder(null)
        setSharing(false)
      } else {
        setError(result.error ?? 'Failed to mark as delivered. Please try again.')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.')
    } finally {
      setDelivering(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">🛵 Rider Dashboard</h1>
          <p className="text-orange-200 text-sm">{rider?.name}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button className="text-sm text-orange-200 hover:text-white">Sign out</button>
        </form>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Delivered success */}
        {delivered && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Delivered!</h2>
            <p className="text-gray-500">Order has been delivered successfully.</p>
            <p className="text-orange-500 font-bold text-xl mt-4">₱ collected from customer ✓</p>
          </div>
        )}

        {!delivered && !currentOrder ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
            <div className="text-5xl mb-4">🛵</div>
            <p className="text-lg font-medium">No active delivery</p>
            <p className="text-sm mt-1">You will be assigned orders by the admin.</p>
          </div>
        ) : !delivered && currentOrder ? (
          <>
            {/* Current order */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-mono text-gray-400">{currentOrder.order_number}</p>
                  <h2 className="text-xl font-bold text-gray-900">{currentOrder.restaurants?.name}</h2>
                </div>
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', ORDER_STATUS_COLORS[currentOrder.status])}>
                  {ORDER_STATUS_LABELS[currentOrder.status]}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="font-semibold text-orange-700 mb-1">📍 Deliver to:</p>
                  <p className="text-gray-800">{currentOrder.customer_name}</p>
                  <p className="text-gray-600">{currentOrder.customer_phone}</p>
                  <p className="text-gray-800 font-medium">{currentOrder.delivery_address}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-700 mb-2">Order items:</p>
                  {currentOrder.order_items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 font-bold text-orange-500 flex justify-between">
                    <span>Total (collect)</span>
                    <span>{formatCurrency(currentOrder.total)}</span>
                  </div>
                </div>

                {currentOrder.notes && (
                  <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                    <span className="font-medium">Notes: </span>{currentOrder.notes}
                  </div>
                )}
              </div>
            </div>

            {/* GPS sharing */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Live Location</h3>
              {!sharing ? (
                <button
                  onClick={startSharingLocation}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm"
                >
                  📍 Start Sharing My Location
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 text-center">
                  ✓ Sharing live location — customer can see you on the map
                </div>
              )}
            </div>

            {/* Mark delivered */}
            <button
              onClick={handleMarkDelivered}
              disabled={delivering}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg shadow-sm transition-colors"
            >
              {delivering ? 'Marking as delivered...' : '✓ Mark as Delivered'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
