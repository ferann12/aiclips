import { NextRequest, NextResponse } from 'next/server'

const LOCAL_BACKEND_URL = process.env.LOCAL_DRAMA_BACKEND || 'http://127.0.0.1:8790'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const url = `${LOCAL_BACKEND_URL}/media/${path}`
  
  try {
    console.log('Proxying media request to:', url)
    
    // Forward cookies from the browser to maintain session
    const cookieHeader = request.headers.get('cookie')
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
        'Range': request.headers.get('Range') || '',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Media proxy error: ${response.status}` },
        { status: response.status }
      )
    }

    const headers = new Headers()
    response.headers.forEach((value, key) => {
      if (key !== 'transfer-encoding' && key !== 'connection' && key !== 'set-cookie') {
        headers.set(key, value)
      }
    })

    const responseData = new NextResponse(response.body, {
      status: response.status,
      headers,
    })

    // Forward all set-cookie headers to maintain session
    const setCookieHeaders = response.headers.getSetCookie()
    setCookieHeaders.forEach(cookie => {
      responseData.cookies.set(cookie)
    })

    return responseData
  } catch (error) {
    console.error('Media proxy error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('URL being proxied:', url)
    return NextResponse.json(
      { error: 'Failed to proxy media request', details: error instanceof Error ? error.message : String(error), url },
      { status: 500 }
    )
  }
}
