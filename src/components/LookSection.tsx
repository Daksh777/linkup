import { useRef, type KeyboardEvent } from 'react'
import { useStore, type ButtonShape, type ButtonStyle, type HeadlineStyle, type ThemeId } from '../store'
import { Chip, Segmented } from './ui'
import { Section } from './Section'
import checkIcon from '../assets/icons/check-dark.svg'
import lockIcon from '../assets/icons/lock.svg'

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'neon-night', label: 'Neon Night' },
  { id: 'lime-lead', label: 'Lime Lead' },
  { id: 'full-bleed-lime', label: 'Full-bleed Lime' },
  { id: 'ai-blue', label: 'AI Blue' },
]

const BUTTON_STYLES: { value: ButtonStyle; label: string }[] = [
  { value: 'hard-shadow', label: 'Hard shadow' },
  { value: 'filled', label: 'Filled' },
  { value: 'outline', label: 'Outline' },
]

const BUTTON_SHAPES: { value: ButtonShape; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
]

const HEADLINES: { value: HeadlineStyle; label: string }[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'lean', label: 'Lean 8°' },
]

function ThemePicker({ compact }: { compact: boolean }) {
  const { profile, dispatch } = useStore()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const select = (theme: ThemeId) => dispatch({ type: 'look', patch: { theme } })

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + THEMES.length) % THEMES.length
    select(THEMES[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div className="look-group">
      <p className="t-label" id="theme-label">
        Theme
      </p>
      <div role="radiogroup" aria-labelledby="theme-label" className={compact ? 'theme-carousel' : 'theme-grid'}>
        {THEMES.map((theme, i) => {
          const selected = profile.look.theme === theme.id
          return (
            <button
              key={theme.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              className={`theme-card theme-card--${theme.id}${selected ? ' theme-card--selected' : ''}`}
              onClick={() => select(theme.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="theme-card__preview" aria-hidden>
                <span className="theme-card__name-row">
                  <span className="theme-card__name" />
                  <span className="theme-card__accent" />
                </span>
                <span className="theme-card__button" />
                <span className="theme-card__button" />
              </span>
              <span className="theme-card__footer">
                <span className="t-label">{theme.label}</span>
                {selected && (
                  <span className="theme-card__check">
                    <img src={checkIcon} alt="" width={14} height={14} />
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function LookSection({ compact }: { compact: boolean }) {
  const { profile, dispatch } = useStore()
  const { look } = profile

  return (
    <Section title="Look & feel" compact={compact} gap={24}>
      <ThemePicker compact={compact} />
      <div className="look-group">
        <p className="t-label">Button style</p>
        <Segmented
          label="Button style"
          options={BUTTON_STYLES}
          value={look.buttonStyle}
          onChange={(buttonStyle) => dispatch({ type: 'look', patch: { buttonStyle } })}
        />
      </div>
      <div className="look-group">
        <p className="t-label">Button shape</p>
        <Segmented
          label="Button shape"
          options={BUTTON_SHAPES}
          value={look.buttonShape}
          onChange={(buttonShape) => dispatch({ type: 'look', patch: { buttonShape } })}
        />
      </div>
      <div className="look-group">
        <p className="t-label">Headline</p>
        <Segmented
          label="Headline"
          options={HEADLINES}
          value={look.headline}
          onChange={(headline) => dispatch({ type: 'look', patch: { headline } })}
        />
      </div>
      {!compact && (
        <div className="look-group">
          <p className="t-label">Fonts</p>
          <div className="fonts-locked" title="Your brand kit allows Teko + Raleway only, so fonts can't be swapped.">
            <img src={lockIcon} alt="" width={20} height={20} />
            <div className="fonts-locked__copy">
              <p className="t-label">
                <span className="fonts-locked__teko">Teko</span> + Raleway
              </p>
              <p className="t-caption t-muted">Locked by your brand kit — no substitutes.</p>
            </div>
            <Chip>Brand</Chip>
          </div>
        </div>
      )}
    </Section>
  )
}
