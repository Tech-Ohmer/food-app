import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, slug, description, address, phone, owner_email } = body

    if (!name || !slug || !address || !owner_email) {
      return NextResponse.json({ error: 'Name, address and owner email are required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { error } = await supabase.from('restaurants').insert({
      name,
      slug,
      description: description || null,
      address,
      phone: phone || null,
      owner_email,
      is_open: false,
      is_active: true,
    })

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        return NextResponse.json({ error: 'A restaurant with that name already exists.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to create restaurant.' }, { status: 500 })
  }
}
