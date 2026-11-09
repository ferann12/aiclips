import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const API_KEY = process.env.APIDRAMA_API_KEY
const API_SECRET = process.env.APIDRAMA_API_SECRET

// HMAC-SHA256 signature as per API Drama documentation
function generateSignature(timestamp: string): string {
  if (!API_SECRET) return ''
  const message = `${timestamp}${API_SECRET}`
  return crypto.createHmac('sha256', API_SECRET).update(message).digest('hex')
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const platform = searchParams.get('platform') || 'dramabox'
  const endpoint = searchParams.get('endpoint') || 'home'
  
  if (!API_KEY) {
    console.error('APIDRAMA_API_KEY not configured')
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    // Build query params excluding platform and endpoint
    const queryParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== 'platform' && key !== 'endpoint') {
        queryParams.append(key, value)
      }
    })
    
    // Add required category_p parameter
    queryParams.append('category_p', platform)
    
    // Add timestamp and signature for HMAC auth
    const timestamp = Date.now().toString()
    queryParams.append('timestamp', timestamp)
    
    if (API_SECRET) {
      const signature = generateSignature(timestamp)
      queryParams.append('signature', signature)
    }
    
    const url = `https://api-drama.dobda.id/api/v2/${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    console.log('Fetching from API Drama:', url)
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
      },
      next: { revalidate: 600 }, // Cache for 10 minutes
    })

    console.log('API Drama response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('API Drama error body:', errorText)
      return NextResponse.json(
        { error: `API Drama error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Drama fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from API Drama' },
      { status: 500 }
    )
  }
}
