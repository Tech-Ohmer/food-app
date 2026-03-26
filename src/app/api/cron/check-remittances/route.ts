import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendOverdueRemittanceAlert } from '@/lib/email'

// Vercel Cron Job — runs daily at midnight Manila time
// Free on Vercel Hobby plan

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  // Verify it's a legitimate cron request (Vercel sends Authorization header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? 'ohmereats-cron'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Find orders that are overdue by 3+ days
    const { data: overdueOrders } = await supabase
      .from('orders')
      .select('*, restaurants(*), riders(*)')
      .eq('status', 'delivered')
      .neq('remit_status', 'full')
      .lt('remit_due_date', threeDaysAgo)
      .neq('remit_status', 'overdue') // Don't re-notify already marked overdue

    if (!overdueOrders || overdueOrders.length === 0) {
      return NextResponse.json({ message: 'No overdue remittances found.', checked: today })
    }

    let notified = 0
    const adminEmail = process.env.ADMIN_EMAIL ?? ''

    for (const order of overdueOrders) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(order.remit_due_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      const restaurantEmail = (order.restaurants as any)?.owner_email
      const restaurantName = (order.restaurants as any)?.name ?? 'Restaurant'
      const riderName = (order.riders as any)?.name ?? 'Unknown Rider'
      const amountDue = order.restaurant_amount ?? order.subtotal
      const amountRemitted = order.amount_remitted ?? 0

      // Mark as overdue in DB
      await supabase
        .from('orders')
        .update({ remit_status: 'overdue' })
        .eq('id', order.id)

      // Send alert emails
      if (restaurantEmail) {
        await sendOverdueRemittanceAlert({
          restaurantEmail,
          restaurantName,
          adminEmail,
          riderName,
          orderNumber: order.order_number,
          amountDue,
          amountRemitted,
          daysOverdue,
        })
        notified++
      }
    }

    console.log(`[CRON] Checked remittances for ${today}. Notified: ${notified} overdue orders.`)
    return NextResponse.json({
      message: `Cron completed. ${notified} overdue remittance alerts sent.`,
      date: today,
    })
  } catch (err: any) {
    console.error('[CRON] Error:', err)
    return NextResponse.json({ error: err?.message ?? 'Cron failed.' }, { status: 500 })
  }
}
