'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const nextAction = STATUS_ACTIONS[currentStatus]

  function handleAction(status: OrderStatus) {
    startTransition(async () => {
      await updateOrderStatus(orderId, status)
      router.refresh()
    })
  }

  if (!nextAction && !REJECT_STATUSES.includes(currentStatus)) return null

  return (
    <div className="flex gap-2 mt-4 flex-wrap">
      {nextAction && (
        <button
          onClick={() => handleAction(nextAction.next)}
          disabled={isPending}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${nextAction.color}`}
        >
          {isPending ? 'Updating...' : nextAction.label}
        </button>
      )}
      {REJECT_STATUSES.includes(currentStatus) && (
        <button
          onClick={() => handleAction('rejected')}
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-60"
        >
          Reject
        </button>
      )}
    </div>
  )
}
