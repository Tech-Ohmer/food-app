'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Rider claims an available order (first come first served)
export async function claimOrder(
  orderId: string,
  riderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient()

    // Atomic update — only succeeds if status is still ready_for_pickup
    const { data, error } = await supabase
      .from('orders')
      .update({ rider_id: riderId, status: 'rider_claimed' })
      .eq('id', orderId)
      .eq('status', 'ready_for_pickup') // Only claim if still available
      .select('*, restaurants(*)')
      .single()

    if (error || !data) {
      return { success: false, error: 'Order already claimed by another rider.' }
    }

    // Notify restaurant, admin, customer via email (non-blocking)
    void Promise.resolve(import('@/lib/email')).then(async ({ sendOrderStatusUpdateEmail }) => {
      sendOrderStatusUpdateEmail(data as any, 'Rider Assigned').catch(console.error)
    })

    revalidatePath('/rider')
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (err: any) {
    console.error('claimOrder error:', err)
    return { success: false, error: err?.message ?? 'Failed to claim order.' }
  }
}

// Rider confirms pickup — status: out_for_delivery
export async function confirmPickup(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'out_for_delivery' })
      .eq('id', orderId)
      .select('*')
      .single()

    if (error || !data) throw error

    // Send pickup notification to customer
    void Promise.resolve(import('@/lib/email')).then(async ({ sendOrderStatusUpdateEmail }) => {
      const { ORDER_STATUS_LABELS } = await import('@/types')
      sendOrderStatusUpdateEmail(data as any, ORDER_STATUS_LABELS['out_for_delivery']).catch(console.error)
    })

    revalidatePath('/rider')
    return { success: true }
  } catch (err: any) {
    console.error('confirmPickup error:', err)
    return { success: false, error: err?.message ?? 'Failed to confirm pickup.' }
  }
}

// Rider logs remittance for an order
export async function logRemittance(data: {
  orderId: string
  riderId: string
  amount: number
  remitType: 'partial' | 'full'
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient()

    // 1. Get current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('amount_remitted, restaurant_amount, restaurant_id, restaurants(owner_email, name)')
      .eq('id', data.orderId)
      .single()

    if (orderError || !order) throw orderError

    const newAmountRemitted = (order.amount_remitted ?? 0) + data.amount
    const restaurantAmount = order.restaurant_amount ?? 0
    const newRemitStatus = data.remitType === 'full' || newAmountRemitted >= restaurantAmount
      ? 'full'
      : 'partial'

    // 2. Insert remittance log
    const { error: logError } = await supabase.from('remittance_logs').insert({
      order_id: data.orderId,
      rider_id: data.riderId,
      amount: data.amount,
      remit_type: data.remitType,
      notes: data.notes ?? null,
    })
    if (logError) throw logError

    // 3. Update order remit status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        amount_remitted: newAmountRemitted,
        remit_status: newRemitStatus,
        remit_notes: data.notes ?? null,
      })
      .eq('id', data.orderId)

    if (updateError) throw updateError

    // 4. Notify restaurant of remittance (non-blocking)
    const restaurantEmail = (order.restaurants as any)?.owner_email
    const restaurantName = (order.restaurants as any)?.name
    if (restaurantEmail) {
      void Promise.resolve(import('@/lib/email')).then(async ({ sendRemittanceNotification }) => {
        if (sendRemittanceNotification) {
          sendRemittanceNotification({
            restaurantEmail,
            restaurantName,
            amount: data.amount,
            remitType: data.remitType,
            totalRemitted: newAmountRemitted,
            totalDue: restaurantAmount,
          }).catch(console.error)
        }
      })
    }

    revalidatePath('/rider')
    revalidatePath('/dashboard')
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (err: any) {
    console.error('logRemittance error:', err)
    return { success: false, error: err?.message ?? 'Failed to log remittance.' }
  }
}

// Admin overrides rider earnings for an order
export async function overrideRiderEarnings(
  orderId: string,
  riderEarnings: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient()

    const { data: order } = await supabase
      .from('orders')
      .select('subtotal, total')
      .eq('id', orderId)
      .single()

    if (!order) throw new Error('Order not found')

    const { error } = await supabase
      .from('orders')
      .update({
        rider_earnings: riderEarnings,
        restaurant_amount: order.subtotal, // Restaurant always gets subtotal
      })
      .eq('id', orderId)

    if (error) throw error

    revalidatePath('/admin/orders')
    return { success: true }
  } catch (err: any) {
    console.error('overrideRiderEarnings error:', err)
    return { success: false, error: err?.message ?? 'Failed to override earnings.' }
  }
}

// Update restaurant remittance rules
export async function updateRemittanceRules(
  restaurantId: string,
  rule: 'per_delivery' | 'daily' | 'weekly' | 'custom',
  days: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('restaurants')
      .update({ remittance_rule: rule, remittance_days: days })
      .eq('id', restaurantId)
    if (error) throw error
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Failed to update rules.' }
  }
}
