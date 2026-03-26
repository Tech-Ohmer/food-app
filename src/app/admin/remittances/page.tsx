import { createServiceClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { RemitStatus } from '@/types'
import { REMIT_STATUS_LABELS, REMIT_STATUS_COLORS } from '@/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminRemittancesPage() {
  const supabase = await createServiceClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, restaurants(name), riders(name)')
    .eq('status', 'delivered')
    .order('remit_status', { ascending: true })
    .order('remit_due_date', { ascending: true })

  const totalDue = (orders ?? []).reduce((sum, o) => sum + ((o.restaurant_amount ?? o.subtotal) - (o.amount_remitted ?? 0)), 0)
  const totalReceived = (orders ?? []).reduce((sum, o) => sum + (o.amount_remitted ?? 0), 0)
  const overdueOrders = (orders ?? []).filter(o => o.remit_status === 'overdue')
  const pendingOrders = (orders ?? []).filter(o => o.remit_status === 'pending' || o.remit_status === 'partial')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Remittance Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">All rider remittances across all restaurants</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500">Total Received</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500">Still Outstanding</p>
          <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalDue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500">Overdue</p>
          <p className={cn('text-2xl font-bold', overdueOrders.length > 0 ? 'text-red-600' : 'text-gray-400')}>{overdueOrders.length}</p>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueOrders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-red-800 mb-2">⚠️ {overdueOrders.length} Overdue Remittance{overdueOrders.length !== 1 ? 's' : ''}</h2>
          <p className="text-sm text-red-700">The following orders have overdue remittances. Restaurant owners and admin have been notified via email.</p>
        </div>
      )}

      {/* Full table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All Delivered Orders</h2>
        </div>
        {(!orders || orders.length === 0) ? (
          <div className="p-10 text-center text-gray-400">No delivered orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Restaurant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rider</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rider Earns</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Remit Due</th>
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
                      <td className="px-4 py-3 text-gray-700">{(order.restaurants as any)?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{(order.riders as any)?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-green-600 font-medium">{formatCurrency(order.rider_earnings ?? order.delivery_fee)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{formatCurrency(amountDue)}</div>
                        {balance > 0 && <div className="text-xs text-orange-500">Balance: {formatCurrency(balance)}</div>}
                        {order.remit_due_date && (
                          <div className={cn('text-xs', isOverdue ? 'text-red-500 font-medium' : 'text-gray-400')}>
                            {isOverdue ? '⚠️ ' : 'Due: '}{new Date(order.remit_due_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('font-medium', amountRemitted > 0 ? 'text-green-600' : 'text-gray-400')}>
                          {formatCurrency(amountRemitted)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                          REMIT_STATUS_COLORS[order.remit_status as RemitStatus] ?? 'bg-yellow-100 text-yellow-800')}>
                          {REMIT_STATUS_LABELS[order.remit_status as RemitStatus] ?? 'Pending'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
