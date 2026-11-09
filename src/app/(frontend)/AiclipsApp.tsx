'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchPopularShows, searchShows, fetchFromMultiplePlatforms, fetchEpisodeVideoUrl, type Show as ApiShow } from '@/lib/apishort'

type IconName = 'home' | 'compass' | 'bookmark' | 'user' | 'play' | 'pause' | 'search' | 'bell' | 'plus' | 'check' | 'close' | 'volume' | 'chevron' | 'back' | 'forward'
type Show = { title: string; meta: string; image: string; tag?: string; genre: string; episodes: number; description: string; videoUrl?: string; id?: string }
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const iconPaths: Record<IconName, React.ReactNode> = {
  home: <><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></>,
  bookmark: <path d="M6 3.5h12v17l-6-3.5-6 3.5v-17Z"/>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
  play: <path d="m9 6 9 6-9 6V6Z"/>,
  pause: <><path d="M8 5v14M16 5v14"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  volume: <><path d="M5 10v4h4l5 4V6L9 10H5Z"/><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></>,
  forward: <><path d="m9 18 6-6-6-6"/><path d="M5 12h10"/></>,
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

const photos = {
  hero: 'https://images.unsplash.com/photo-1745318829873-7ab9aba9bcd5?auto=format&fit=crop&w=1600&q=88',
  couple: 'https://images.unsplash.com/photo-1633969858834-f900eb939f4e?auto=format&fit=crop&w=900&q=82',
}
const genres = ['All', 'Billionaire', 'Enemies to lovers', 'Secret identity', 'Mafia', 'Second chance', 'Fantasy']

// Add fallback for shows without images
const getShowImage = (show: Show) => show.image || photos.hero

function ShowCard({ show, rank, saved, onSave, onPlay }: { show: Show; rank?: number; saved: boolean; onSave: () => void; onPlay: () => void }) {
  const activate = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') onPlay()
  }
  return (
    <article className="show-card">
      <div className="poster-wrap" role="button" tabIndex={0} onClick={onPlay} onKeyDown={activate} aria-label={`Play ${show.title}`}>
        <img src={getShowImage(show)} alt="" className="poster" />
        <div className="poster-shade" />
        {rank && <span className="rank">{rank}</span>}
        {show.tag && <span className={`tag ${show.tag === 'AI' ? 'ai-tag' : ''}`}>{show.tag}</span>}
        <span className="card-play"><Icon name="play" size={16} /></span>
        <button className="save-card" onClick={(event) => { event.stopPropagation(); onSave() }} aria-label={`${saved ? 'Remove' : 'Add'} ${show.title} ${saved ? 'from' : 'to'} saved`}>
          <Icon name={saved ? 'check' : 'plus'} size={16} />
        </button>
      </div>
      <button className="card-title" onClick={onPlay}>{show.title}</button>
      <p>{show.meta}</p>
    </article>
  )
}

function ShowGrid({ shows, saved, toggleSave, playShow }: { shows: Show[]; saved: string[]; toggleSave: (title: string) => void; playShow: (show: Show) => void }) {
  return <div className="browse-grid">{shows.map((show, index) => <ShowCard key={show.id || `${show.title}-${index}-${Math.random()}`} show={show} saved={saved.includes(show.title)} onSave={() => toggleSave(show.title)} onPlay={() => playShow(show)} />)}</div>
}

function Rail({ title, subtitle, shows, ranked, saved, toggleSave, playShow, seeAll }: {
  title: string; subtitle?: string; shows: Show[]; ranked?: boolean; saved: string[]; toggleSave: (title: string) => void; playShow: (show: Show) => void; seeAll: () => void
}) {
  return (
    <section className="content-section">
      <div className="section-heading">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button className="see-all" onClick={seeAll}>See all <Icon name="chevron" size={16} /></button>
      </div>
      <div className="rail">
        {shows.map((show, index) => <ShowCard key={show.id || `${show.title}-${index}-${Math.random()}`} show={show} rank={ranked ? index + 1 : undefined} saved={saved.includes(show.title)} onSave={() => toggleSave(show.title)} onPlay={() => playShow(show)} />)}
      </div>
    </section>
  )
}

export default function App() {
  const [active, setActive] = useState('Home')
  const [saved, setSaved] = useState<string[]>([])
  const [bannerVisible, setBannerVisible] = useState(true)
  const [preRoll, setPreRoll] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [popUnder, setPopUnder] = useState(false)
  const [selectedShow, setSelectedShow] = useState<Show | null>(null)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [episode, setEpisode] = useState(1)
  const [isPlaying, setIsPlaying] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [profileName, setProfileName] = useState('Drama lover')
  const [email, setEmail] = useState('viewer@aiclips.app')
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [installMessage, setInstallMessage] = useState('')
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification === 'undefined' ? 'default' : Notification.permission,
  )
  const [autoplay, setAutoplay] = useState(true)
  const [dataSaver, setDataSaver] = useState(false)
  const [captions, setCaptions] = useState(false)
  const [apiShows, setApiShows] = useState<Show[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<Show[]>([])
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)

  // Fetch real data from API on mount
  useEffect(() => {
    const loadShows = async () => {
      try {
        // Fetch from ReelShort only
        const shows = await fetchPopularShows('reelshort', 1, 'en')
        if (shows.length > 0) {
          setApiShows(shows)
          setSelectedShow(shows[0])
        }
      } catch (error) {
        console.error('Failed to load shows from API, using fallback data')
      } finally {
        setIsLoading(false)
      }
    }
    loadShows()
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const registerWorker = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installation is optional; the streaming experience remains available.
      })
    }
    window.addEventListener('load', registerWorker)
    return () => window.removeEventListener('load', registerWorker)
  }, [])

  useEffect(() => {
    if (!preRoll) return
    if (countdown === 0) {
      const openPlayer = window.setTimeout(() => {
        setPreRoll(false)
        setPlayerOpen(true)
        setIsPlaying(true)
      }, 500)
      return () => window.clearTimeout(openPlayer)
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [preRoll, countdown])

  useEffect(() => {
    document.body.style.overflow = playerOpen || preRoll ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [playerOpen, preRoll])

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
  }, [])

  const startWatching = (show: Show, episodeNumber = 1) => {
    setSelectedShow(show)
    setEpisode(episodeNumber)
    setPreRoll(true)
    setCountdown(5)
    setPlayerOpen(false)
    window.setTimeout(() => setPopUnder(true), 700)
  }

  const finishAd = () => {
    setPreRoll(false)
    setPlayerOpen(true)
    setIsPlaying(true)
  }

  const toggleSave = (title: string) => {
    setSaved((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title])
  }

  const openBrowse = (genre = 'All') => {
    setSelectedGenre(genre)
    setActive('Discover')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const installAndroid = async () => {
    if (!installPrompt) {
      setInstallMessage('If aiclips is not already installed, open your browser menu and choose “Install app” or “Add to Home screen”.')
      return
    }
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallMessage(choice.outcome === 'accepted' ? 'aiclips is being added to your home screen.' : 'Installation was cancelled. You can try again anytime.')
    setInstallPrompt(null)
  }

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      setInstallMessage('Notifications are not supported by this browser.')
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification('Notifications are on', {
        body: 'We’ll let you know when new aiclips episodes arrive.',
        icon: '/app-icon.svg',
        badge: '/app-icon.svg',
        tag: 'aiclips-welcome',
      })
    }
  }

  const sendTestNotification = async () => {
    if (notificationPermission !== 'granted') return enableNotifications()
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification('A new episode just dropped', {
      body: 'Stolen Heartbeats · Episode 2 is ready to watch.',
      icon: '/app-icon.svg',
      badge: '/app-icon.svg',
      tag: 'aiclips-test',
    })
  }

  // Search using API when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const performSearch = async () => {
        try {
          const results = await searchShows('reelshort', searchQuery, 1, 'en')
          setSearchResults(results)
        } catch (error) {
          console.error('Search failed, using local filter')
          setSearchResults([])
        }
      }
      performSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // Fetch video URL when playing
  useEffect(() => {
    if (!playerOpen || !selectedShow?.id) {
      setCurrentVideoUrl(null)
      return
    }

    const fetchVideo = async () => {
      try {
        const url = await fetchEpisodeVideoUrl(
          selectedShow.platform || 'reelshort',
          selectedShow.id,
          episode,
          'en'
        )
        setCurrentVideoUrl(url)
      } catch (error) {
        console.error('Failed to fetch video URL:', error)
        setCurrentVideoUrl(null)
      }
    }

    fetchVideo()
  }, [playerOpen, selectedShow?.id, episode])

  const filteredShows = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (query.length >= 2 && searchResults.length > 0) {
      return searchResults
    }
    return apiShows.filter((show) => (!query || `${show.title} ${show.genre} ${show.description}`.toLowerCase().includes(query)) && (selectedGenre === 'All' || show.genre === selectedGenre))
  }, [searchQuery, selectedGenre, apiShows, searchResults])

  const nav = [
    { label: 'Home', icon: 'home' as IconName },
    { label: 'Discover', icon: 'compass' as IconName },
    { label: 'Saved', icon: 'bookmark' as IconName },
    { label: 'Profile', icon: 'user' as IconName },
  ]

  const renderPage = () => {
    if (isLoading) {
      return <section className="library-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <p>Loading dramas...</p>
      </section>
    }

    if (apiShows.length === 0) {
      return <section className="library-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div className="empty-state"><span><Icon name="compass" size={28} /></span><h2>No dramas available</h2><p>Unable to load content from the API.</p></div>
      </section>
    }

    if (active === 'Search') {
      return <section className="library-view">
        <span className="eyebrow">Search aiclips</span><h1>Find your next obsession</h1>
        <div className="search-field"><Icon name="search" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search titles, genres, stories..." /><button onClick={() => setSearchQuery('')} aria-label="Clear search"><Icon name="close" size={17} /></button></div>
        <p className="result-count">{searchQuery ? `${filteredShows.length} results for “${searchQuery}”` : 'Popular right now'}</p>
        <ShowGrid shows={filteredShows} saved={saved} toggleSave={toggleSave} playShow={startWatching} />
      </section>
    }

    if (active === 'Discover') {
      return <section className="library-view">
        <span className="eyebrow">Browse all</span><h1>Discover dramas</h1><p>Fresh stories. New twists. One more episode.</p>
        <div className="genres browse-genres">{genres.map((genre) => <button key={genre} onClick={() => setSelectedGenre(genre)} className={selectedGenre === genre ? 'selected' : ''}>{genre}</button>)}</div>
        <p className="result-count">{selectedGenre === 'All' ? 'All dramas' : selectedGenre} · {filteredShows.length} titles</p>
        <ShowGrid shows={filteredShows} saved={saved} toggleSave={toggleSave} playShow={startWatching} />
      </section>
    }

    if (active === 'Saved') {
      const savedShows = apiShows.filter((show) => saved.includes(show.title))
      return <section className="library-view">
        <span className="eyebrow">Your collection</span><h1>Saved for later</h1><p>Your favorite cliffhangers, all in one place.</p>
        {savedShows.length ? <ShowGrid shows={savedShows} saved={saved} toggleSave={toggleSave} playShow={startWatching} /> : <div className="empty-state"><span><Icon name="bookmark" size={28} /></span><h2>No saved dramas yet</h2><p>Tap the + on any show to build your watchlist.</p><button onClick={() => openBrowse()}>Explore dramas</button></div>}
      </section>
    }

    if (active === 'Profile') {
      return <section className="library-view profile-view">
        <span className="eyebrow">Your aiclips</span><h1>Profile</h1>
        <div className="profile-card"><div className="profile-avatar">{profileName.charAt(0).toUpperCase()}</div><div><h2>{profileName}</h2><p>Free member · Watching since 2026</p></div><button onClick={() => setActive('Edit profile')}>Edit profile</button></div>
        <div className="profile-stats"><div><strong>{saved.length}</strong><span>Saved</span></div><div><strong>3</strong><span>Watched</span></div><div><strong>7</strong><span>Day streak</span></div></div>
        <div className="profile-menu">
          {['Continue watching', 'Watch history', 'Notifications', 'Playback settings', 'Help & support'].map((item) => <button key={item} onClick={() => setActive(item)}><span>{item}</span><Icon name="chevron" size={18} /></button>)}
        </div>
        <div className="install-card">
          <div><span className="eyebrow">Watch like an app</span><h2>Install aiclips</h2><p>Add aiclips to your home screen for faster, full-screen viewing.</p></div>
          <div className="install-actions"><button onClick={installAndroid}>Install on Android</button><button onClick={() => setShowIosHelp(true)}>Install on iPhone</button></div>
          {installMessage && <p className="status-message">{installMessage}</p>}
        </div>
      </section>
    }

    if (active === 'Continue watching') {
      return <SettingsPage title="Continue watching" eyebrow="Jump back in" onBack={() => setActive('Profile')}>
        <p className="settings-lead">Pick up exactly where you left off.</p>
        <div className="continue-list">{apiShows.slice(0, 3).map((show, index) => <button key={show.id || `${show.title}-${index}-${Math.random()}`} onClick={() => startWatching(show, index + 2)}><img src={getShowImage(show)} alt="" /><span><strong>{show.title}</strong><small>Episode {index + 2} · {35 + index * 18}% watched</small><i><b style={{ width: `${35 + index * 18}%` }} /></i></span><Icon name="play" /></button>)}</div>
      </SettingsPage>
    }

    if (active === 'Watch history') {
      return <SettingsPage title="Watch history" eyebrow="Recently watched" onBack={() => setActive('Profile')}>
        <p className="settings-lead">Your recently played dramas.</p>
        <ShowGrid shows={apiShows.slice(0, 6)} saved={saved} toggleSave={toggleSave} playShow={startWatching} />
      </SettingsPage>
    }

    if (active === 'Notifications') {
      return <SettingsPage title="Notifications" eyebrow="Never miss a twist" onBack={() => setActive('Profile')}>
        <p className="settings-lead">Get alerts when new episodes and AI originals arrive.</p>
        <div className="setting-card"><div><strong>Push notifications</strong><span>{notificationPermission === 'granted' ? 'Enabled on this device' : notificationPermission === 'denied' ? 'Blocked in browser settings' : 'Not enabled yet'}</span></div><button className={notificationPermission === 'granted' ? 'enabled' : ''} onClick={enableNotifications}>{notificationPermission === 'granted' ? 'Enabled' : 'Enable'}</button></div>
        <div className="setting-card"><div><strong>New episode alerts</strong><span>Updates for shows in My List</span></div><Toggle checked={notificationPermission === 'granted'} onChange={enableNotifications} /></div>
        <div className="setting-card"><div><strong>Test notification</strong><span>Make sure notifications display correctly</span></div><button onClick={sendTestNotification}>Send test</button></div>
        {notificationPermission === 'denied' && <p className="settings-note">Notifications are blocked. Open your browser’s site settings for aiclips and change Notifications to Allow.</p>}
      </SettingsPage>
    }

    if (active === 'Playback settings') {
      return <SettingsPage title="Playback settings" eyebrow="Make it yours" onBack={() => setActive('Profile')}>
        <div className="setting-card"><div><strong>Autoplay next episode</strong><span>Keep the story moving automatically</span></div><Toggle checked={autoplay} onChange={() => setAutoplay(!autoplay)} /></div>
        <div className="setting-card"><div><strong>Data saver</strong><span>Use lower video quality on mobile data</span></div><Toggle checked={dataSaver} onChange={() => setDataSaver(!dataSaver)} /></div>
        <div className="setting-card"><div><strong>Always show captions</strong><span>Turn captions on when available</span></div><Toggle checked={captions} onChange={() => setCaptions(!captions)} /></div>
        <div className="setting-card"><div><strong>Video quality</strong><span>Automatic · Best for your connection</span></div><button>Auto</button></div>
      </SettingsPage>
    }

    if (active === 'Help & support') {
      return <SettingsPage title="Help & support" eyebrow="We’re here for you" onBack={() => setActive('Profile')}>
        <div className="faq-list">
          <details><summary>How do free episodes work?<Icon name="plus" /></summary><p>Free episodes are supported by short ads. After the ad, your episode opens automatically.</p></details>
          <details><summary>How do I install aiclips?<Icon name="plus" /></summary><p>On Android, choose Install app. On iPhone, open Safari, tap Share, then Add to Home Screen.</p></details>
          <details><summary>Why can’t I receive notifications?<Icon name="plus" /></summary><p>Check that notifications are allowed in your browser’s site settings and that aiclips is installed on your device.</p></details>
        </div>
        <a className="support-button" href="mailto:help@aiclips.app">Email help@aiclips.app</a>
      </SettingsPage>
    }

    if (active === 'Edit profile') {
      return <SettingsPage title="Edit profile" eyebrow="Your details" onBack={() => setActive('Profile')}>
        <form className="edit-form" onSubmit={(event) => { event.preventDefault(); setActive('Profile') }}>
          <label>Display name<input value={profileName} onChange={(event) => setProfileName(event.target.value)} required /></label>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Favorite genre<select defaultValue="Romance"><option>Romance</option><option>Drama</option><option>Fantasy</option><option>Mafia</option></select></label>
          <button type="submit">Save changes</button>
        </form>
      </SettingsPage>
    }

    return <>
      {selectedShow && <section className="hero">
        <img src={getShowImage(selectedShow)} alt="Featured drama" className="hero-image" /><div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badges"><span>#1 Today</span><span>{selectedShow.tag || 'Trending'}</span></div><p className="hero-kicker">AICLIPS ORIGINAL</p>
          <h1>{selectedShow.title.split(' ').map((word, i, arr) => i === arr.length - 1 ? <em key={i}>{word}</em> : <span key={i}>{word} </span>)}</h1><div className="hero-meta"><span>2026</span><span>{selectedShow.episodes} Episodes</span><span>{selectedShow.genre}</span><span>Drama</span></div>
          <p className="synopsis">{selectedShow.description}</p>
          <div className="hero-actions">
            <button className="watch-button" onClick={() => startWatching(selectedShow)}><Icon name="play" size={18} /> Watch free</button>
            <button className="add-button" onClick={() => toggleSave(selectedShow.title)}><Icon name={saved.includes(selectedShow.title) ? 'check' : 'plus'} size={20} />{saved.includes(selectedShow.title) ? 'Saved' : 'My list'}</button>
          </div>
        </div>
        <div className="hero-pagination"><span className="active" /><span /><span /><span /></div>
      </section>}
      <div className="content">
        <Rail title="Trending now" shows={apiShows.slice(0, 6)} ranked saved={saved} toggleSave={toggleSave} playShow={startWatching} seeAll={() => openBrowse()} />
        {bannerVisible && <aside className="native-ad" aria-label="Sponsored content">
          <div className="native-image"><img src={photos.couple} alt="" /><span>Sponsored</span></div>
          <div className="native-copy"><span className="eyebrow">Featured premiere</span><h2>Love was never part of the deal.</h2><p>Start <strong>Dangerous Terms</strong> free. A new episode drops every night.</p><button onClick={() => startWatching(apiShows[1])}>Watch episode 1 <Icon name="chevron" size={16} /></button></div>
          <button className="dismiss-ad" onClick={() => setBannerVisible(false)} aria-label="Dismiss sponsored content"><Icon name="close" size={16} /></button>
        </aside>}
        <Rail title="Made with AI. Felt by you." subtitle="Original stories, imagined differently." shows={apiShows.slice(6, 12)} saved={saved} toggleSave={toggleSave} playShow={startWatching} seeAll={() => openBrowse()} />
        <section className="genre-section"><div className="section-heading"><div><h2>Find your obsession</h2><p>What are you in the mood for?</p></div></div>
          <div className="genres">{genres.slice(1).map((genre) => <button key={genre} onClick={() => openBrowse(genre)}>{genre}</button>)}</div>
        </section>
      </div>
    </>
  }

  return (
    <div className="app-shell">
      <header className={`topbar ${active !== 'Home' ? 'solid' : ''}`}>
        <button className="brand" onClick={() => { setActive('Home'); window.scrollTo(0, 0) }} aria-label="aiclips home"><span className="brand-mark"><Icon name="play" size={15} /></span><span>ai<span>clips</span></span></button>
        <nav className="desktop-nav" aria-label="Primary navigation">{nav.slice(0, 3).map((item) => <button key={item.label} onClick={() => setActive(item.label)} className={active === item.label ? 'active' : ''}>{item.label}</button>)}</nav>
        <div className="top-actions">
          <button className="icon-button" onClick={() => { setSearchQuery(''); setSelectedGenre('All'); setActive('Search') }} aria-label="Search"><Icon name="search" /></button>
          <button className="icon-button notification" onClick={() => setActive('Notifications')} aria-label="Notifications"><Icon name="bell" /><span /></button>
          <button className="avatar" onClick={() => setActive('Profile')} aria-label="Open profile">A</button>
        </div>
      </header>

      <main>{renderPage()}</main>
      <footer><div className="footer-brand"><span className="brand-mark"><Icon name="play" size={13} /></span><strong>ai<span>clips</span></strong></div><p>Big feelings. Tiny episodes.</p><span>© 2026 aiclips</span></footer>
      <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map((item) => <button key={item.label} onClick={() => setActive(item.label)} className={active === item.label ? 'active' : ''}><Icon name={item.icon} size={21} /><span>{item.label}</span></button>)}</nav>

      {preRoll && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Pre-roll advertisement"><div className="preroll">
        <img src={photos.couple} alt="" /><div className="preroll-shade" /><div className="ad-label">AD · PRE-ROLL</div><button className="sound-button" aria-label="Toggle sound"><Icon name="volume" size={18} /></button>
        <div className="preroll-copy"><span className="eyebrow">An aiclips premiere</span><h2>One lie. Two hearts.</h2><p>{selectedShow.title} starts after this short message.</p><button disabled={countdown > 0} onClick={finishAd}>{countdown > 0 ? `Episode starts in ${countdown}s` : 'Continue to episode'}</button></div>
        <div className="ad-progress"><span style={{ transform: `scaleX(${(5 - countdown) / 5})` }} /></div>
      </div></div>}

      {playerOpen && <section className="video-player" aria-label={`${selectedShow.title} video player`}>
        <img className="video-backdrop" src={getShowImage(selectedShow)} alt="" /><div className="video-shade" />
        <header className="player-header"><button onClick={() => setPlayerOpen(false)}><Icon name="back" /> Back</button><div><strong>{selectedShow.title}</strong><span>Episode {episode} of {selectedShow.episodes}</span></div><button onClick={() => toggleSave(selectedShow.title)} aria-label="Save show"><Icon name={saved.includes(selectedShow.title) ? 'check' : 'plus'} /></button></header>
        {currentVideoUrl ? (
          <video
            className="main-video"
            src={currentVideoUrl}
            controls
            autoPlay={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="no-video">
            <p>{selectedShow.id ? 'Loading video...' : 'Video not available for this show'}</p>
            {!selectedShow.id && <button onClick={() => setPlayerOpen(false)}>Close</button>}
          </div>
        )}
        <div className="player-story"><span>EPISODE {episode}</span><h2>{episode === 1 ? 'The impossible match' : `The story continues`}</h2><p>{selectedShow.description}</p></div>
        <div className="player-controls">
          <div className="control-row"><button disabled={episode === 1} onClick={() => { setEpisode((value) => Math.max(1, value - 1)); setIsPlaying(true) }}><Icon name="back" /> Previous</button><button disabled={episode === selectedShow.episodes} onClick={() => { setEpisode((value) => Math.min(selectedShow.episodes, value + 1)); setIsPlaying(true) }}>Next episode <Icon name="forward" /></button></div>
          <div className="episode-strip">{Array.from({ length: Math.min(selectedShow.episodes, 12) }, (_, index) => index + 1).map((number) => <button key={number} className={episode === number ? 'active' : ''} onClick={() => { setEpisode(number); setIsPlaying(true) }}><span>{number === 1 ? 'Pilot' : `EP ${number}`}</span>{number}</button>)}</div>
        </div>
      </section>}

      {popUnder && <aside className="pop-under" aria-label="Sponsor offer"><button onClick={() => setPopUnder(false)} aria-label="Close sponsor offer"><Icon name="close" size={14} /></button><span>Sponsored</span><strong>Unlimited cliffhangers.</strong><p>Try aiclips+ for 7 days free.</p><a href="#plus" onClick={() => setPopUnder(false)}>View offer</a></aside>}
      {showIosHelp && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Install on iPhone"><div className="install-modal"><button className="modal-close" onClick={() => setShowIosHelp(false)} aria-label="Close"><Icon name="close" /></button><span className="brand-mark"><Icon name="play" size={15} /></span><h2>Install on iPhone</h2><ol><li>Open aiclips in <strong>Safari</strong>.</li><li>Tap the <strong>Share</strong> button at the bottom.</li><li>Scroll and choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong> to finish.</li></ol><button className="modal-done" onClick={() => setShowIosHelp(false)}>Got it</button></div></div>}
    </div>
  )
}

function SettingsPage({ title, eyebrow, onBack, children }: { title: string; eyebrow: string; onBack: () => void; children: React.ReactNode }) {
  return <section className="library-view settings-view"><button className="settings-back" onClick={onBack}><Icon name="back" /> Profile</button><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{children}</section>
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void | Promise<void> }) {
  return <button className={`toggle ${checked ? 'on' : ''}`} onClick={onChange} role="switch" aria-checked={checked}><span /></button>
}
