import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Restaurant } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminRestaurantsPage() {
  const supabase = await createServiceClient()
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*')
    .order('name')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
        <Link
          href="/admin/restaurants/new"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Restaurant
        </Link>
      </div>

      {(!restaurants || restaurants.length === 0) ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
          <div className="text-4xl mb-3">🍽️</div>
          <p>No restaurants yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Restaurant</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Owner Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(restaurants as Restaurant[]).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.address}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 hidden md:table-cell">{r.owner_email}</td>
                  <td className="px-5 py-4">
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', r.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                      {r.is_open ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', r.is_active ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}>
                      {r.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">To add a restaurant:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Add the restaurant here</li>
          <li>Create a Supabase email/password account for the restaurant owner</li>
          <li>The restaurant owner logs in at <strong>/login</strong> to manage orders and menu</li>
        </ol>
      </div>
    </div>
  )
}
