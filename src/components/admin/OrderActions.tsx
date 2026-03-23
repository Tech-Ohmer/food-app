'use client'

import { useState } from 'react'
import type { OrderStatus } from '@/types'
import { updateOrderStatus } from '@/app/actions/orders'

const STATUS_ACTIONS: Partial<Record<OrderStatus, { next: OrderStatus; label: string; color: string }>> = {
  pending: { next: 'accepted', label: 'Accept Order', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  accepted: { next: 'preparing', label: 'Start Preparing', color: 'bg-orange-500 hover:bg-orange-600 text-white' },
  preparing: { next: 'ready_for_pickup', label: 'Mark Ready for Pickup', color: 'bg-purple-500 hover:bg-purple-600 text-white' },
  ready_for_pickup: { next: 'out_for_delivery', label: 'Mark Out for Delivery', color: 'bg-indigo-500 hover:bg-indigo-600 text-white' },
  out_for_delivery: { next: 'delivered', label: 'Mark Delivered', color: 'bg-green-500 hover:bg-green-600 text-white' },
}

const REJECT_STATUSES: OrderStatus[] = ['pending', 'accepted']

export default function AdminOrderActions({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const nextAction = STATUS_ACTIONS[currentStatus]

  async function handleAction(status: OrderStatus) {
    setLoading(true)
    setError(null)
    try {
      const result = await updateOrderStatus(orderId, status)
      if (!result.success) {
        setError(result.error ?? 'Failed to update order.')
        setLoading(false)
        return
      }
      setDone(true)
      // Full page reload to show updated status
      window.location.reload()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (done) {
    return <p className="text-sm text-green-600 mt-4 font-medium">✓ Status updated — refreshing...</p>
  }

  if (!nextAction && !REJECT_STATUSES.includes(currentStatus)) return null

  return (
    <div className="mt-4 space-y-2">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
      )}
      <div className="flex gap-2 flex-wrap">
        {nextAction && (
          <button
            onClick={() => handleAction(nextAction.next)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${nextAction.color}`}
          >
            {loading ? 'Updating...' : nextAction.label}
          </button>
        )}
        {REJECT_STATUSES.includes(currentStatus) && (
          <button
            onClick={() => handleAction('rejected')}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-60"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  )
}
