'use server'

import { nanoid } from 'nanoid'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail, sendRestaurantNewOrderEmail, sendOrderStatusUpdateEmail } from '@/lib/email'
import type { CartItem, OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS } from '@/types'

const DELIVERY_FEE = parseFloat(process.env.DELIVERY_FEE ?? '50')

export async function placeOrder(data: {
  restaurant_id: string
  restaurant_owner_email: string
  restaurant_name: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  notes: string
  items: CartItem[]
}): Promise<{ success: boolean; trackingToken?: string; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const tracking_token = nanoid(16)
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = subtotal + DELIVERY_FEE

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: data.restaurant_id,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        delivery_address: data.delivery_address,
        notes: data.notes || null,
        subtotal,
        delivery_fee: DELIVERY_FEE,
        total,
        tracking_token,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) throw orderError

    const orderItems = data.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) throw itemsError

    // Send emails (non-blocking)
    const restaurant = {
      id: data.restaurant_id,
      name: data.restaurant_name,
      owner_email: data.restaurant_owner_email,
    } as any

    Promise.all([
      sendOrderConfirmationEmail(order as any, restaurant),
      sendRestaurantNewOrderEmail(order as any, restaurant),
    ]).catch(console.error)

    return { success: true, trackingToken: tracking_token }
  } catch (err) {
    console.error('placeOrder error:', err)
    return { success: false, error: 'Failed to place order. Please try again.' }
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()

    // Step 1: Update the status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (updateError) {
      console.error('updateOrderStatus DB error:', updateError)
      return { success: false, error: updateError.message }
    }

    // Step 2: Fetch order separately for email (non-blocking)
    supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
      .then(({ data: order }) => {
        if (order) {
          sendOrderStatusUpdateEmail(order as any, ORDER_STATUS_LABELS[status]).catch(console.error)
        }
      })
      .catch(console.error)

    return { success: true }
  } catch (err: any) {
    console.error('updateOrderStatus error:', err)
    return { success: false, error: err?.message ?? 'Failed to update order status.' }
  }
}

export async function assignRider(
  orderId: string,
  riderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('orders')
      .update({ rider_id: riderId, status: 'out_for_delivery' })
      .eq('id', orderId)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('assignRider error:', err)
    return { success: false, error: 'Failed to assign rider.' }
  }
}
