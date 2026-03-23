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

export async function toggleRestaurantOpen(
  restaurantId: string,
  isOpen: boolean,
  slug?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('restaurants')
      .update({ is_open: isOpen })
      .eq('id', restaurantId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    if (slug) revalidatePath(`/restaurant/${slug}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Failed to update restaurant.' }
  }
}

export async function toggleMenuItemAvailability(
  itemId: string,
  isAvailable: boolean,
  slug?: string
): Promise<{ success: boolean }> {
  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', itemId)
    if (error) { console.error('toggleMenuItemAvailability error:', error); return { success: false } }
    revalidatePath('/dashboard/menu')
    if (slug) revalidatePath(`/restaurant/${slug}`)
    return { success: true }
  } catch (err) {
    console.error('toggleMenuItemAvailability error:', err)
    return { success: false }
  }
}
