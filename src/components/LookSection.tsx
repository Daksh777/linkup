import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useStore, type ButtonShape, type ButtonStyle, type HeadlineStyle, type Look, type ThemeId } from '../store'
import { background, PRESETS, resolveTheme } from '../theme'
import { Chip, Segmented } from './ui'
import { Section } from './Section'
import { ThemeEditor } from './ThemeEditor'
import { useToast } from './Toast'
import checkIcon from '../assets/icons/check-dark.svg'
import lockIcon from '../assets/icons/lock.svg'

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

type ThemeOption = { key: string; label: string; look: Omit<Look, 'savedId'>; selected: boolean; onSelect: () => void }

/** Mini page swatch drawn from the same tokens as the real profile. */
function swatchStyle(look: ThemeOption['look']): CSSProperties {
  const t = resolveTheme(look)
  return {
    '--tc-canvas': background(t),
    '--tc-text': t.text,
    '--tc-accent': t.accent,
    '--tc-button': look.buttonStyle === 'outline' ? 'transparent' : t.button,
    '--tc-outline': look.buttonStyle === 'outline' ? t.button : 'transparent',
    '--tc-shadow': look.buttonStyle === 'hard-shadow' ? t.buttonShadow : 'transparent',
    '--tc-radius': `${Math.min(t.buttonRadius, 7)}px`,
  } as CSSProperties
}

function ThemePicker({ compact }: { compact: boolean }) {
  const { profile, dispatch } = useStore()
  const toast = useToast()
  const { look } = profile
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const selectPreset = (theme: ThemeId) => {
    const prev = look
    dispatch({ type: 'look', patch: { theme, custom: {}, savedId: null } })
    if (Object.keys(prev.custom).length && !prev.savedId) {
      toast({ message: 'Custom edits cleared', action: { label: 'Undo', onClick: () => dispatch({ type: 'look', patch: prev }) } })
    }
  }

  const options: ThemeOption[] = [
    ...PRESETS.map((preset) => ({
      key: preset.id,
      label: preset.label,
      look: { ...look, theme: preset.id, custom: {} },
      selected: !look.savedId && look.theme === preset.id,
      onSelect: () => selectPreset(preset.id),
    })),
    ...profile.savedThemes.map((saved) => ({
      key: saved.id,
      label: saved.name,
      look: saved.look,
      selected: look.savedId === saved.id,
      onSelect: () => dispatch({ type: 'applyTheme', id: saved.id }),
    })),
  ]

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + options.length) % options.length
    options[next].onSelect()
    refs.current[next]?.focus()
  }

  const hasSelection = options.some((o) => o.selected)

  return (
    <div className="look-group">
      <p className="t-label" id="theme-label">
        Theme
      </p>
      <div role="radiogroup" aria-labelledby="theme-label" className={compact ? 'theme-carousel' : 'theme-grid'}>
        {options.map((option, i) => (
          <button
            key={option.key}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={option.selected}
            tabIndex={option.selected || (!hasSelection && i === 0) ? 0 : -1}
            className={`theme-card${option.selected ? ' theme-card--selected' : ''}`}
            style={swatchStyle(option.look)}
            onClick={option.onSelect}
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
              <span className="t-label theme-card__label">{option.label}</span>
              {option.selected && (
                <span className="theme-card__check">
                  <img src={checkIcon} alt="" width={14} height={14} />
                </span>
              )}
            </span>
          </button>
        ))}
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
          onChange={(buttonShape) => {
            // Picking a shape wins over a custom radius from the theme editor.
            dispatch({ type: 'look', patch: { buttonShape } })
            dispatch({ type: 'resetCustom', keys: ['buttonRadius'] })
          }}
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
      <ThemeEditor />
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
