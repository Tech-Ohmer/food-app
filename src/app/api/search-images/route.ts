import { NextResponse } from 'next/server'

// Free image placeholder using picsum.photos (no API key needed, always works)
// Images are high-quality photos with unique seeds per query+index
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? 'food'

  // Generate 9 unique seeds based on query + index for consistent but varied results
  const baseHash = query.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const images = Array.from({ length: 9 }, (_, i) => {
    const seed = `${query}-${baseHash + i * 37}`
    return {
      url: `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/300`,
      thumb: `https://picsum.photos/seed/${encodeURIComponent(seed)}/200/150`,
      alt: `${query} photo ${i + 1}`,
    }
  })

  return NextResponse.json({ images, query })
}
