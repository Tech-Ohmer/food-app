import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import type { Restaurant, MenuItem, MenuCategory } from '@/types'
import CartSidebar from '@/components/customer/CartSidebar'

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServiceClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!restaurant) notFound()

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order')

  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('sort_order')

  const typedRestaurant = restaurant as Restaurant
  const typedCategories = (categories ?? []) as MenuCategory[]
  const typedItems = (items ?? []) as MenuItem[]

  // Group items by category
  const uncategorized = typedItems.filter(i => !i.category_id)
  const grouped = typedCategories.map(cat => ({
    category: cat,
    items: typedItems.filter(i => i.category_id === cat.id),
  })).filter(g => g.items.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/" className="text-sm text-orange-500 hover:underline">← All Restaurants</Link>
        </div>

        {/* Cover */}
        <div className="h-48 bg-gradient-to-r from-orange-400 to-red-400 relative">
          {typedRestaurant.cover_url && (
            <img src={typedRestaurant.cover_url} alt={typedRestaurant.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-end">
            <div className="max-w-5xl mx-auto px-4 pb-4 w-full">
              <div className="flex items-center gap-3">
                {typedRestaurant.logo_url && (
                  <img src={typedRestaurant.logo_url} alt="" className="w-14 h-14 rounded-full border-2 border-white object-cover" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">{typedRestaurant.name}</h1>
                  <p className="text-white/80 text-sm">{typedRestaurant.address}</p>
                </div>
                <span className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-full ${
                  typedRestaurant.is_open ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {typedRestaurant.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!typedRestaurant.is_open && (
          <div className="bg-red-50 border-b border-red-100 text-red-700 px-4 py-2 text-sm text-center">
            This restaurant is currently closed. You can still browse the menu.
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* Menu */}
        <div className="flex-1">
          {typedRestaurant.description && (
            <p className="text-gray-500 mb-6">{typedRestaurant.description}</p>
          )}

          {grouped.length === 0 && uncategorized.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🍽️</div>
              <p>No menu items available yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map(({ category, items }) => (
                <div key={category.id}>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    {category.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map(item => (
                      <MenuItemCard key={item.id} item={item} restaurantOpen={typedRestaurant.is_open} />
                    ))}
                  </div>
                </div>
              ))}

              {uncategorized.length > 0 && (
                <div>
                  {grouped.length > 0 && (
                    <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Others</h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {uncategorized.map(item => (
                      <MenuItemCard key={item.id} item={item} restaurantOpen={typedRestaurant.is_open} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <CartSidebar
          restaurantId={typedRestaurant.id}
          restaurantName={typedRestaurant.name}
          restaurantOwnerEmail={typedRestaurant.owner_email}
          restaurantSlug={typedRestaurant.slug}
          isOpen={typedRestaurant.is_open}
        />
      </div>
    </div>
  )
}

function MenuItemCard({ item, restaurantOpen }: { item: MenuItem; restaurantOpen: boolean }) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 hover:border-orange-200 transition-colors"
      data-item={JSON.stringify({ id: item.id, name: item.name, price: item.price })}
    >
      {item.image_url && (
        <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-orange-500">{formatCurrency(item.price)}</span>
          {restaurantOpen && (
            <button
              className="add-to-cart-btn text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors"
              data-item-id={item.id}
              data-item-name={item.name}
              data-item-price={item.price}
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
