import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST — create a new menu item
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { restaurant_id, name, description, price, category_id, image_url } = body

    if (!restaurant_id || !name || !price) {
      return NextResponse.json({ error: 'restaurant_id, name and price are required.' }, { status: 400 })
    }

    const supabase = getAdminClient()
    const { error } = await supabase.from('menu_items').insert({
      restaurant_id,
      name,
      description: description || null,
      price: parseFloat(price),
      category_id: category_id || null,
      image_url: image_url || null,
      is_available: true,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to add item.' }, { status: 500 })
  }
}
