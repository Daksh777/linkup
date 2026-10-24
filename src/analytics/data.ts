/**
 * Sample analytics — generated client-side from a fixed seed so the numbers are
 * stable between reloads. Swap `getAnalytics` for a real API call later; the
 * return shape is what the dashboard renders.
 */
import type { LinkItem, SocialId } from '../store'

export type RangeId = '7d' | '30d' | '90d'
export const RANGES: { value: RangeId; label: string; days: number }[] = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: '90d', label: '90 days', days: 90 },
]

export type DayPoint = { date: Date; views: number; clicks: number; visitors: number }

export type Totals = { views: number; clicks: number; visitors: number; ctr: number }

export type Share = { label: string; value: number }

export type LinkStat = { id: string; title: string; visible: boolean; clicks: number; ctr: number }

export type Analytics = {
  days: DayPoint[]
  /** The day the workshop recap went viral. */
  spikeDate: Date
  totals: Totals
  previous: Totals
  links: LinkStat[]
  sources: Share[]
  locations: Share[]
  devices: Share[]
  socials: { id: SocialId; label: string; value: number }[]
}

const HISTORY_DAYS = 180
const MS_DAY = 86_400_000

// Mulberry32 — tiny deterministic PRNG.
function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

let history: DayPoint[] | null = null

/** 180 days of daily traffic: slow growth, weekend lift, noise, and one viral spike. */
function getHistory(): DayPoint[] {
  if (history) return history
  const rand = seeded(42)
  const today = startOfToday().getTime()
  history = Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const daysAgo = HISTORY_DAYS - 1 - i
    const date = new Date(today - daysAgo * MS_DAY)
    const weekend = date.getDay() === 0 || date.getDay() === 6 ? 1.22 : 1
    const growth = 0.55 + (i / HISTORY_DAYS) * 0.6
    // The workshop recap went round WhatsApp groups 12 days ago.
    const spike = daysAgo === 12 ? 2.6 : daysAgo === 11 ? 1.7 : daysAgo === 10 ? 1.25 : 1
    const views = Math.round(260 * growth * weekend * spike * (0.85 + rand() * 0.3))
    const ctr = 0.34 + rand() * 0.08 + (spike > 1 ? 0.06 : 0)
    return {
      date,
      views,
      clicks: Math.round(views * ctr),
      visitors: Math.round(views * (0.68 + rand() * 0.08)),
    }
  })
  return history
}

function sum(days: DayPoint[]): Totals {
  const views = days.reduce((n, d) => n + d.views, 0)
  const clicks = days.reduce((n, d) => n + d.clicks, 0)
  const visitors = days.reduce((n, d) => n + d.visitors, 0)
  return { views, clicks, visitors, ctr: views ? clicks / views : 0 }
}

function split(total: number, weights: [string, number][], rand: () => number): Share[] {
  const jittered = weights.map(([label, w]) => [label, w * (0.9 + rand() * 0.2)] as const)
  const whole = jittered.reduce((n, [, w]) => n + w, 0)
  return jittered.map(([label, w]) => ({ label, value: Math.round((total * w) / whole) }))
}

// Earlier links in the list get more clicks — position matters on a link-in-bio page.
const POSITION_WEIGHTS = [0.36, 0.28, 0.21, 0.15]

const SOCIAL_LABELS: { id: SocialId; label: string; weight: number }[] = [
  { id: 'instagram', label: 'Instagram', weight: 0.38 },
  { id: 'whatsapp', label: 'WhatsApp community', weight: 0.24 },
  { id: 'linkedin', label: 'LinkedIn', weight: 0.2 },
  { id: 'youtube', label: 'YouTube', weight: 0.1 },
  { id: 'website', label: 'Website', weight: 0.08 },
]

export function getAnalytics(range: RangeId, links: LinkItem[], socials: Record<SocialId, string>): Analytics {
  const days = RANGES.find((r) => r.value === range)!.days
  const all = getHistory()
  const current = all.slice(-days)
  const previous = all.slice(-days * 2, -days)
  const totals = sum(current)
  const rand = seeded(days * 7 + links.length)

  const linkWeights = links.map((l, i) => [l.id, POSITION_WEIGHTS[i] ?? 0.1] as [string, number])
  const linkClicks = split(totals.clicks, linkWeights, rand)

  const activeSocials = SOCIAL_LABELS.filter((s) => socials[s.id]?.trim())
  const socialTotal = Math.round(totals.views * 0.07)

  return {
    days: current,
    spikeDate: all[all.length - 13].date,
    totals,
    previous: sum(previous),
    links: links.map((l, i) => ({
      id: l.id,
      title: l.title || 'Untitled link',
      visible: l.visible,
      clicks: linkClicks[i].value,
      ctr: totals.views ? linkClicks[i].value / totals.views : 0,
    })),
    sources: split(
      totals.views,
      [
        ['Instagram', 0.41],
        ['LinkedIn', 0.24],
        ['WhatsApp', 0.16],
        ['Direct', 0.11],
        ['YouTube', 0.05],
        ['Other', 0.03],
      ],
      rand,
    ),
    locations: split(
      totals.visitors,
      [
        ['Delhi NCR', 0.38],
        ['Mumbai', 0.17],
        ['Bengaluru', 0.14],
        ['Pune', 0.08],
        ['Hyderabad', 0.06],
        ['Other', 0.17],
      ],
      rand,
    ),
    devices: split(
      totals.visitors,
      [
        ['Mobile', 0.86],
        ['Desktop', 0.14],
      ],
      rand,
    ),
    socials: split(
      socialTotal,
      activeSocials.map((s) => [s.label, s.weight]),
      rand,
    ).map((share, i) => ({ id: activeSocials[i].id, ...share })),
  }
}

/* ---------- formatting ---------- */

export function compact(n: number) {
  if (n >= 10_000) return `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, '')}K`
  return n.toLocaleString('en-IN')
}

export function percent(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`
}

export function shortDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
