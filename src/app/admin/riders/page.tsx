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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '' })
  const [deleting, setDeleting] = useState<string | null>(null)

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

  function startEdit(rider: any) {
    setEditingId(rider.id)
    setEditForm({ name: rider.name, phone: rider.phone ?? '' })
  }

  async function handleUpdate(riderId: string) {
    const res = await fetch(`/api/admin/riders/${riderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      setEditingId(null)
      loadData()
    }
  }

  async function handleDelete(riderId: string, name: string) {
    if (!confirm(`Delete rider "${name}"? This cannot be undone.`)) return
    setDeleting(riderId)
    const res = await fetch(`/api/admin/riders/${riderId}`, { method: 'DELETE' })
    if (res.ok) {
      setRiders(prev => prev.filter(r => r.id !== riderId))
    } else {
      alert('Failed to delete rider.')
    }
    setDeleting(null)
  }

  async function handleToggleAvailable(riderId: string, isAvailable: boolean) {
    await fetch(`/api/admin/riders/${riderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !isAvailable }),
    })
    loadData()
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
          <p className="text-gray-500 text-sm">{riders.length} registered riders</p>
        </div>
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
      {orders.filter((o: any) => !o.rider_id || o.status === 'ready_for_pickup').length > 0 && (
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
                  <select defaultValue="" onChange={e => e.target.value && handleAssignRider(order.id, e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
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
          <div key={rider.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
            {editingId === rider.id ? (
              /* Edit mode */
              <div className="p-4 space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm">Edit Rider</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(rider.id)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium">Save</button>
                  <button onClick={() => setEditingId(null)}
                    className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-500 shrink-0">
                  {rider.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{rider.name}</h3>
                  <p className="text-xs text-gray-400">{rider.phone ?? 'No phone'}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${rider.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {rider.is_available ? 'Available' : 'Busy'}
                  </span>
                  <button onClick={() => handleToggleAvailable(rider.id, rider.is_available)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                    {rider.is_available ? 'Set Busy' : 'Set Available'}
                  </button>
                  <button onClick={() => startEdit(rider)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(rider.id, rider.name)} disabled={deleting === rider.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50">
                    {deleting === rider.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
