export type Show = {
  title: string
  meta: string
  image: string
  tag?: string
  genre: string
  episodes: number
  description: string
  platform?: string
  id?: string
}

type PlatformConfig = {
  name: string
  popularEndpoint: string
  categoryEndpoint: string
  searchEndpoint: string
}

const PLATFORMS: Record<string, PlatformConfig> = {
  dramabox: {
    name: 'DramaBox',
    popularEndpoint: 'feed',
    categoryEndpoint: 'rank',
    searchEndpoint: 'search',
  },
  reelshort: {
    name: 'ReelShort',
    popularEndpoint: 'feed',
    categoryEndpoint: 'rank',
    searchEndpoint: 'search',
  },
  netshort: {
    name: 'NetShort',
    popularEndpoint: 'feed',
    categoryEndpoint: 'rank',
    searchEndpoint: 'search',
  },
  goodshort: {
    name: 'GoodShort',
    popularEndpoint: 'feed',
    categoryEndpoint: 'rank',
    searchEndpoint: 'search',
  },
}

function transformShow(item: any, platform: string): Show {
  const image = item.cover_source || item.cover || item.coverWap || item.poster || item.image || item.vertical_cover || item.cover_url || ''
  const episodeCount = item.episodes || item.episode_count || item.total_episodes || item.chapterCount || item.totalChapterNum || 0
  
  return {
    title: item.title || item.name || item.drama_name || item.bookName || 'Unknown',
    meta: `${episodeCount} Episodes`,
    image: image || 'https://images.unsplash.com/photo-1745318829873-7ab9aba9bcd5?auto=format&fit=crop&w=400&q=80',
    tag: item.is_hot || item.is_new ? (item.is_hot ? 'Hot' : 'New') : undefined,
    genre: item.category_name || item.category || item.genre || item.type_name || 'Drama',
    episodes: episodeCount,
    description: item.description || item.intro || item.synopsis || item.brief || item.introduction || 'No description available',
    platform,
    id: item.id || item.drama_id || item.short_drama_id || item.bookId || undefined,
  }
}

export async function fetchPopularShows(platform = 'dramabox', page = 1, lang = 'en'): Promise<Show[]> {
  try {
    const config = PLATFORMS[platform] || PLATFORMS.dramabox
    const response = await fetch(`/api/localdrama?platform=${platform}&endpoint=${config.popularEndpoint}&lang=${lang}`, {
      method: 'GET',
    })
    const data = await response.json()
    
    // API returns array directly or wrapped in data
    const items = data.data || data.items || data || []
    if (Array.isArray(items)) {
      return items.map((item: any) => transformShow(item, platform))
    }
    return []
  } catch (error) {
    console.error(`Error fetching ${platform} popular:`, error)
    return []
  }
}

export async function fetchCategoryShows(platform = 'dramabox', categoryId = 1, page = 1, lang = 'en'): Promise<Show[]> {
  try {
    const config = PLATFORMS[platform] || PLATFORMS.dramabox
    const response = await fetch(`/api/localdrama?platform=${platform}&endpoint=category&category=${categoryId}&page=${page}&lang=${lang}`, {
      method: 'GET',
    })
    const data = await response.json()
    
    const items = data.data || data.items || data || []
    if (Array.isArray(items)) {
      return items.map((item: any) => transformShow(item, platform))
    }
    return []
  } catch (error) {
    console.error(`Error fetching ${platform} category:`, error)
    return []
  }
}

export async function searchShows(platform = 'dramabox', query: string, page = 1, lang = 'en'): Promise<Show[]> {
  try {
    const config = PLATFORMS[platform] || PLATFORMS.dramabox
    const response = await fetch(`/api/localdrama?platform=${platform}&endpoint=search&query=${encodeURIComponent(query)}&lang=${lang}`, {
      method: 'GET',
    })
    const data = await response.json()
    
    console.log('Search response:', data)
    
    // Handle different response structures
    let items = []
    if (Array.isArray(data)) {
      items = data
    } else if (Array.isArray(data.data)) {
      items = data.data
    } else if (Array.isArray(data.items)) {
      items = data.items
    } else if (Array.isArray(data.results)) {
      items = data.results
    } else if (data.bookList && Array.isArray(data.bookList)) {
      items = data.bookList
    }
    
    if (items.length > 0) {
      return items.map((item: any) => transformShow(item, platform))
    }
    return []
  } catch (error) {
    console.error(`Error searching ${platform}:`, error)
    return []
  }
}

export async function fetchFromMultiplePlatforms(
  platforms: string[] = ['dramabox', 'reelshort', 'netshort', 'goodshort'],
  page = 1,
  lang = 'en'
): Promise<Show[]> {
  const results = await Promise.allSettled(
    platforms.map(platform => fetchPopularShows(platform, page, lang))
  )

  const allShows: Show[] = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allShows.push(...result.value)
    }
  })

  return allShows
}

export async function fetchEpisodeVideoUrl(
  platform = 'dramabox',
  dramaId: string,
  episodeNumber = 1,
  lang = 'en'
): Promise<string | null> {
  try {
    // Fetch episode details based on platform
    let url = `/api/localdrama?platform=${platform}&endpoint=detail&bookId=${dramaId}&lang=${lang}`
    
    // For NetShort and GoodShort, use different endpoint structure
    if (platform === 'netshort') {
      url = `/api/localdrama?platform=${platform}&endpoint=detail&bookId=${dramaId}&lang=${lang}`
    } else if (platform === 'goodshort') {
      url = `/api/localdrama?platform=${platform}&endpoint=detail&bookId=${dramaId}&lang=${lang}`
    }
    
    const response = await fetch(url, { method: 'GET' })
    const data = await response.json()
    
    console.log('Detail response:', data)
    
    // Try to find video URL in various response structures
    let videoUrl = null
    
    // Check for direct video URL
    if (data.videoUrl || data.video_url || data.mp4 || data.url) {
      videoUrl = data.videoUrl || data.video_url || data.mp4 || data.url
    }
    
    // Check in chapters/episodes array
    if (!videoUrl && (data.chapterList || data.episodes || data.items)) {
      const chapters = data.chapterList || data.episodes || data.items || []
      const targetChapter = chapters.find((ep: any) => 
        (ep.index === episodeNumber - 1) || 
        (ep.chapterNumber === episodeNumber) || 
        (ep.id == episodeNumber) ||
        (ep.chapter_id == episodeNumber)
      ) || chapters[episodeNumber - 1] || chapters[0]
      
      if (targetChapter) {
        videoUrl = targetChapter.videoUrl || targetChapter.video_url || targetChapter.mp4 || targetChapter.url
      }
    }
    
    if (!videoUrl) {
      console.error(`No video URL found for drama ${dramaId}, episode ${episodeNumber}`)
      return null
    }
    
    console.log('Final video URL:', videoUrl)
    return videoUrl
  } catch (error) {
    console.error(`Error fetching video URL for ${dramaId}:`, error)
    return null
  }
}

export const AVAILABLE_PLATFORMS = Object.keys(PLATFORMS)
