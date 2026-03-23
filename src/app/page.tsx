import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import type { Restaurant } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createServiceClient()
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const typedRestaurants = (restaurants ?? []) as Restaurant[]

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍔</span>
            <span className="text-xl font-bold text-orange-500">OhmerEats</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-orange-500 px-4 py-2 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
              Restaurant / Rider Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Order food you love 🍕
        </h1>
        <p className="text-gray-500 text-lg mb-8">
          Fresh food delivered to your door. Fast, easy, free to use.
        </p>
      </div>

      {/* Restaurant List */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {typedRestaurants.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-xl font-medium">No restaurants yet</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {typedRestaurants.filter(r => r.is_open).length > 0
                ? 'Open Now'
                : 'Restaurants'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {typedRestaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurant/${restaurant.slug}`}
                  className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group ${
                    !restaurant.is_open ? 'opacity-70' : ''
                  }`}
                >
                  {/* Cover */}
                  <div className="h-40 bg-gradient-to-br from-orange-400 to-red-400 relative overflow-hidden">
                    {restaurant.cover_url ? (
                      <img
                        src={restaurant.cover_url}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        🍽️
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        restaurant.is_open
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {restaurant.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {restaurant.logo_url && (
                        <img
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900">{restaurant.name}</h3>
                        <p className="text-xs text-gray-400">{restaurant.address}</p>
                      </div>
                    </div>
                    {restaurant.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{restaurant.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <span>🚚 Cash on delivery</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
