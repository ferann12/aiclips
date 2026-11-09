import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const provider = searchParams.get('provider') || 'shortmax'
  const endpoint = searchParams.get('endpoint') || 'home'
  
  try {
    // Build query params excluding provider and endpoint
    const queryParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== 'provider' && key !== 'endpoint') {
        queryParams.append(key, value)
      }
    })
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    const url = `https://dramabos.live/${provider}/api/v1/${cleanEndpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    console.log('Fetching from DramaBos:', url)
    
    const response = await fetch(url, {
      next: { revalidate: 600 }, // Cache for 10 minutes
    })

    console.log('DramaBos response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('DramaBos error body:', errorText)
      return NextResponse.json(
        { error: `DramaBos error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('DramaBos fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from DramaBos' },
      { status: 500 }
    )
  }
}
