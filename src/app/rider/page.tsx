'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  claimOrder,
  confirmPickup,
  logRemittance,
} from '@/app/actions/remittance'
import { markOrderDelivered, updateRiderLocation } from '@/app/actions/riders'
import { formatCurrency, cn } from '@/lib/utils'
import type { Order, OrderItem, Restaurant, RemitStatus } from '@/types'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  REMIT_STATUS_LABELS,
  REMIT_STATUS_COLORS,
} from '@/types'

type OrderWithDetails = Order & {
  restaurants: Restaurant
  order_items: OrderItem[]
}

type Tab = 'available' | 'active' | 'remittance' | 'earnings'

export default function RiderPage() {
  const [rider, setRider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('available')
  const [availableOrders, setAvailableOrders] = useState<OrderWithDetails[]>([])
  const [activeOrder, setActiveOrder] = useState<OrderWithDetails | null>(null)
  const [pendingRemittances, setPendingRemittances] = useState<OrderWithDetails[]>([])
  const [todayEarnings, setTodayEarnings] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [sharing, setSharing] = useState(false)
  const watchRef = useRef<number | null>(null)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [delivering, setDelivering] = useState(false)
  const [delivered, setDelivered] = useState(false)
  const [pickupConfirming, setPickupConfirming] = useState(false)
  const [remitForm, setRemitForm] = useState<{ orderId: string; amount: string; type: 'partial' | 'full'; notes: string } | null>(null)
  const [remitting, setRemitting] = useState(false)
  const [remitSuccess, setRemitSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    loadRider()
  }, [])

  async function loadRider() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: riderData } = await supabase.from('riders').select('*').eq('user_id', user.id).single()
    if (!riderData) { setError('Rider profile not found. Contact admin.'); setLoading(false); return }
    setRider(riderData)
    await loadAllData(riderData.id)
    setLoading(false)
    const channel = supabase.channel('rider-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadAllData(riderData.id))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }

  async function loadAllData(riderId: string) {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const [available, active, remittances, todayOrders, allOrders] = await Promise.all([
      supabase.from('orders').select('*, restaurants(*), order_items(*)').eq('status', 'ready_for_pickup').is('rider_id', null).order('created_at', { ascending: true }),
      supabase.from('orders').select('*, restaurants(*), order_items(*)').eq('rider_id', riderId).in('status', ['rider_claimed', 'out_for_delivery']).order('created_at', { ascending: false }).limit(1),
      supabase.from('orders').select('*, restaurants(*), order_items(*)').eq('rider_id', riderId).eq('status', 'delivered').neq('remit_status', 'full').order('created_at', { ascending: false }),
      supabase.from('orders').select('rider_earnings, delivery_fee').eq('rider_id', riderId).eq('status', 'delivered').gte('updated_at', today + 'T00:00:00'),
      supabase.from('orders').select('rider_earnings, delivery_fee').eq('rider_id', riderId).eq('status', 'delivered'),
    ])
    setAvailableOrders((available.data ?? []) as OrderWithDetails[])
    setActiveOrder((active.data?.[0] ?? null) as OrderWithDetails | null)
    setPendingRemittances((remittances.data ?? []) as OrderWithDetails[])
    setTodayEarnings((todayOrders.data ?? []).reduce((s, o) => s + (o.rider_earnings ?? o.delivery_fee ?? 50), 0))
    setTotalEarnings((allOrders.data ?? []).reduce((s, o) => s + (o.rider_earnings ?? o.delivery_fee ?? 50), 0))
  }

  async function handleClaim(orderId: string) {
    if (!rider) return
    setClaiming(orderId)
    setActionError(null)
    const result = await claimOrder(orderId, rider.id)
    if (!result.success) { setActionError(result.error ?? 'Could not claim order.') }
    else { setTab('active'); await loadAllData(rider.id) }
    setClaiming(null)
  }

  async function handleConfirmPickup() {
    if (!activeOrder) return
    setPickupConfirming(true)
    setActionError(null)
    const result = await confirmPickup(activeOrder.id)
    if (!result.success) { setActionError(result.error ?? 'Failed.') }
    else { startSharingLocation(); await loadAllData(rider.id) }
    setPickupConfirming(false)
  }

  async function handleMarkDelivered() {
    if (!activeOrder || delivering) return
    setDelivering(true)
    setActionError(null)
    const result = await markOrderDelivered(activeOrder.id)
    if (!result.success) { setActionError(result.error ?? 'Failed.') }
    else {
      stopSharingLocation()
      setDelivered(true)
      await loadAllData(rider.id)
      setTimeout(() => { setDelivered(false); setTab('remittance') }, 2000)
    }
    setDelivering(false)
  }

  function startSharingLocation() {
    if (!rider || !navigator.geolocation) return
    setSharing(true)
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => { await updateRiderLocation(rider.id, pos.coords.latitude, pos.coords.longitude) },
      (err) => console.error('GPS:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
  }

  function stopSharingLocation() {
    if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null }
    setSharing(false)
  }

  async function handleRemit(e: React.FormEvent) {
    e.preventDefault()
    if (!remitForm || !rider) return
    setRemitting(true)
    setActionError(null)
    const result = await logRemittance({
      orderId: remitForm.orderId,
      riderId: rider.id,
      amount: parseFloat(remitForm.amount),
      remitType: remitForm.type,
      notes: remitForm.notes,
    })
    if (!result.success) { setActionError(result.error ?? 'Failed.') }
    else {
      setRemitSuccess('Remittance logged!')
      setRemitForm(null)
      await loadAllData(rider.id)
      setTimeout(() => setRemitSuccess(null), 3000)
    }
    setRemitting(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 p-4">{error}</div>

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'available', label: '📦 Available', badge: availableOrders.length },
    { id: 'active', label: '🛵 Active', badge: activeOrder ? 1 : 0 },
    { id: 'remittance', label: '💰 Remit', badge: pendingRemittances.length },
    { id: 'earnings', label: '📊 Earnings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">🛵 Rider Dashboard</h1>
            <p className="text-orange-200 text-sm">{rider?.name}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm text-orange-200 hover:text-white">Sign out</button>
          </form>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex-1 py-3 text-xs font-medium text-center transition-colors',
                tab === t.id ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700'
              )}>
              {t.label}
              {(t.badge ?? 0) > 0 && <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between">
            {actionError}
            <button onClick={() => setActionError(null)} className="ml-2 text-red-400">✕</button>
          </div>
        )}
        {remitSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">✓ {remitSuccess}</div>
        )}

        {/* AVAILABLE */}
        {tab === 'available' && (
          <div className="space-y-3">
            {availableOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
                <div className="text-4xl mb-3">📦</div>
                <p className="font-medium">No orders available right now</p>
                <p className="text-sm mt-1">Orders appear when restaurants mark them ready for pickup</p>
              </div>
            ) : availableOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-500">{order.restaurants?.name}</p>
                  </div>
                  <span className="text-lg font-bold text-orange-500">{formatCurrency(order.total)}</span>
                </div>
                <div className="text-sm text-gray-600 mb-3 space-y-1">
                  <p>👤 {order.customer_name} · {order.customer_phone}</p>
                  <p>📍 {order.delivery_address}</p>
                  {order.notes && <p>📝 {order.notes}</p>}
                </div>
                <div className="bg-orange-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-orange-700">Your earnings:</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(order.delivery_fee)}</p>
                  <p className="text-xs text-orange-500">Remit ₱{order.subtotal.toFixed(2)} to restaurant after delivery</p>
                </div>
                <div className="space-y-1 text-xs text-gray-500 mb-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handleClaim(order.id)} disabled={claiming === order.id}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-colors">
                  {claiming === order.id ? 'Claiming...' : '✓ Accept Delivery'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVE */}
        {tab === 'active' && (
          <div className="space-y-4">
            {delivered && (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h2 className="text-xl font-bold text-green-600">Delivered!</h2>
                <p className="text-gray-500 text-sm mt-1">Redirecting to remittance...</p>
              </div>
            )}
            {!delivered && !activeOrder && (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
                <div className="text-4xl mb-3">🛵</div>
                <p className="font-medium">No active delivery</p>
                <p className="text-sm mt-1">Accept an order from the Available tab</p>
              </div>
            )}
            {!delivered && activeOrder && (
              <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
                <div className="flex justify-between">
                  <div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ORDER_STATUS_COLORS[activeOrder.status])}>
                      {ORDER_STATUS_LABELS[activeOrder.status]}
                    </span>
                    <p className="font-bold text-gray-900 mt-1">{activeOrder.order_number}</p>
                    <p className="text-sm text-gray-500">{activeOrder.restaurants?.name}</p>
                  </div>
                  <span className="text-lg font-bold text-orange-500">{formatCurrency(activeOrder.total)}</span>
                </div>

                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-700 mb-1">📍 Deliver to:</p>
                  <p className="font-medium">{activeOrder.customer_name} · {activeOrder.customer_phone}</p>
                  <p className="text-sm font-medium text-gray-800">{activeOrder.delivery_address}</p>
                  {activeOrder.notes && <p className="text-xs text-orange-600 mt-1">Note: {activeOrder.notes}</p>}
                </div>

                <div className="space-y-1.5">
                  {activeOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold text-orange-500">
                    <span>Collect from customer:</span>
                    <span>{formatCurrency(activeOrder.total)}</span>
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    Keep: {formatCurrency(activeOrder.rider_earnings ?? activeOrder.delivery_fee)} ·
                    Remit: {formatCurrency(activeOrder.restaurant_amount ?? activeOrder.subtotal)}
                  </p>
                </div>

                {activeOrder.status === 'rider_claimed' && (
                  <button onClick={handleConfirmPickup} disabled={pickupConfirming}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-bold py-3 rounded-xl transition-colors">
                    {pickupConfirming ? 'Confirming...' : '📦 Confirm Pickup — I have the food'}
                  </button>
                )}

                {activeOrder.status === 'out_for_delivery' && (
                  <>
                    <div className={cn('rounded-lg px-4 py-3 text-sm', sharing ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-gray-50 border border-gray-200 text-gray-600')}>
                      {sharing ? '✓ Sharing live location — customer can see you on the map' : 'Location not sharing yet'}
                    </div>
                    {!sharing && (
                      <button onClick={startSharingLocation}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                        📍 Start Sharing My Location
                      </button>
                    )}
                    <button onClick={handleMarkDelivered} disabled={delivering}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-4 rounded-xl text-lg transition-colors">
                      {delivering ? 'Marking...' : '✓ Mark as Delivered'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* REMITTANCE */}
        {tab === 'remittance' && (
          <div className="space-y-4">
            {pendingRemittances.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-medium">All remittances up to date!</p>
              </div>
            ) : pendingRemittances.map((order) => {
              const amountDue = order.restaurant_amount ?? order.subtotal
              const amountRemitted = order.amount_remitted ?? 0
              const balance = amountDue - amountRemitted
              const isOverdue = order.remit_due_date && new Date(order.remit_due_date) < new Date()

              return (
                <div key={order.id} className={cn('bg-white rounded-2xl shadow-sm p-5', isOverdue && 'border-2 border-red-200')}>
                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.restaurants?.name}</p>
                      {order.remit_due_date && (
                        <p className={cn('text-xs mt-0.5', isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400')}>
                          {isOverdue ? '⚠️ OVERDUE — ' : 'Due: '}{new Date(order.remit_due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium h-fit',
                      REMIT_STATUS_COLORS[order.remit_status as RemitStatus] ?? 'bg-yellow-100 text-yellow-800')}>
                      {REMIT_STATUS_LABELS[order.remit_status as RemitStatus] ?? 'Pending'}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Total collected</span><span>{formatCurrency(order.total)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Your earnings</span><span className="text-green-600">+{formatCurrency(order.rider_earnings ?? order.delivery_fee)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Must remit</span><span>{formatCurrency(amountDue)}</span></div>
                    {amountRemitted > 0 && <div className="flex justify-between"><span className="text-gray-500">Already remitted</span><span className="text-blue-600">{formatCurrency(amountRemitted)}</span></div>}
                    <div className="flex justify-between border-t pt-1 font-bold"><span>Balance to remit</span><span className="text-orange-600">{formatCurrency(balance)}</span></div>
                  </div>

                  {remitForm?.orderId === order.id ? (
                    <form onSubmit={handleRemit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Amount (₱)</label>
                          <input type="number" min="1" max={balance} step="0.01" required value={remitForm.amount}
                            onChange={e => setRemitForm({ ...remitForm, amount: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            placeholder={balance.toFixed(2)} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Type</label>
                          <select value={remitForm.type} onChange={e => setRemitForm({ ...remitForm, type: e.target.value as 'partial' | 'full' })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                            <option value="partial">Partial</option>
                            <option value="full">Full Settlement</option>
                          </select>
                        </div>
                      </div>
                      <input value={remitForm.notes} onChange={e => setRemitForm({ ...remitForm, notes: e.target.value })}
                        placeholder="Notes (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <div className="flex gap-2">
                        <button type="submit" disabled={remitting}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-2.5 rounded-lg text-sm">
                          {remitting ? 'Logging...' : 'Log Remittance'}
                        </button>
                        <button type="button" onClick={() => setRemitForm(null)}
                          className="border border-gray-200 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setRemitForm({ orderId: order.id, amount: balance.toFixed(2), type: 'full', notes: '' })}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                      💵 Log Remittance
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* EARNINGS */}
        {tab === 'earnings' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">Today</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(todayEarnings)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">All Time</p>
                <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-3 text-sm">How earnings work</h2>
              <div className="space-y-3 text-sm text-gray-600">
                {[
                  ['📦', 'Claim an order', 'Pick from Available tab — first rider to accept gets it'],
                  ['🛵', 'Deliver it', 'Confirm pickup → share GPS → customer pays cash → mark delivered'],
                  ['💰', 'Keep the delivery fee', 'The delivery fee is your earnings per order'],
                  ['🏪', 'Remit food cost', 'Log remittance in Remit tab — restaurant gets notified'],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="flex gap-3">
                    <span className="text-xl shrink-0">{icon}</span>
                    <div><p className="font-medium text-gray-900">{title}</p><p>{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
