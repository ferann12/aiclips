import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, content, imageUrl, targetUrl, platform } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adRef = await addDoc(collection(db, 'ads'), {
      name,
      type, // 'banner', 'video', 'native'
      content,
      imageUrl,
      targetUrl,
      platform,
      impressions: 0,
      clicks: 0,
      revenue: 0,
      active: true,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({ success: true, id: adRef.id })
  } catch (error) {
    console.error('Ad creation error:', error)
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get('platform')
    const active = searchParams.get('active')

    let q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'))

    const snapshot = await getDocs(q)
    const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Filter on the client side for simplicity
    let filteredAds = ads
    if (platform) {
      filteredAds = filteredAds.filter((ad: any) => ad.platform === platform)
    }
    if (active === 'true') {
      filteredAds = filteredAds.filter((ad: any) => ad.active === true)
    }

    return NextResponse.json({ ads: filteredAds })
  } catch (error) {
    console.error('Ads fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
  }
}
