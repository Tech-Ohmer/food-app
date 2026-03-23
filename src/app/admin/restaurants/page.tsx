'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { loadRestaurants() }, [])

  async function loadRestaurants() {
    const res = await fetch('/api/admin/restaurants')
    const data = await res.json()
    setRestaurants(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all menu items for this restaurant. Orders will remain.`)) return
    setDeleting(id)
    const res = await fetch(`/api/admin/restaurants/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRestaurants(prev => prev.filter(r => r.id !== id))
    } else {
      const data = await res.json()
      alert(data.error ?? 'Failed to delete restaurant.')
    }
    setDeleting(null)
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/restaurants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    loadRestaurants()
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-500 text-sm mt-0.5">{restaurants.length} total</p>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Restaurant
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
          <div className="text-4xl mb-3">🍽️</div>
          <p>No restaurants yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{r.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{r.owner_email} · {r.address}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Open/Closed badge */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {r.is_open ? 'Open' : 'Closed'}
                </span>

                {/* Edit */}
                <Link href={`/admin/restaurants/${r.id}/edit`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                  Edit
                </Link>

                {/* Activate/Deactivate */}
                <button
                  onClick={() => handleToggleActive(r.id, r.is_active)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${r.is_active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                >
                  {r.is_active ? 'Deactivate' : 'Activate'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(r.id, r.name)}
                  disabled={deleting === r.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {deleting === r.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">To add a restaurant:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "+ Add Restaurant" above</li>
          <li>Create a Supabase auth account for the owner email</li>
          <li>Owner logs in at <strong>/login</strong> to manage orders and menu</li>
        </ol>
      </div>
    </div>
  )
}
