import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Order, RemitStatus, RemittanceRule } from '@/types'
import { REMIT_STATUS_LABELS, REMIT_STATUS_COLORS, REMITTANCE_RULE_LABELS } from '@/types'
import RemittanceRulesForm from '@/components/dashboard/RemittanceRulesForm'

export const dynamic = 'force-dynamic'

export default async function DashboardRemittancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = await createServiceClient()

  const { data: restaurant } = await serviceClient
    .from('restaurants')
    .select('*')
    .eq('owner_email', user.email ?? '')
    .single()

  if (!restaurant) redirect('/login')

  const { data: orders } = await serviceClient
    .from('orders')
    .select('*, riders(name), remittance_logs(*)')
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })

  const totalDue = (orders ?? []).reduce((sum, o) => sum + ((o.restaurant_amount ?? o.subtotal) - (o.amount_remitted ?? 0)), 0)
  const totalReceived = (orders ?? []).reduce((sum, o) => sum + (o.amount_remitted ?? 0), 0)
  const overdueCount = (orders ?? []).filter(o => o.remit_status === 'overdue').length
  const pendingCount = (orders ?? []).filter(o => o.remit_status !== 'full').length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Remittances</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track rider payments for delivered orders</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500">Total Received</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500">Still Owed</p>
          <p className="text-xl font-bold text-orange-500">{formatCurrency(totalDue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500">Pending Orders</p>
          <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500">Overdue</p>
          <p className={cn('text-xl font-bold', overdueCount > 0 ? 'text-red-600' : 'text-gray-400')}>{overdueCount}</p>
        </div>
      </div>

      {/* Remittance rules settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Remittance Rules</h2>
        <p className="text-sm text-gray-500 mb-4">
          Set how long riders have to remit after each delivery. Admin and rider are notified if overdue by 3+ days.
        </p>
        <RemittanceRulesForm
          restaurantId={restaurant.id}
          currentRule={restaurant.remittance_rule as RemittanceRule ?? 'per_delivery'}
          currentDays={restaurant.remittance_days ?? 1}
        />
      </div>

      {/* Orders list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Delivered Orders</h2>
        </div>
        {(!orders || orders.length === 0) ? (
          <div className="p-10 text-center text-gray-400">No delivered orders yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Rider</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Remitted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(orders as any[]).map((order) => {
                const amountDue = order.restaurant_amount ?? order.subtotal
                const amountRemitted = order.amount_remitted ?? 0
                const balance = amountDue - amountRemitted
                const isOverdue = order.remit_status === 'overdue'

                return (
                  <tr key={order.id} className={cn('hover:bg-gray-50', isOverdue && 'bg-red-50')}>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-500">{order.order_number}</div>
                      <div className="text-xs text-gray-400">{formatDate(order.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {(order.riders as any)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{formatCurrency(amountDue)}</div>
                      {balance > 0 && <div className="text-xs text-orange-500">Balance: {formatCurrency(balance)}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn('font-medium', amountRemitted > 0 ? 'text-green-600' : 'text-gray-400')}>
                        {formatCurrency(amountRemitted)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                        REMIT_STATUS_COLORS[order.remit_status as RemitStatus] ?? 'bg-yellow-100 text-yellow-800')}>
                        {REMIT_STATUS_LABELS[order.remit_status as RemitStatus] ?? 'Pending'}
                      </span>
                      {order.remit_due_date && (
                        <div className={cn('text-xs mt-1', isOverdue ? 'text-red-500 font-medium' : 'text-gray-400')}>
                          {isOverdue ? '⚠️ ' : ''}{new Date(order.remit_due_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
