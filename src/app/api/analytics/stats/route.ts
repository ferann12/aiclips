import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const showId = searchParams.get('showId')
    const platform = searchParams.get('platform')

    if (showId) {
      // Get stats for a specific show
      const showRef = doc(db, 'shows', showId)
      const showDoc = await getDoc(showRef)

      if (!showDoc.exists()) {
        return NextResponse.json({ totalViews: 0, totalWatchTime: 0 })
      }

      return NextResponse.json(showDoc.data())
    }

    if (platform) {
      // Get top shows for a platform
      const showsQuery = query(
        collection(db, 'shows'),
        where('platform', '==', platform),
        orderBy('totalViews', 'desc'),
        limit(10)
      )
      const snapshot = await getDocs(showsQuery)
      const shows = snapshot.docs.map(doc => doc.data())

      return NextResponse.json({ shows })
    }

    // Get overall stats
    const analyticsQuery = query(
      collection(db, 'analytics'),
      orderBy('timestamp', 'desc'),
      limit(100)
    )
    const snapshot = await getDocs(analyticsQuery)
    const events = snapshot.docs.map(doc => doc.data())

    const totalViews = events.filter((e: any) => e.action === 'view').length
    const totalCompletions = events.filter((e: any) => e.action === 'complete').length

    return NextResponse.json({
      totalViews,
      totalCompletions,
      recentEvents: events,
    })
  } catch (error) {
    console.error('Analytics stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
