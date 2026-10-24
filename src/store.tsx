import defaultAvatar from './assets/img/avatar.jpg'
import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'

export type ThemeId = 'neon-night' | 'lime-lead' | 'full-bleed-lime' | 'ai-blue'
export type ButtonStyle = 'hard-shadow' | 'filled' | 'outline'
export type ButtonShape = 'square' | 'rounded' | 'pill'
export type HeadlineStyle = 'straight' | 'lean'
export type SocialId = 'instagram' | 'linkedin' | 'youtube' | 'whatsapp' | 'website'

export type LinkItem = {
  id: string
  title: string
  url: string
  visible: boolean
}

export type Profile = {
  photo: string | null
  name: string
  tagline: string
  bio: string
  location: string
  pillars: string[]
  links: LinkItem[]
  socials: Record<SocialId, string>
  look: {
    theme: ThemeId
    buttonStyle: ButtonStyle
    buttonShape: ButtonShape
    headline: HeadlineStyle
  }
}

export const LIMITS = { name: 30, tagline: 40, bio: 80, linkTitle: 40, links: 4 }

export const PAGE_URL = 'linkup.to/chetnagrover'

export const initialProfile: Profile = {
  photo: defaultAvatar,
  name: 'Your Name',
  tagline: 'The डिज़AIन Square',
  bio: 'Design. AI. Gupshup. Building small squares for real connections.',
  location: 'Delhi NCR',
  pillars: ['Design', 'AI', 'Gupshup'],
  links: [
    { id: 'l1', title: 'Join the next Square', url: 'forms.gle/thedesignsquare-next', visible: true },
    { id: 'l2', title: 'AI हैंड्स-ऑन वर्कशॉप recap', url: 'linkedin.com/posts/thedesignsquare', visible: true },
    { id: 'l3', title: 'Read the founder story', url: 'linkedin.com/in/chetnagrover', visible: true },
    { id: 'l4', title: 'Partner with us', url: 'thedesignsquare.in/partner', visible: true },
  ],
  socials: {
    instagram: '@thedesignsquare.in',
    linkedin: 'linkedin.com/in/yourname',
    youtube: '@thedesignsquare',
    whatsapp: 'chat.whatsapp.com/the-square',
    website: 'thedesignsquare.in',
  },
  look: {
    theme: 'neon-night',
    buttonStyle: 'hard-shadow',
    buttonShape: 'square',
    headline: 'straight',
  },
}

type Action =
  | { type: 'set'; field: 'photo' | 'name' | 'tagline' | 'bio'; value: string | null }
  | { type: 'social'; id: SocialId; value: string }
  | { type: 'look'; patch: Partial<Profile['look']> }
  | { type: 'link'; id: string; patch: Partial<LinkItem> }
  | { type: 'addLink' }
  | { type: 'duplicateLink'; id: string }
  | { type: 'removeLink'; id: string }
  | { type: 'restoreLink'; link: LinkItem; index: number }
  | { type: 'moveLink'; from: number; to: number }

function reducer(state: Profile, action: Action): Profile {
  switch (action.type) {
    case 'set':
      return { ...state, [action.field]: action.value }
    case 'social':
      return { ...state, socials: { ...state.socials, [action.id]: action.value } }
    case 'look':
      return { ...state, look: { ...state.look, ...action.patch } }
    case 'link':
      return { ...state, links: state.links.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)) }
    case 'addLink':
      if (state.links.length >= LIMITS.links) return state
      return { ...state, links: [...state.links, { id: newId(), title: 'New link', url: '', visible: true }] }
    case 'duplicateLink': {
      if (state.links.length >= LIMITS.links) return state
      const index = state.links.findIndex((l) => l.id === action.id)
      const copy = { ...state.links[index], id: newId() }
      return { ...state, links: insert(state.links, index + 1, copy) }
    }
    case 'removeLink':
      return { ...state, links: state.links.filter((l) => l.id !== action.id) }
    case 'restoreLink':
      return { ...state, links: insert(state.links, action.index, action.link) }
    case 'moveLink': {
      const links = [...state.links]
      const [moved] = links.splice(action.from, 1)
      links.splice(action.to, 0, moved)
      return { ...state, links }
    }
  }
}

function insert<T>(list: T[], index: number, item: T): T[] {
  return [...list.slice(0, index), item, ...list.slice(index)]
}

function newId() {
  return Math.random().toString(36).slice(2, 9)
}

export function hasProtocol(url: string) {
  return /^https?:\/\//i.test(url.trim())
}

export function toHref(url: string) {
  return hasProtocol(url) ? url.trim() : `https://${url.trim()}`
}

const STORAGE_KEY = 'linkup:profile'
const AUTOSAVE_DELAY = 600

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved: Profile = { ...initialProfile, ...JSON.parse(raw) }
      // Bundled asset URLs change between builds; only uploaded photos (data URLs) are kept.
      if (saved.photo && !saved.photo.startsWith('data:')) saved.photo = defaultAvatar
      return saved
    }
  } catch {
    // Storage unavailable — fall back to the defaults.
  }
  return initialProfile
}

export type SaveStatus = 'saved' | 'saving'

type Store = {
  profile: Profile
  dispatch: (action: Action) => void
  saveStatus: SaveStatus
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, dispatch] = useReducer(reducer, undefined, loadProfile)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const lastSaved = useRef(profile)

  // Autosave 600ms after the last edit, then the Topbar shows "All changes saved".
  useEffect(() => {
    if (lastSaved.current === profile) return
    setSaveStatus('saving')
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
        lastSaved.current = profile
      } catch {
        // Quota exceeded (e.g. a large photo) — keep editing in memory.
      }
      setSaveStatus('saved')
    }, AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
  }, [profile])

  return <StoreContext.Provider value={{ profile, dispatch, saveStatus }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}
