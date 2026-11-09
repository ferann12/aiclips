import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.HOSHIYOMI_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const platform = searchParams.get('platform') || 'dramabox'
  const endpoint = searchParams.get('endpoint') || 'trending'
  
  try {
    // Build query params excluding platform and endpoint
    const queryParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== 'platform' && key !== 'endpoint') {
        queryParams.append(key, value)
      }
    })
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    const url = `https://api.hoshiyomi.my.id/api/${platform}/${cleanEndpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    console.log('Fetching from Hoshiyomi:', url)
    
    const headers: HeadersInit = {}
    if (API_KEY) {
      headers['X-API-Key'] = API_KEY
    }
    
    const response = await fetch(url, {
      headers,
      next: { revalidate: 600 }, // Cache for 10 minutes
    })

    console.log('Hoshiyomi response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('Hoshiyomi error body:', errorText)
      return NextResponse.json(
        { error: `Hoshiyomi error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Hoshiyomi fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Hoshiyomi' },
      { status: 500 }
    )
  }
}
