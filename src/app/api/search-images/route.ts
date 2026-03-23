import { NextResponse } from 'next/server'

// Free image search using Unsplash Source (no API key needed)
// Falls back to a curated list of food image searches
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? 'food'
  const encoded = encodeURIComponent(query + ',food,meal')

  // Return 9 unique Unsplash search URLs using different random seeds
  const images = Array.from({ length: 9 }, (_, i) => ({
    url: `https://source.unsplash.com/400x300/?${encoded}&sig=${i + Math.floor(Math.random() * 1000)}`,
    thumb: `https://source.unsplash.com/200x150/?${encoded}&sig=${i + Math.floor(Math.random() * 1000)}`,
    alt: `${query} photo ${i + 1}`,
  }))

  return NextResponse.json({ images, query })
}
