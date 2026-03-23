'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  orderId: string
  riderId: string
  initialLat: number
  initialLng: number
}

export default function LiveMap({ orderId, riderId, initialLat, initialLng }: Props) {
  const [lat, setLat] = useState(initialLat)
  const [lng, setLng] = useState(initialLng)
  const [MapComponent, setMapComponent] = useState<any>(null)

  // Subscribe to rider location updates via Supabase Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`rider-location-${riderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'riders',
          filter: `id=eq.${riderId}`,
        },
        (payload) => {
          if (payload.new.current_lat && payload.new.current_lng) {
            setLat(payload.new.current_lat)
            setLng(payload.new.current_lng)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [riderId])

  // Dynamically import Leaflet (no SSR)
  useEffect(() => {
    async function loadMap() {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      setMapComponent({ L })
    }
    loadMap()
  }, [])

  useEffect(() => {
    if (!MapComponent) return
    const { L } = MapComponent

    // Fix default marker icon
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const map = L.map('rider-map').setView([lat, lng], 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    const riderIcon = L.divIcon({
      html: '<div style="font-size:28px;line-height:1">🛵</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    const marker = L.marker([lat, lng], { icon: riderIcon }).addTo(map)
    marker.bindPopup('Your rider is here!').openPopup()

    return () => { map.remove() }
  }, [MapComponent, lat, lng])

  return (
    <div
      id="rider-map"
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    />
  )
}
