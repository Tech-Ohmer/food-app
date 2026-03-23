'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

export async function createRestaurant(data: {
  name: string
  description: string
  address: string
  phone: string
  owner_email: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const slug = slugify(data.name)
    const { error } = await supabase.from('restaurants').insert({ ...data, slug })
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('createRestaurant error:', err)
    return { success: false, error: 'Failed to create restaurant.' }
  }
}

export async function toggleRestaurantOpen(
  restaurantId: string,
  isOpen: boolean,
  _slug?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('restaurants')
      .update({ is_open: isOpen })
      .eq('id', restaurantId)
    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Failed to update restaurant.' }
  }
}

export async function toggleMenuItemAvailability(
  itemId: string,
  isAvailable: boolean,
  _slug?: string
): Promise<{ success: boolean }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', itemId)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('toggleMenuItemAvailability error:', err)
    return { success: false }
  }
}

export async function addMenuItem(data: {
  restaurant_id: string
  category_id: string | null
  name: string
  description: string
  price: number
  is_available: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase.from('menu_items').insert(data)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('addMenuItem error:', err)
    return { success: false, error: 'Failed to add menu item.' }
  }
}

export async function updateMenuItem(
  id: string,
  data: Partial<{
    name: string
    description: string
    price: number
    is_available: boolean
    category_id: string | null
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase.from('menu_items').update(data).eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Failed to update item.' }
  }
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Failed to delete item.' }
  }
}

export async function addMenuCategory(
  restaurantId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase.from('menu_categories').insert({ restaurant_id: restaurantId, name })
    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Failed to add category.' }
  }
}
