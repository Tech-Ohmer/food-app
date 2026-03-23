'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false })

interface Props {
  orderId: string
  riderId: string
  initialLat: number | null
  initialLng: number | null
  deliveryAddress: string
}

export default function OrderTracker({ orderId, riderId, initialLat, initialLng, deliveryAddress }: Props) {
  const [riderLat, setRiderLat] = useState(initialLat ?? 14.5995)
  const [riderLng, setRiderLng] = useState(initialLng ?? 120.9842)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`order-rider-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'riders', filter: `id=eq.${riderId}` },
        (payload) => {
          if (payload.new.current_lat) setRiderLat(payload.new.current_lat)
          if (payload.new.current_lng) setRiderLng(payload.new.current_lng)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId, riderId])

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">🛵 Rider on the way!</h2>
        <p className="text-sm text-gray-500">Delivering to: {deliveryAddress}</p>
      </div>
      <div style={{ height: '280px' }}>
        <LiveMap
          orderId={orderId}
          riderId={riderId}
          initialLat={riderLat}
          initialLng={riderLng}
        />
      </div>
    </div>
  )
}
