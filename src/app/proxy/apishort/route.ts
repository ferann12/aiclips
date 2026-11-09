import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.APISHORT_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const platform = searchParams.get('platform') || 'shortmax'
  const endpoint = searchParams.get('endpoint') || ''
  
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const url = `https://apishort.com/v1/${platform}${endpoint}?${searchParams.toString().replace('platform=', '').replace('endpoint=', '')}`
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
      },
      next: { revalidate: 600 }, // Cache for 10 minutes to respect rate limits
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `APIShort error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch from APIShort' },
      { status: 500 }
    )
  }
}
