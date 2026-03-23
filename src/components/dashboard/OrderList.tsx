'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Order, OrderItem, OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { updateOrderStatus } from '@/app/actions/orders'

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; color: string }>> = {
  pending: { status: 'accepted', label: 'Accept Order', color: 'bg-blue-500 hover:bg-blue-600' },
  accepted: { status: 'preparing', label: 'Start Preparing', color: 'bg-orange-500 hover:bg-orange-600' },
  preparing: { status: 'ready_for_pickup', label: 'Ready for Pickup', color: 'bg-purple-500 hover:bg-purple-600' },
}

export default function DashboardOrderList({
  activeOrders,
  historyOrders,
  restaurantId,
}: {
  activeOrders: (Order & { order_items: OrderItem[] })[]
  historyOrders: (Order & { order_items: OrderItem[] })[]
  restaurantId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  function handleStatusChange(orderId: string, status: OrderStatus) {
    startTransition(async () => {
      await updateOrderStatus(orderId, status)
      router.refresh()
    })
  }

  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', activeTab === 'active' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200')}
        >
          Active ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', activeTab === 'history' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200')}
        >
          History ({historyOrders.length})
        </button>
      </div>

      {displayOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
          <div className="text-4xl mb-3">📋</div>
          <p>{activeTab === 'active' ? 'No active orders right now.' : 'No order history yet.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{order.order_number}</span>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', ORDER_STATUS_COLORS[order.status])}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <span className="text-lg font-bold text-orange-500">{formatCurrency(order.total)}</span>
              </div>

              {/* Customer info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mb-3">
                <div><span className="text-gray-400">Customer:</span> <span className="font-medium">{order.customer_name}</span></div>
                <div><span className="text-gray-400">Phone:</span> <span className="font-medium">{order.customer_phone}</span></div>
                <div><span className="text-gray-400">Address:</span> <span className="font-medium">{order.delivery_address}</span></div>
              </div>

              {order.notes && (
                <div className="text-sm bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 mb-3">
                  📝 <span className="text-yellow-800">{order.notes}</span>
                </div>
              )}

              {/* Items */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-0.5">
                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              {activeTab === 'active' && (
                <div className="flex gap-2 flex-wrap">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(order.id, 'accepted')}
                        disabled={isPending}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => handleStatusChange(order.id, 'rejected')}
                        disabled={isPending}
                        className="bg-red-100 text-red-700 hover:bg-red-200 text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                      disabled={isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'ready_for_pickup')}
                      disabled={isPending}
                      className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
