import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PATCH — update restaurant (toggle active, open/closed, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('restaurants')
      .update(body)
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to update.' }, { status: 500 })
  }
}

// DELETE — remove restaurant and its menu items
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getAdminClient()

    // Delete menu items first (cascade should handle it but being explicit)
    await supabase.from('menu_items').delete().eq('restaurant_id', id)
    await supabase.from('menu_categories').delete().eq('restaurant_id', id)

    // Delete the restaurant
    const { error } = await supabase.from('restaurants').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to delete.' }, { status: 500 })
  }
}
