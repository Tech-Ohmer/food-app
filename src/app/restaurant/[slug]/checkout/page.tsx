'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { placeOrder } from '@/app/actions/orders'
import type { CartItem } from '@/types'

const DELIVERY_FEE = 50

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [cart, setCart] = useState<CartItem[]>([])
  const [restaurantInfo, setRestaurantInfo] = useState<{ restaurantId: string; restaurantName: string; restaurantOwnerEmail: string } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedCart = localStorage.getItem('ohmer-eats-cart')
    const savedInfo = localStorage.getItem('ohmer-eats-restaurant')
    if (savedCart) setCart(JSON.parse(savedCart))
    if (savedInfo) setRestaurantInfo(JSON.parse(savedInfo))
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + DELIVERY_FEE

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurantInfo || cart.length === 0) return
    setLoading(true)
    setError(null)

    const result = await placeOrder({
      restaurant_id: restaurantInfo.restaurantId,
      restaurant_owner_email: restaurantInfo.restaurantOwnerEmail,
      restaurant_name: restaurantInfo.restaurantName,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      delivery_address: form.address,
      notes: form.notes,
      items: cart,
    })

    if (!result.success) {
      setError(result.error ?? 'Failed to place order.')
      setLoading(false)
      return
    }

    // Clear cart
    localStorage.removeItem('ohmer-eats-cart')
    localStorage.removeItem('ohmer-eats-restaurant')
    router.push(`/order/${result.trackingToken}`)
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-lg">Your cart is empty.</p>
          <Link href={`/restaurant/${slug}`} className="text-orange-500 hover:underline text-sm mt-2 block">
            ← Back to menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/restaurant/${slug}`} className="text-orange-500 hover:underline text-sm">← Back to menu</Link>
          <span className="text-gray-400">·</span>
          <span className="font-semibold text-gray-800">Checkout</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.menu_item_id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery fee</span>
              <span>{formatCurrency(DELIVERY_FEE)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2">
              <span>Total</span>
              <span className="text-orange-500">{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="mt-4 bg-orange-50 rounded-lg px-3 py-2 text-sm text-orange-700">
            Payment: Cash on Delivery
          </div>
        </div>

        {/* Delivery Details */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4">Delivery Details</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="+63 912 345 6789"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Address *</label>
                <textarea
                  required
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  placeholder="Full delivery address..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Special Instructions</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  placeholder="Any special requests..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? 'Placing Order...' : `Place Order · ${formatCurrency(total)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
