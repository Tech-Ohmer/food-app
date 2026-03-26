import nodemailer from 'nodemailer'
import type { Order, Restaurant } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const APP_NAME = process.env.APP_NAME ?? 'OhmerEats'
const GMAIL_USER = process.env.GMAIL_USER ?? ''
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD ?? ''

async function sendEmail(to: string, subject: string, html: string) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('[email] GMAIL_USER or GMAIL_APP_PASSWORD not set')
    return
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    })
    await transporter.sendMail({
      from: `"${APP_NAME}" <${GMAIL_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`[email] Sent to ${to}: ${subject}`)
  } catch (err) {
    console.error(`[email] Failed to send to ${to}:`, err)
  }
}

export async function sendOrderConfirmationEmail(order: Order, restaurant: Restaurant) {
  const trackingUrl = `${APP_URL}/order/${order.tracking_token}`

  await sendEmail(
    order.customer_email,
    `[${order.order_number}] Order received — ${restaurant.name}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#f97316">Your order has been placed!</h2>
      <p>Hi ${order.customer_name},</p>
      <p>We received your order from <strong>${restaurant.name}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Order</td><td style="padding:8px">${order.order_number}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Total</td><td style="padding:8px">₱${order.total.toFixed(2)}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Deliver to</td><td style="padding:8px">${order.delivery_address}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Payment</td><td style="padding:8px">Cash on Delivery</td></tr>
      </table>
      <p>Track your order in real-time:</p>
      <a href="${trackingUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Track My Order</a>
      <p style="color:#666;font-size:0.875rem;margin-top:16px">Or copy: ${trackingUrl}</p>
    </div>`
  )
}

export async function sendRestaurantNewOrderEmail(order: Order, restaurant: Restaurant) {
  const dashboardUrl = `${APP_URL}/dashboard`

  await sendEmail(
    restaurant.owner_email,
    `[NEW ORDER] ${order.order_number} — ₱${order.total.toFixed(2)}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#f97316">New order received!</h2>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Order</td><td style="padding:8px">${order.order_number}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Customer</td><td style="padding:8px">${order.customer_name} (${order.customer_phone})</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Total</td><td style="padding:8px">₱${order.total.toFixed(2)}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Address</td><td style="padding:8px">${order.delivery_address}</td></tr>
        ${order.notes ? `<tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Notes</td><td style="padding:8px">${order.notes}</td></tr>` : ''}
      </table>
      <a href="${dashboardUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">View Dashboard</a>
    </div>`
  )
}

export async function sendOrderStatusUpdateEmail(order: Order, statusLabel: string) {
  const trackingUrl = `${APP_URL}/order/${order.tracking_token}`

  await sendEmail(
    order.customer_email,
    `[${order.order_number}] Order update: ${statusLabel}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#f97316">Order Update</h2>
      <p>Hi ${order.customer_name},</p>
      <p>Your order <strong>${order.order_number}</strong> status has been updated to: <strong>${statusLabel}</strong></p>
      <a href="${trackingUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Track My Order</a>
    </div>`
  )
}

export async function sendRiderClaimedEmail(order: Order, riderName: string) {
  const trackingUrl = `${APP_URL}/order/${order.tracking_token}`
  await sendEmail(
    order.customer_email,
    `[${order.order_number}] Rider assigned to your order`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#f97316">Rider Assigned!</h2>
      <p>Hi ${order.customer_name},</p>
      <p><strong>${riderName}</strong> will be picking up your order <strong>${order.order_number}</strong> soon.</p>
      <a href="${trackingUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Track My Order</a>
    </div>`
  )
}

export async function sendRemittanceNotification(data: {
  restaurantEmail: string
  restaurantName: string
  amount: number
  remitType: 'partial' | 'full'
  totalRemitted: number
  totalDue: number
}) {
  const remaining = data.totalDue - data.totalRemitted
  await sendEmail(
    data.restaurantEmail,
    `[OhmerEats] ${data.remitType === 'full' ? 'Full' : 'Partial'} remittance received — ₱${data.amount.toFixed(2)}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#f97316">Remittance ${data.remitType === 'full' ? 'Complete ✓' : 'Received (Partial)'}</h2>
      <p>Hi ${data.restaurantName},</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Amount Received</td><td style="padding:8px">₱${data.amount.toFixed(2)}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Total Remitted</td><td style="padding:8px">₱${data.totalRemitted.toFixed(2)}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Total Due</td><td style="padding:8px">₱${data.totalDue.toFixed(2)}</td></tr>
        ${remaining > 0 ? `<tr><td style="padding:8px;background:#fff3cd;font-weight:bold">Balance Remaining</td><td style="padding:8px">₱${remaining.toFixed(2)}</td></tr>` : ''}
      </table>
      ${data.remitType === 'full' ? '<p style="color:green;font-weight:bold">✓ Fully settled.</p>' : `<p>Rider still owes ₱${remaining.toFixed(2)}.</p>`}
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">View Dashboard</a>
    </div>`
  )
}

export async function sendOverdueRemittanceAlert(data: {
  restaurantEmail: string
  restaurantName: string
  adminEmail: string
  riderName: string
  orderNumber: string
  amountDue: number
  amountRemitted: number
  daysOverdue: number
}) {
  const balance = data.amountDue - data.amountRemitted
  const subject = `⚠️ OVERDUE — ${data.orderNumber} — ${data.daysOverdue} days overdue`
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#dc3545">⚠️ Overdue Remittance Alert</h2>
    <p>Overdue by <strong>${data.daysOverdue} days</strong>:</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Order</td><td style="padding:8px">${data.orderNumber}</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Rider</td><td style="padding:8px">${data.riderName}</td></tr>
      <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Amount Due</td><td style="padding:8px">₱${data.amountDue.toFixed(2)}</td></tr>
      <tr><td style="padding:8px;background:#fff3cd;font-weight:bold">Balance Owed</td><td style="padding:8px">₱${balance.toFixed(2)}</td></tr>
    </table>
    <a href="${APP_URL}/admin/orders" style="display:inline-block;background:#dc3545;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">View in Admin</a>
  </div>`
  await sendEmail(data.restaurantEmail, subject, html)
  if (data.adminEmail && data.adminEmail !== data.restaurantEmail) {
    await sendEmail(data.adminEmail, subject, html)
  }
}
