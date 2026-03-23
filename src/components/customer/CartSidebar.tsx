'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from '@/types'

interface Props {
  restaurantId: string
  restaurantName: string
  restaurantOwnerEmail: string
  restaurantSlug: string
  isOpen: boolean
}

const DELIVERY_FEE = 50

export default function CartSidebar({
  restaurantId,
  restaurantName,
  restaurantOwnerEmail,
  restaurantSlug,
  isOpen,
}: Props) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const CART_KEY = 'ohmer-eats-cart'
  const RESTAURANT_KEY = 'ohmer-eats-restaurant'

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY)
    if (saved) setCart(JSON.parse(saved))

    // Listen for cart updates from the page
    const handleAddToCart = (e: CustomEvent<CartItem>) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.menu_item_id === e.detail.menu_item_id)
        let updated: CartItem[]
        if (existing) {
          updated = prev.map((i) =>
            i.menu_item_id === e.detail.menu_item_id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        } else {
          updated = [...prev, { ...e.detail, quantity: 1 }]
        }
        localStorage.setItem(CART_KEY, JSON.stringify(updated))
        localStorage.setItem(
          RESTAURANT_KEY,
          JSON.stringify({ restaurantId, restaurantName, restaurantOwnerEmail })
        )
        return updated
      })
    }

    window.addEventListener('add-to-cart', handleAddToCart as EventListener)
    return () => window.removeEventListener('add-to-cart', handleAddToCart as EventListener)
  }, [restaurantId, restaurantName, restaurantOwnerEmail])

  function updateQuantity(menuItemId: string, delta: number) {
    setCart((prev) => {
      const updated = prev
        .map((i) =>
          i.menu_item_id === menuItemId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
      localStorage.setItem(CART_KEY, JSON.stringify(updated))
      return updated
    })
  }

  function clearCart() {
    setCart([])
    localStorage.removeItem(CART_KEY)
    localStorage.removeItem(RESTAURANT_KEY)
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const total = subtotal + DELIVERY_FEE
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  if (!isOpen) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
        <p className="text-gray-400 text-sm text-center py-4">
          This restaurant is currently closed. Orders are not available.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Your Order</h2>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600">
            Clear
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">🛒</div>
          <p className="text-sm">Your cart is empty</p>
          <p className="text-xs mt-1">Click + Add on any item to start</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.menu_item_id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-orange-500">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.menu_item_id, -1)}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menu_item_id, 1)}
                    className="w-6 h-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1 mb-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery</span><span>{formatCurrency(DELIVERY_FEE)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span className="text-orange-500">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            onClick={() => router.push(`/restaurant/${restaurantSlug}/checkout`)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Checkout ({itemCount} item{itemCount !== 1 ? 's' : ''}) · {formatCurrency(total)}
          </button>
        </>
      )}
    </div>
  )
}
