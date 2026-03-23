'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createRider } from '@/app/actions/riders'

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const [{ data: riderData }, { data: orderData }] = await Promise.all([
      supabase.from('riders').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('id, order_number, status, customer_name, restaurant_id, rider_id, restaurants(name)')
        .in('status', ['ready_for_pickup', 'out_for_delivery']),
    ])
    setRiders(riderData ?? [])
    setOrders(orderData ?? [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createRider(form)
      if (!result.success) { setError(result.error ?? 'Failed to create rider.'); return }
      setShowForm(false)
      setForm({ name: '', phone: '', email: '', password: '' })
      loadData()
    })
  }

  async function handleAssignRider(orderId: string, riderId: string) {
    const supabase = createClient()
    await supabase.from('orders').update({ rider_id: riderId, status: 'out_for_delivery' }).eq('id', orderId)
    loadData()
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Rider
        </button>
      </div>

      {/* Add rider form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-orange-200 p-6 mb-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900">Add New Rider</h3>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email (for login) *</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
              <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2 rounded-lg text-sm font-medium">
              {isPending ? 'Creating...' : 'Add Rider'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Orders waiting for rider */}
      {orders.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Orders Waiting for Assignment</h2>
          <div className="space-y-3">
            {orders.filter((o: any) => !o.rider_id || o.status === 'ready_for_pickup').map((order: any) => (
              <div key={order.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="font-bold text-gray-900">{order.order_number}</span>
                    <span className="text-gray-500 text-sm ml-2">{order.restaurants?.name}</span>
                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                  </div>
                  <select
                    defaultValue=""
                    onChange={e => e.target.value && handleAssignRider(order.id, e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="" disabled>Assign rider...</option>
                    {riders.filter(r => r.is_available && r.is_active).map(rider => (
                      <option key={rider.id} value={rider.id}>{rider.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riders list */}
      <div className="space-y-3">
        {riders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">No riders yet.</div>
        ) : riders.map((rider) => (
          <div key={rider.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-500">
              {rider.name[0]}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{rider.name}</h3>
              <p className="text-sm text-gray-400">{rider.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${rider.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {rider.is_available ? 'Available' : 'Busy'}
              </span>
              {rider.last_seen_at && (
                <span className="text-xs text-gray-400">
                  Last seen: {new Date(rider.last_seen_at).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
