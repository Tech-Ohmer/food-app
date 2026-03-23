'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function NewRestaurantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    owner_email: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const slug = slugify(form.name)
    if (!slug) {
      setError('Restaurant name is invalid.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slug }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create restaurant.')
        setLoading(false)
        return
      }

      router.push('/admin/restaurants')
      router.refresh()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/restaurants" className="text-sm text-orange-500 hover:underline">
          ← Back to Restaurants
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add New Restaurant</h1>
        <p className="text-gray-500 text-sm mt-1">
          After adding, create a Supabase auth account for the owner so they can log in.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ohmer's Pizza House"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {form.name && (
              <p className="text-xs text-gray-400 mt-1">
                URL slug: <span className="font-mono">{slugify(form.name)}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Email <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="email"
              value={form.owner_email}
              onChange={e => setForm({ ...form, owner_email: e.target.value })}
              placeholder="owner@email.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              The owner will log in with this email at /login to manage orders and menu.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St, Manila, Philippines"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+63 912 345 6789"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the restaurant..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">After creating the restaurant:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to Supabase → Authentication → Users → Add user</li>
              <li>Enter the owner email and set a password</li>
              <li>The owner logs in at <strong>/login</strong> to manage orders and menu</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Creating...' : 'Create Restaurant'}
            </button>
            <Link
              href="/admin/restaurants"
              className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
