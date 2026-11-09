import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.APISHORT_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const platform = searchParams.get('platform') || 'shortmax'
  const endpoint = searchParams.get('endpoint') || ''
  
  if (!API_KEY) {
    console.error('APISHORT_API_KEY not configured')
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    
    // Build query params excluding platform and endpoint
    const queryParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== 'platform' && key !== 'endpoint') {
        queryParams.append(key, value)
      }
    })
    
    // Try multiple URL formats since API structure varies by endpoint
    // Play endpoints need /api/v1/, others don't
    const isPlayEndpoint = cleanEndpoint.startsWith('play/')
    const urls = isPlayEndpoint
      ? [
          `https://apishort.com/v1/${platform}/api/v1/${cleanEndpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
          `https://apishort.com/v1/${platform}/${cleanEndpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
        ]
      : [
          `https://apishort.com/v1/${platform}/${cleanEndpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
          `https://apishort.com/v1/${platform}/api/v1/${cleanEndpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
        ]
    
    let lastError = null
    for (const url of urls) {
      console.log('Fetching from APIShort:', url)
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': API_KEY,
        },
        next: { revalidate: 600 },
      })

      console.log('APIShort response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
      
      lastError = { status: response.status, text: await response.text() }
      console.log('APIShort error for URL:', url, lastError)
    }
    
    return NextResponse.json(
      { error: `APIShort error: ${lastError?.status}`, details: lastError?.text },
      { status: lastError?.status || 500 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch from APIShort' },
      { status: 500 }
    )
  }
}
