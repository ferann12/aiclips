import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.ANICHIN_API_KEY || 'TRIAL-ANICHIN-2026'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const source = searchParams.get('source') || 'dramabox'
  const endpoint = searchParams.get('endpoint') || 'trending'
  
  try {
    // Build query params excluding source and endpoint
    const queryParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== 'source' && key !== 'endpoint') {
        queryParams.append(key, value)
      }
    })
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    const url = `https://api.anichin.bio/${source}/${cleanEndpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    console.log('Fetching from Anichin:', url)
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 600 }, // Cache for 10 minutes
    })

    console.log('Anichin response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('Anichin error body:', errorText)
      return NextResponse.json(
        { error: `Anichin error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Anichin fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Anichin' },
      { status: 500 }
    )
  }
}
