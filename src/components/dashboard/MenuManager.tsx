'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Restaurant, MenuCategory, MenuItem } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'

export default function MenuManager({
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
    startTransition(async () => {
      const res = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
          category_id: newItem.category_id || null,
          image_url: newItem.image_url || null,
          is_available: true,
        }),
      })
      if (res.ok) {
        setShowAddItem(false)
        setNewItem({ name: '', description: '', price: '', category_id: '', image_url: '' })
        router.refresh()
      }
    })
  }

  async function handleToggleAvailability(itemId: string, isAvailable: boolean) {
    startTransition(async () => {
      await fetch(`/api/menu/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !isAvailable }),
      })
      router.refresh()
    })
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Delete this menu item?')) return
    startTransition(async () => {
      await fetch(`/api/menu/items/${itemId}`, { method: 'DELETE' })
      router.refresh()
    })
  }

  return (
    <div>
      {/* Add item button */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowAddItem(!showAddItem)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Add item form */}
      {showAddItem && (
        <form onSubmit={handleAddItem} className="bg-white rounded-2xl border border-orange-200 p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Add Menu Item</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Item Name *</label>
              <input
                required
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="e.g. Chicken Burger"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (PHP) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={newItem.price}
                onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="199.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={newItem.category_id}
                onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL (optional)</label>
              <input
                value={newItem.image_url}
                onChange={e => setNewItem({ ...newItem, image_url: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
              <input
                value={newItem.description}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Brief description..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              Add Item
            </button>
            <button
              type="button"
              onClick={() => setShowAddItem(false)}
              className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">🍽️</div>
          <p>No menu items yet. Add your first item above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className={cn('bg-white rounded-xl border p-4 flex items-center gap-4', item.is_available ? 'border-gray-100' : 'border-red-100 opacity-70')}>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  {!item.is_available && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Unavailable</span>
                  )}
                </div>
                {item.description && <p className="text-sm text-gray-400 truncate">{item.description}</p>}
                <p className="text-orange-500 font-bold text-sm mt-0.5">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleAvailability(item.id, item.is_available)}
                  disabled={isPending}
                  className={cn('text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60', item.is_available ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200')}
                >
                  {item.is_available ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={isPending}
                  className="text-xs text-gray-400 hover:text-red-500 px-2 disabled:opacity-60"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
