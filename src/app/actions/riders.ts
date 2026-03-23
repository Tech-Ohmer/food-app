'use server'

import { createServiceClient } from '@/lib/supabase/server'

export async function createRider(data: {
  name: string
  phone: string
  email: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })
    if (authError || !authUser.user) throw authError
    const { error: riderError } = await supabase.from('riders').insert({
      user_id: authUser.user.id,
      name: data.name,
      phone: data.phone,
    })
    if (riderError) throw riderError
    return { success: true }
  } catch (err: any) {
    console.error('createRider error:', err)
    return { success: false, error: err?.message ?? 'Failed to create rider.' }
  }
}

export async function updateRiderLocation(
  riderId: string,
  lat: number,
  lng: number
): Promise<{ success: boolean }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('riders')
      .update({
        current_lat: lat,
        current_lng: lng,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', riderId)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('updateRiderLocation error:', err)
    return { success: false }
  }
}

export async function markOrderDelivered(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('markOrderDelivered error:', err)
    return { success: false, error: 'Failed to mark as delivered.' }
  }
}
