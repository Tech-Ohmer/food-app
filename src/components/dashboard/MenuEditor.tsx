'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Restaurant, MenuCategory, MenuItem } from '@/types'
import { formatCurrency } from '@/lib/utils'

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
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
  })

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.from('menu_items').insert({
      restaurant_id: restaurant.id,
      name: newItem.name,
      description: newItem.description || null,
      price: parseFloat(newItem.price),
      category_id: newItem.category_id || null,
      image_url: newItem.image_url || null,
      is_available: true,
    })
    setShowAddItem(false)
    setNewItem({ name: '', description: '', price: '', category_id: '', image_url: '' })
    startTransition(() => router.refresh())
  }

  async function handleToggle(itemId: string, isAvailable: boolean) {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.from('menu_items').update({ is_available: !isAvailable }).eq('id', itemId)
    startTransition(() => router.refresh())
  }

  async function handleDelete(itemId: string) {
    if (!confirm('Delete this item?')) return
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.from('menu_items').delete().eq('id', itemId)
    startTransition(() => router.refresh())
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-500 text-sm">{items.length} items</p>
        <button
          onClick={() => setShowAddItem(!showAddItem)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Item
        </button>
      </div>

      {showAddItem && (
        <form onSubmit={handleAddItem} className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5 space-y-3">
          <h3 className="font-bold text-gray-900">New Menu Item</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (₱) *</label>
              <input required type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={newItem.category_id} onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
              <input value={newItem.image_url} onChange={e => setNewItem({ ...newItem, image_url: e.target.value })}
                placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60">Add</button>
            <button type="button" onClick={() => setShowAddItem(false)} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p>No items yet. Add your first menu item.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 shadow-sm ${!item.is_available ? 'opacity-60 border-red-100' : 'border-gray-100'}`}>
              {item.image_url && <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{item.name}</p>
                {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                <p className="text-orange-500 font-bold text-sm">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleToggle(item.id, item.is_available)} disabled={isPending}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${item.is_available ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                  {item.is_available ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(item.id)} disabled={isPending}
                  className="text-xs text-gray-300 hover:text-red-500 px-2">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
