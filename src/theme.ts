import type { CSSProperties } from 'react'
import type { ButtonShape, ButtonStyle, HeadlineStyle, Look, ThemeId } from './store'

export type BackgroundType = 'solid' | 'gradient' | 'image'

/** Every value a Public Profile reads from its theme. Presets fill all of them; users override any subset. */
export type ThemeTokens = {
  bgType: BackgroundType
  canvas: string
  gradientTo: string
  gradientAngle: number
  bgImage: string | null
  /** Canvas-coloured tint over a background image, 0–90%. */
  bgTint: number
  glowPrimary: string
  glowSecondary: string
  /** 0–200%, multiplies the Figma glow opacities. */
  glowStrength: number

  text: string
  muted: string
  accent: string
  kicker: string
  border: string
  button: string
  onButton: string
  buttonShadow: string
  sticker: string
  onSticker: string
  avatarFrame: string
  avatarShadow: string

  buttonRadius: number
  iconRadius: number
  chipRadius: number
  stickerRadius: number
  avatarRadius: number
  buttonHeight: number

  shadowOffset: number
  borderWidth: number
  avatarTilt: number
}

export type ThemeCustom = Partial<ThemeTokens>
export type ColorToken = Exclude<{ [K in keyof ThemeTokens]: ThemeTokens[K] extends string ? K : never }[keyof ThemeTokens], 'bgType'>
export type NumberToken = { [K in keyof ThemeTokens]: ThemeTokens[K] extends number ? K : never }[keyof ThemeTokens]

/** Radius values at or above this render fully round, whatever the element's size. */
export const FULL_RADIUS = 999

/** Neon Night — the Figma default. */
const NEON_NIGHT: ThemeTokens = {
  bgType: 'solid',
  canvas: '#0a0a0a',
  gradientTo: '#2b0a24',
  gradientAngle: 160,
  bgImage: null,
  bgTint: 40,
  glowPrimary: '#ff1cba',
  glowSecondary: '#e1f000',
  glowStrength: 100,

  text: '#ffffff',
  muted: '#b8b8b8',
  accent: '#ff1cba',
  kicker: '#e1f000',
  border: '#ffffff',
  button: '#ff1cba',
  onButton: '#ffffff',
  buttonShadow: '#e1f000',
  sticker: '#e1f000',
  onSticker: '#0a0a0a',
  avatarFrame: '#ff1cba',
  avatarShadow: '#e1f000',

  buttonRadius: 0,
  iconRadius: 0,
  chipRadius: FULL_RADIUS,
  stickerRadius: 12,
  avatarRadius: 0,
  buttonHeight: 56,

  shadowOffset: 6,
  borderWidth: 1.5,
  avatarTilt: -4,
}

export const PRESETS: { id: ThemeId; label: string; tokens: ThemeTokens }[] = [
  { id: 'neon-night', label: 'Neon Night', tokens: NEON_NIGHT },
  {
    id: 'lime-lead',
    label: 'Lime Lead',
    tokens: { ...NEON_NIGHT, gradientTo: '#1c2000', accent: '#e1f000', button: '#e1f000', buttonShadow: '#ff1cba', onButton: '#0a0a0a' },
  },
  {
    id: 'full-bleed-lime',
    label: 'Full-bleed Lime',
    tokens: {
      ...NEON_NIGHT,
      canvas: '#e1f000',
      gradientTo: '#ff1cba',
      text: '#0a0a0a',
      // rgba(10, 10, 10, 0.72) flattened onto the lime canvas.
      muted: '#464a07',
      accent: '#0a0a0a',
      kicker: '#0a0a0a',
      border: '#0a0a0a',
      button: '#0a0a0a',
      onButton: '#ffffff',
      buttonShadow: '#ff1cba',
      sticker: '#ff1cba',
      avatarShadow: '#0a0a0a',
    },
  },
  {
    id: 'ai-blue',
    label: 'AI Blue',
    tokens: { ...NEON_NIGHT, gradientTo: '#0d1066', accent: '#e1f000', button: '#545eff', buttonShadow: '#e1f000' },
  },
]

export const SHAPE_RADIUS: Record<ButtonShape, number> = { square: 0, rounded: 12, pill: FULL_RADIUS }

export function presetTokens(theme: ThemeId): ThemeTokens {
  return (PRESETS.find((p) => p.id === theme) ?? PRESETS[0]).tokens
}

/** The tokens a look renders with, before user overrides. */
export function baseTokens(look: Pick<Look, 'theme' | 'buttonShape'>): ThemeTokens {
  return { ...presetTokens(look.theme), buttonRadius: SHAPE_RADIUS[look.buttonShape] }
}

export function resolveTheme(look: Pick<Look, 'theme' | 'buttonShape' | 'custom'>): ThemeTokens {
  return { ...baseTokens(look), ...look.custom }
}

export function background(t: ThemeTokens) {
  if (t.bgType === 'gradient') return `linear-gradient(${t.gradientAngle}deg, ${t.canvas}, ${t.gradientTo})`
  if (t.bgType === 'image' && t.bgImage) {
    const tint = `color-mix(in srgb, ${t.canvas} ${t.bgTint}%, transparent)`
    return `linear-gradient(${tint}, ${tint}), url("${t.bgImage}") center / cover no-repeat, ${t.canvas}`
  }
  return t.canvas
}

/** The colour at the bottom edge of the page, for fades that blend into it. */
export function bottomColor(t: ThemeTokens) {
  return t.bgType === 'gradient' ? t.gradientTo : t.canvas
}

export function themeStyle(t: ThemeTokens): CSSProperties {
  const px = (n: number) => `${n}px`
  return {
    '--pp-bg': background(t),
    '--pp-canvas': t.canvas,
    '--pp-text': t.text,
    '--pp-accent': t.accent,
    '--pp-muted': t.muted,
    '--pp-kicker': t.kicker,
    '--pp-border': t.border,
    '--pp-button': t.button,
    '--pp-button-shadow': t.buttonShadow,
    '--pp-on-button': t.onButton,
    '--pp-sticker': t.sticker,
    '--pp-on-sticker': t.onSticker,
    '--pp-avatar-frame': t.avatarFrame,
    '--pp-avatar-shadow': t.avatarShadow,
    '--pp-glow-primary': t.glowPrimary,
    '--pp-glow-secondary': t.glowSecondary,
    '--pp-glow-strength': t.glowStrength / 100,
    '--pp-button-radius': px(t.buttonRadius),
    '--pp-icon-radius': px(t.iconRadius),
    '--pp-chip-radius': px(t.chipRadius),
    '--pp-sticker-radius': px(t.stickerRadius),
    '--pp-avatar-radius': px(t.avatarRadius),
    '--pp-button-height': px(t.buttonHeight),
    '--pp-shadow-offset': px(t.shadowOffset),
    '--pp-border-width': px(t.borderWidth),
    '--pp-avatar-tilt': `${t.avatarTilt}deg`,
  } as CSSProperties
}

/* ---------- Theme codes (copy / paste between pages) ---------- */

const HEX = /^#[0-9a-f]{6}$/i

/** Allowed range for every numeric token; imported values are clamped into it. */
export const NUMBER_RANGES: Record<NumberToken, [number, number]> = {
  gradientAngle: [0, 360],
  bgTint: [0, 90],
  glowStrength: [0, 200],
  buttonRadius: [0, FULL_RADIUS],
  iconRadius: [0, FULL_RADIUS],
  chipRadius: [0, FULL_RADIUS],
  stickerRadius: [0, FULL_RADIUS],
  avatarRadius: [0, FULL_RADIUS],
  buttonHeight: [44, 72],
  shadowOffset: [0, 16],
  borderWidth: [0, 4],
  avatarTilt: [-12, 12],
}

const THEME_IDS = PRESETS.map((p) => p.id)
const BUTTON_STYLES: ButtonStyle[] = ['hard-shadow', 'filled', 'outline']
const BUTTON_SHAPES: ButtonShape[] = ['square', 'rounded', 'pill']
const HEADLINES: HeadlineStyle[] = ['straight', 'lean']
const BG_TYPES: BackgroundType[] = ['solid', 'gradient', 'image']

type ShareableLook = Omit<Look, 'savedId'>

/** Background images stay out of codes — they'd make them megabytes long. */
export function encodeTheme(look: Look): string {
  const { bgImage: _bgImage, ...custom } = look.custom
  const code: ShareableLook = { theme: look.theme, buttonStyle: look.buttonStyle, buttonShape: look.buttonShape, headline: look.headline, custom }
  return JSON.stringify({ linkup: 1, look: code })
}

/** Parses untrusted theme code; anything unrecognised is dropped rather than rejected. */
export function decodeTheme(code: string): ShareableLook | null {
  let input: unknown
  try {
    input = JSON.parse(code.trim())
  } catch {
    return null
  }
  const look = (input as { look?: Record<string, unknown> } | null)?.look
  if (!look || typeof look !== 'object') return null

  const pick = <T extends string>(value: unknown, allowed: T[], fallback: T) => (allowed.includes(value as T) ? (value as T) : fallback)
  const rawCustom = (look.custom && typeof look.custom === 'object' ? look.custom : {}) as Record<string, unknown>
  const custom: Record<string, unknown> = {}

  for (const key of Object.keys(NEON_NIGHT) as (keyof ThemeTokens)[]) {
    const value = rawCustom[key]
    if (value === undefined || key === 'bgImage') continue
    if (key === 'bgType') {
      if (BG_TYPES.includes(value as BackgroundType)) custom.bgType = value
    } else if (key in NUMBER_RANGES) {
      const [min, max] = NUMBER_RANGES[key as NumberToken]
      if (typeof value === 'number' && Number.isFinite(value)) custom[key] = Math.min(max, Math.max(min, value))
    } else if (typeof value === 'string' && HEX.test(value)) {
      custom[key] = value.toLowerCase()
    }
  }

  return {
    theme: pick(look.theme, THEME_IDS, 'neon-night'),
    buttonStyle: pick(look.buttonStyle, BUTTON_STYLES, 'hard-shadow'),
    buttonShape: pick(look.buttonShape, BUTTON_SHAPES, 'square'),
    headline: pick(look.headline, HEADLINES, 'straight'),
    custom: custom as ThemeCustom,
  }
}

export function isHex(value: string) {
  return HEX.test(value)
}
