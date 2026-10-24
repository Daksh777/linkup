import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type TextareaHTMLAttributes, type InputHTMLAttributes } from 'react'
import { isHex } from '../theme'
import chevronUp from '../assets/icons/chevron-up.svg'
import chevronDown from '../assets/icons/chevron-down.svg'
import alertCircle from '../assets/icons/alert-circle.svg'
import './ui.css'

/* ---------- Button/UI ---------- */

type ButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'm' | 'l'
  icon?: string
  block?: boolean
  disabled?: boolean
  onClick?: () => void
  'aria-describedby'?: string
}

export function Button({ children, variant = 'secondary', size = 'm', icon, block, ...rest }: ButtonProps) {
  return (
    <button type="button" className={`btn btn--${variant} btn--${size}${block ? ' btn--block' : ''}`} {...rest}>
      {icon && <img src={icon} alt="" width={18} height={18} />}
      <span>{children}</span>
    </button>
  )
}

/* ---------- IconButton (44×44) ---------- */

export function IconButton({
  icon,
  label,
  onClick,
  size = 20,
  ...rest
}: {
  icon: string
  label: string
  onClick?: () => void
  size?: number
  'aria-expanded'?: boolean
  'aria-haspopup'?: 'menu'
}) {
  return (
    <button type="button" className="icon-btn" aria-label={label} title={label} onClick={onClick} {...rest}>
      <img src={icon} alt="" width={size} height={size} />
    </button>
  )
}

/* ---------- Panel/Header ---------- */

type PanelHeaderProps = {
  title: string
  count?: string
  /** When set, the header becomes a disclosure button (mobile cards). */
  expanded?: boolean
  onToggle?: () => void
  controls?: string
}

export function PanelHeader({ title, count, expanded, onToggle, controls }: PanelHeaderProps) {
  const content = (
    <>
      <span className="panel-header__title">
        <span className="t-heading-s panel-header__heading">{title}</span>
        {count && <span className="t-numeral t-muted">{count}</span>}
      </span>
      {onToggle && <img src={expanded ? chevronUp : chevronDown} alt="" width={20} height={20} />}
    </>
  )

  if (onToggle) {
    return (
      <h2 className="panel-header-wrap">
        <button type="button" className="panel-header" aria-expanded={expanded} aria-controls={controls} onClick={onToggle}>
          {content}
        </button>
      </h2>
    )
  }
  return (
    <h2 className="panel-header-wrap">
      <span className="panel-header">{content}</span>
    </h2>
  )
}

/* ---------- Input/Text + Input/Textarea ---------- */

type FieldShellProps = {
  label: string
  counter?: string
  helper?: string
  error?: string
  errorAction?: ReactNode
  over?: boolean
  leadingIcon?: string
}

type TextFieldProps = FieldShellProps &
  (
    | ({ multiline?: false } & InputHTMLAttributes<HTMLInputElement>)
    | ({ multiline: true; fieldHeight?: number } & TextareaHTMLAttributes<HTMLTextAreaElement>)
  )

export function TextField(props: TextFieldProps) {
  const { label, counter, helper, error, errorAction, over, leadingIcon, ...control } = props
  const id = useId()
  const helperId = `${id}-helper`
  const invalid = Boolean(error || over)

  return (
    <div className="field">
      <div className="field__header">
        <label htmlFor={id} className="t-label">
          {label}
        </label>
        {counter && <span className={`t-numeral ${over ? 'field__counter--over' : 't-muted'}`}>{counter}</span>}
      </div>
      <div className={`field__box${invalid ? ' field__box--error' : ''}${control.multiline ? ' field__box--multiline' : ''}`}>
        {leadingIcon && <img src={leadingIcon} alt="" width={20} height={20} />}
        {control.multiline ? (
          <MultilineControl id={id} invalid={invalid} describedBy={helperId} {...control} />
        ) : (
          <input
            id={id}
            className="field__control t-body-m"
            aria-invalid={invalid || undefined}
            aria-describedby={helper || error ? helperId : undefined}
            {...(control as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>
      {(error || helper) && (
        <div id={helperId} className={`field__helper t-body-s${error ? ' field__helper--error' : ' t-muted'}`}>
          {error && <img src={alertCircle} alt="" width={16} height={16} />}
          <span>{error ?? helper}</span>
          {error && errorAction}
        </div>
      )}
    </div>
  )
}

function MultilineControl({
  id,
  invalid,
  describedBy,
  multiline: _multiline,
  fieldHeight,
  ...rest
}: { id: string; invalid: boolean; describedBy: string; multiline: true; fieldHeight?: number } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      id={id}
      className="field__control t-body-m"
      style={fieldHeight ? { height: fieldHeight } : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      {...rest}
    />
  )
}

/* ---------- Toggle ---------- */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="toggle"
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__knob" />
    </button>
  )
}

/* ---------- Segmented/Control (radiogroup) ---------- */

type SegmentedProps<T extends string> = {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Segmented<T extends string>({ label, options, value, onChange, className }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className={`segmented${className ? ` ${className}` : ''}`}>
      {options.map((option, i) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`segmented__item t-label${selected ? ' segmented__item--selected' : ''}`}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Chip/Tag (editor, outline) ---------- */

export function Chip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>
}

/* ---------- Reset (inline text action) ---------- */

function ResetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="reset-btn t-caption" aria-label={`Reset ${label}`} title="Back to the theme default" onClick={onClick}>
      Reset
    </button>
  )
}

/* ---------- Input/Color (swatch picker + hex) ---------- */

type ColorFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  /** Shown when the value differs from the theme default. */
  onReset?: () => void
}

export function ColorField({ label, value, onChange, onReset }: ColorFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  // Follow outside changes (picker, reset, theme switch) without clobbering a half-typed hex.
  if (synced !== value) {
    setSynced(value)
    setDraft(value)
  }

  const onDraft = (next: string) => {
    setDraft(next)
    const hex = (next.startsWith('#') ? next : `#${next}`).toLowerCase()
    if (isHex(hex)) onChange(hex)
  }

  return (
    <div className={`color-field${onReset ? ' color-field--custom' : ''}`}>
      <span className="color-field__swatch" style={{ background: value }}>
        <input type="color" value={value} aria-label={`${label} picker`} onChange={(e) => onChange(e.target.value)} />
      </span>
      <span className="color-field__copy">
        <label htmlFor={id} className="t-caption t-muted color-field__label">
          {label}
        </label>
        <input
          id={id}
          className="color-field__hex t-label"
          value={draft}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onDraft(e.target.value.trim())}
          onBlur={() => setDraft(value)}
        />
      </span>
      {onReset && <ResetButton label={label} onClick={onReset} />}
    </div>
  )
}

/* ---------- Input/Slider ---------- */

type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  /** Text shown next to the label, e.g. "12px". */
  display: string
  onChange: (value: number) => void
  onReset?: () => void
  helper?: string
}

export function Slider({ label, value, min, max, step = 1, display, onChange, onReset, helper }: SliderProps) {
  const id = useId()
  const fill = ((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100

  return (
    <div className="slider">
      <div className="field__header">
        <label htmlFor={id} className="t-label">
          {label}
        </label>
        <span className="slider__value">
          {onReset && <ResetButton label={label} onClick={onReset} />}
          <span className="t-numeral">{display}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="slider__input"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        aria-valuetext={display}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {helper && <p className="t-caption t-muted">{helper}</p>}
    </div>
  )
}
