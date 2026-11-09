import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/firebase'
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adId, type, userId } = body

    if (!adId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adRef = doc(db, 'ads', adId)
    const adDoc = await getDoc(adRef)

    if (!adDoc.exists()) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    if (type === 'impression') {
      await updateDoc(adRef, {
        impressions: increment(1),
      })
    } else if (type === 'click') {
      await updateDoc(adRef, {
        clicks: increment(1),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ad tracking error:', error)
    return NextResponse.json({ error: 'Failed to track ad' }, { status: 500 })
  }
}
