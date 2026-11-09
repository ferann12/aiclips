import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, showId, showTitle, platform, action } = body

    if (!showId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Track the event
    await addDoc(collection(db, 'analytics'), {
      userId: userId || null,
      showId,
      showTitle,
      platform,
      action, // 'view', 'watch', 'complete'
      timestamp: serverTimestamp(),
    })

    // Update user stats if logged in
    if (userId) {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        if (action === 'complete') {
          await updateDoc(userRef, {
            showsWatched: increment(1),
          })
        }
      }
    }

    // Update show stats
    const showRef = doc(db, 'shows', showId)
    const showDoc = await getDoc(showRef)

    if (!showDoc.exists()) {
      await addDoc(collection(db, 'shows'), {
        id: showId,
        title: showTitle,
        platform,
        totalViews: 1,
        totalWatchTime: 0,
        createdAt: serverTimestamp(),
      })
    } else {
      await updateDoc(showRef, {
        totalViews: increment(1),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}
