import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'https://apishort.com'
const API_TOKEN = process.env.APISHORT_API_KEY || 'vbs_fd2ed3230cef00b1f1b88037bd957c56cbc13c82a93f3b06'

// ReelShort endpoint mappings
const ENDPOINT_MAPPINGS: Record<string, string> = {
  feed: 'home',
  trending: 'trending',
  search: 'search',
  detail: 'detail',
  allepisode: 'episodes',
  browse: 'shelf',
  category: 'category',
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const platform = searchParams.get('platform') || 'reelshort'
  const endpoint = searchParams.get('endpoint') || 'home'
  const lang = searchParams.get('lang') || 'en'

  try {
    const mappedEndpoint = ENDPOINT_MAPPINGS[endpoint] || endpoint
    let url = `${API_BASE}/v1/reelshort/api/v1/${mappedEndpoint}?lang=${lang}`

    // Add query parameters
    if (endpoint === 'search') {
      url += `&q=${searchParams.get('query') || ''}`
    } else if (endpoint === 'detail' || endpoint === 'allepisode') {
      const bookId = searchParams.get('bookId') || ''
      url += `&bookId=${bookId}`
    } else if (endpoint === 'browse' || endpoint === 'category') {
      url += `&page=${searchParams.get('page') || '1'}`
      if (endpoint === 'category') {
        url += `&category=${searchParams.get('category') || '1'}`
      }
    }
    
    console.log('Fetching from API:', url)
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_TOKEN,
      },
    })

    console.log('API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('API error body:', errorText)
      return NextResponse.json(
        { error: `API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from API' },
      { status: 500 }
    )
  }
}
