'use server'

import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function createRider(data: {
  name: string
  phone: string
  email: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient()
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
    const supabase = getAdminClient()
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
    const supabase = getAdminClient()

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (updateError) {
      console.error('markOrderDelivered DB error:', updateError)
      return { success: false, error: updateError.message }
    }

    // Send delivery confirmation email (non-blocking)
    void Promise.resolve(
      supabase.from('orders').select('*').eq('id', orderId).single()
    ).then(async ({ data: order }) => {
      if (order) {
        const { sendOrderStatusUpdateEmail } = await import('@/lib/email')
        const { ORDER_STATUS_LABELS } = await import('@/types')
        sendOrderStatusUpdateEmail(order as any, ORDER_STATUS_LABELS['delivered']).catch(console.error)
      }
    }).catch(console.error)

    return { success: true }
  } catch (err: any) {
    console.error('markOrderDelivered error:', err)
    return { success: false, error: err?.message ?? 'Failed to mark as delivered.' }
  }
}
