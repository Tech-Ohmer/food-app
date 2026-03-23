'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Restaurant, MenuCategory, MenuItem } from '@/types'
import { formatCurrency } from '@/lib/utils'

// Image picker component
function ImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [images, setImages] = useState<{ url: string; thumb: string; alt: string }[]>([])
  const [searching, setSearching] = useState(false)

  async function handleSearch(q: string) {
    if (!q.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setImages(data.images ?? [])
    } catch {
      setImages([])
    }
    setSearching(false)
  }

  function selectImage(url: string) {
    onChange(url)
    setOpen(false)
    setImages([])
    setQuery('')
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 hover:underline mt-1"
      >
        🔍 Search for image online
      </button>
    )
  }

  return (
    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
          placeholder="Search food image (e.g. burger, pizza)..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="button"
          onClick={() => handleSearch(query)}
          disabled={searching}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
        >
          {searching ? '...' : 'Search'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
        >
          ✕
        </button>
      </div>

      {images.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Click to use — free images from Unsplash</p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectImage(img.url)}
                className="rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
              >
                <img
                  src={img.thumb}
                  alt={img.alt}
                  className="w-full h-20 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop' }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {searching && <p className="text-sm text-gray-400 text-center">Searching...</p>}
    </div>
  )
}

export default function DashboardMenuEditor({
  restaurant,
  categories,
  items,
}: {
  restaurant: Restaurant
  categories: MenuCategory[]
  items: MenuItem[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category_id: '', image_url: '' })
  const [editItem, setEditItem] = useState({ name: '', description: '', price: '', category_id: '', image_url: '' })

  const [addError, setAddError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurant.id,
        name: newItem.name,
        description: newItem.description || null,
        price: parseFloat(newItem.price),
        category_id: newItem.category_id || null,
        image_url: newItem.image_url || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setAddError(data.error ?? 'Failed to add item.')
      return
    }
    setShowAdd(false)
    setNewItem({ name: '', description: '', price: '', category_id: '', image_url: '' })
    startTransition(() => router.refresh())
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setEditItem({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      category_id: item.category_id ?? '',
      image_url: item.image_url ?? '',
    })
  }

  async function handleUpdate(itemId: string) {
    const res = await fetch(`/api/admin/menu/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editItem.name,
        description: editItem.description || null,
        price: parseFloat(editItem.price),
        category_id: editItem.category_id || null,
        image_url: editItem.image_url || null,
      }),
    })
    if (res.ok) {
      setEditingId(null)
      startTransition(() => router.refresh())
    }
  }

  async function handleToggle(itemId: string, isAvailable: boolean) {
    await fetch(`/api/admin/menu/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !isAvailable }),
    })
    startTransition(() => router.refresh())
  }

  async function handleDelete(itemId: string, name: string) {
    if (!confirm(`Delete "${name}" from the menu? This cannot be undone.`)) return
    await fetch(`/api/admin/menu/${itemId}`, { method: 'DELETE' })
    startTransition(() => router.refresh())
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-500 text-sm">{items.length} items in menu</p>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Item
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5 space-y-3">
          <h3 className="font-bold text-gray-900">New Menu Item</h3>
          {addError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{addError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (₱) *</label>
              <input required type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={newItem.category_id} onChange={e => setNewItem({...newItem, category_id: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
              <input value={newItem.image_url} onChange={e => setNewItem({...newItem, image_url: e.target.value})}
                placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <ImagePicker value={newItem.image_url} onChange={url => setNewItem({...newItem, image_url: url})} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60">Add</button>
            <button type="button" onClick={() => setShowAdd(false)} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p>No items yet. Add your first menu item.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-xl border shadow-sm ${!item.is_available ? 'border-red-100 opacity-70' : 'border-gray-100'}`}>
              {editingId === item.id ? (
                /* Edit mode */
                <div className="p-4 space-y-3">
                  <h4 className="font-semibold text-gray-800 text-sm">Edit Item</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Name *</label>
                      <input value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Price (₱) *</label>
                      <input type="number" min="0" step="0.01" value={editItem.price} onChange={e => setEditItem({...editItem, price: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Category</label>
                      <select value={editItem.category_id} onChange={e => setEditItem({...editItem, category_id: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value="">No category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                      <input value={editItem.image_url} onChange={e => setEditItem({...editItem, image_url: e.target.value})}
                        placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <ImagePicker value={editItem.image_url} onChange={url => setEditItem({...editItem, image_url: url})} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input value={editItem.description} onChange={e => setEditItem({...editItem, description: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(item.id)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium">Save</button>
                    <button onClick={() => setEditingId(null)}
                      className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="p-4 flex items-center gap-4">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      {!item.is_available && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Hidden</span>}
                    </div>
                    {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                    <p className="text-sm font-bold text-orange-500 mt-0.5">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleToggle(item.id, item.is_available)} disabled={isPending}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${item.is_available ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      {item.is_available ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => startEdit(item)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id, item.name)} disabled={isPending}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-60">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
