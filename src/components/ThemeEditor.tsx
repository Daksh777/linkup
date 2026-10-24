import { useRef, useState, type KeyboardEvent } from 'react'
import { LIMITS, snapshot, useStore, type Look } from '../store'
import {
  baseTokens,
  decodeTheme,
  encodeTheme,
  FULL_RADIUS,
  resolveTheme,
  type BackgroundType,
  type ColorToken,
  type NumberToken,
  type ThemeTokens,
} from '../theme'
import { Button, Chip, ColorField, Segmented, Slider, TextField } from './ui'
import { useToast } from './Toast'
import cameraIcon from '../assets/icons/camera.svg'
import copyIcon from '../assets/icons/copy.svg'

type Tab = 'canvas' | 'colors' | 'shapes' | 'effects'

const TABS: { value: Tab; label: string }[] = [
  { value: 'canvas', label: 'Canvas' },
  { value: 'colors', label: 'Colors' },
  { value: 'shapes', label: 'Shapes' },
  { value: 'effects', label: 'Effects' },
]

const BG_TYPES: { value: BackgroundType; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image' },
]

const COLOR_GROUPS: { title: string; tokens: { token: ColorToken; label: string }[] }[] = [
  {
    title: 'Text',
    tokens: [
      { token: 'text', label: 'Main' },
      { token: 'accent', label: 'Highlight' },
      { token: 'muted', label: 'Muted' },
      { token: 'kicker', label: 'Tagline' },
    ],
  },
  {
    title: 'Buttons',
    tokens: [
      { token: 'button', label: 'Fill' },
      { token: 'onButton', label: 'Label' },
      { token: 'buttonShadow', label: 'Shadow' },
      { token: 'border', label: 'Outlines' },
    ],
  },
  {
    title: 'Sticker & chip',
    tokens: [
      { token: 'sticker', label: 'Fill' },
      { token: 'onSticker', label: 'Text' },
    ],
  },
  {
    title: 'Photo',
    tokens: [
      { token: 'avatarFrame', label: 'Frame' },
      { token: 'avatarShadow', label: 'Shadow' },
    ],
  },
]

/** Longest edge of an uploaded background; keeps the data URL small enough for autosave. */
const BG_MAX_SIZE = 1600

function useTokens() {
  const { profile, dispatch } = useStore()
  const base = baseTokens(profile.look)
  const { custom } = profile.look

  return {
    tokens: resolveTheme(profile.look),
    isCustom: (key: keyof ThemeTokens) => key in custom,
    /** Values equal to the theme default drop the override, so "edits" stays honest. */
    set: <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) =>
      value === base[key] ? dispatch({ type: 'resetCustom', keys: [key] }) : dispatch({ type: 'custom', patch: { [key]: value } }),
    reset: (...keys: (keyof ThemeTokens)[]) => dispatch({ type: 'resetCustom', keys }),
  }
}

function ColorControl({ token, label }: { token: ColorToken; label: string }) {
  const { tokens, isCustom, set, reset } = useTokens()
  return (
    <ColorField
      label={label}
      value={tokens[token]}
      onChange={(value) => set(token, value)}
      onReset={isCustom(token) ? () => reset(token) : undefined}
    />
  )
}

type NumberControlProps = {
  token: NumberToken
  label: string
  min: number
  max: number
  step?: number
  unit?: string
  /** Radius sliders: the top of the range means fully round. */
  full?: boolean
  helper?: string
}

function NumberControl({ token, label, min, max, step, unit = 'px', full, helper }: NumberControlProps) {
  const { tokens, isCustom, set, reset } = useTokens()
  const value = tokens[token]
  const isFull = full && value >= max
  return (
    <Slider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      display={isFull ? 'Full' : `${value}${unit}`}
      helper={helper}
      onChange={(next) => set(token, full && next >= max ? FULL_RADIUS : next)}
      onReset={isCustom(token) ? () => reset(token) : undefined}
    />
  )
}

function scaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, BG_MAX_SIZE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unreadable image'))
    }
    img.src = url
  })
}

function BackgroundImage() {
  const { tokens, set, reset } = useTokens()
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      set('bgImage', await scaleImage(file))
    } catch {
      toast({ message: "Couldn't read that image — try a JPG or PNG." })
    }
  }

  return (
    <>
      <div className="bg-uploader">
        <div className="bg-uploader__thumb" style={tokens.bgImage ? { backgroundImage: `url("${tokens.bgImage}")` } : undefined}>
          {!tokens.bgImage && <span className="t-caption t-muted">None</span>}
        </div>
        <div className="avatar-uploader__actions">
          <div className="avatar-uploader__buttons">
            <Button icon={cameraIcon} onClick={() => fileInput.current?.click()}>
              {tokens.bgImage ? 'Replace' : 'Upload'}
            </Button>
            <Button variant="ghost" disabled={!tokens.bgImage} onClick={() => reset('bgImage')}>
              Remove
            </Button>
          </div>
          <p className="t-caption t-muted">JPG or PNG · portrait works best</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      <NumberControl token="bgTint" label="Tint" min={0} max={90} step={5} unit="%" helper="Washes the photo with your background colour so text stays readable." />
    </>
  )
}

function CanvasPanel() {
  const { tokens, set } = useTokens()
  return (
    <>
      <Segmented label="Background type" options={BG_TYPES} value={tokens.bgType} onChange={(bgType) => set('bgType', bgType)} />
      <div className="color-grid">
        <ColorControl token="canvas" label={tokens.bgType === 'gradient' ? 'Start' : 'Background'} />
        {tokens.bgType === 'gradient' && <ColorControl token="gradientTo" label="End" />}
      </div>
      {tokens.bgType === 'gradient' && <NumberControl token="gradientAngle" label="Angle" min={0} max={360} step={5} unit="°" />}
      {tokens.bgType === 'image' && <BackgroundImage />}
      <p className="t-label theme-editor__subhead">Glow</p>
      <div className="color-grid">
        <ColorControl token="glowPrimary" label="Top glow" />
        <ColorControl token="glowSecondary" label="Bottom glow" />
      </div>
      <NumberControl token="glowStrength" label="Glow strength" min={0} max={200} step={5} unit="%" />
    </>
  )
}

function ColorsPanel() {
  return (
    <>
      {COLOR_GROUPS.map((group) => (
        <div key={group.title} className="look-group">
          <p className="t-label theme-editor__subhead">{group.title}</p>
          <div className="color-grid">
            {group.tokens.map(({ token, label }) => (
              <ColorControl key={token} token={token} label={label} />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function ShapesPanel() {
  return (
    <>
      <NumberControl token="buttonRadius" label="Link buttons" min={0} max={36} full helper="Overrides the Button shape above." />
      <NumberControl token="iconRadius" label="Social icons" min={0} max={24} full />
      <NumberControl token="chipRadius" label="Chips" min={0} max={14} full />
      <NumberControl token="stickerRadius" label="Sticker" min={0} max={16} full />
      <NumberControl token="avatarRadius" label="Photo" min={0} max={56} full />
      <NumberControl token="buttonHeight" label="Button height" min={44} max={72} step={2} />
    </>
  )
}

function EffectsPanel() {
  const { profile } = useStore()
  return (
    <>
      <NumberControl
        token="shadowOffset"
        label="Button shadow"
        min={0}
        max={16}
        helper={profile.look.buttonStyle === 'hard-shadow' ? undefined : 'Shows with the Hard shadow button style.'}
      />
      <NumberControl token="borderWidth" label="Outline width" min={0} max={4} step={0.5} />
      <NumberControl token="avatarTilt" label="Photo tilt" min={-12} max={12} unit="°" />
    </>
  )
}

type Mode = 'idle' | 'save' | 'import'

function ThemeActions() {
  const { profile, dispatch } = useStore()
  const toast = useToast()
  const { look, savedThemes } = profile
  const [mode, setMode] = useState<Mode>('idle')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string>()

  const saved = savedThemes.find((t) => t.id === look.savedId)
  const savedIndex = saved ? savedThemes.indexOf(saved) : -1
  const dirty = saved ? JSON.stringify(snapshot(look)) !== JSON.stringify(saved.look) : false
  const edits = Object.keys(look.custom).length
  const full = savedThemes.length >= LIMITS.savedThemes

  const restore = (prev: Look) => () => dispatch({ type: 'look', patch: prev })

  const startSave = () => {
    setName(`My theme ${savedThemes.length + 1}`)
    setMode('save')
  }

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    dispatch({ type: 'saveTheme', name: trimmed })
    setMode('idle')
    toast({ message: `Saved “${trimmed}” to your themes` })
  }

  const resetAll = () => {
    const prev = look
    dispatch({ type: 'look', patch: { custom: {} } })
    toast({ message: 'Back to the preset', action: { label: 'Undo', onClick: restore(prev) } })
  }

  const remove = () => {
    if (!saved) return
    dispatch({ type: 'deleteTheme', id: saved.id })
    toast({
      message: `Deleted “${saved.name}”`,
      action: { label: 'Undo', onClick: () => dispatch({ type: 'restoreTheme', theme: saved, index: savedIndex }) },
    })
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(encodeTheme(look))
      toast({ message: look.custom.bgImage ? 'Theme code copied (background image not included)' : 'Theme code copied' })
    } catch {
      toast({ message: "Couldn't reach the clipboard" })
    }
  }

  const applyCode = () => {
    const decoded = decodeTheme(code)
    if (!decoded) {
      setCodeError("That doesn't look like a LinkUp theme code.")
      return
    }
    const prev = look
    dispatch({ type: 'look', patch: { ...decoded, savedId: null } })
    setMode('idle')
    setCode('')
    toast({ message: 'Theme applied', action: { label: 'Undo', onClick: restore(prev) } })
  }

  const onNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setMode('idle')
  }

  if (mode === 'save') {
    return (
      <div className="theme-editor__form">
        <TextField
          label="Theme name"
          counter={`${name.length}/${LIMITS.themeName}`}
          helper="Saved themes show up next to the presets."
          value={name}
          maxLength={LIMITS.themeName}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onNameKeyDown}
        />
        <div className="theme-editor__buttons">
          <Button variant="primary" disabled={!name.trim()} onClick={save}>
            Save theme
          </Button>
          <Button variant="ghost" onClick={() => setMode('idle')}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  if (mode === 'import') {
    return (
      <div className="theme-editor__form">
        <TextField
          multiline
          label="Theme code"
          helper="Paste a code from Copy code on any LinkUp page."
          error={codeError}
          value={code}
          autoFocus
          spellCheck={false}
          onChange={(e) => {
            setCode(e.target.value)
            setCodeError(undefined)
          }}
        />
        <div className="theme-editor__buttons">
          <Button variant="primary" disabled={!code.trim()} onClick={applyCode}>
            Apply
          </Button>
          <Button variant="ghost" onClick={() => setMode('idle')}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-editor__footer">
      <div className="theme-editor__buttons">
        {saved && (
          <Button variant="primary" disabled={!dirty} onClick={() => dispatch({ type: 'updateTheme', id: saved.id })}>
            {dirty ? `Update “${saved.name}”` : 'Saved'}
          </Button>
        )}
        <Button variant={saved ? 'secondary' : 'primary'} disabled={full} onClick={startSave}>
          {saved ? 'Save as new' : 'Save as theme'}
        </Button>
        <Button variant="ghost" disabled={!edits} onClick={resetAll}>
          Reset
        </Button>
      </div>
      <div className="theme-editor__buttons">
        <Button variant="ghost" icon={copyIcon} onClick={copyCode}>
          Copy code
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setCodeError(undefined)
            setMode('import')
          }}
        >
          Paste code
        </Button>
        {saved && (
          <Button variant="ghost" onClick={remove}>
            Delete
          </Button>
        )}
      </div>
      {full && <p className="t-caption t-muted">You've saved {LIMITS.savedThemes} themes — delete one to save another.</p>}
    </div>
  )
}

export function ThemeEditor() {
  const { profile } = useStore()
  const [tab, setTab] = useState<Tab>('canvas')
  const edits = Object.keys(profile.look.custom).length

  return (
    <div className="look-group theme-editor">
      <div className="theme-editor__header">
        <p className="t-label">Customize</p>
        {edits > 0 && <Chip>{edits === 1 ? '1 edit' : `${edits} edits`}</Chip>}
      </div>
      <Segmented label="Customize" options={TABS} value={tab} onChange={setTab} />
      <div className="theme-editor__panel" role="group" aria-label={TABS.find((t) => t.value === tab)?.label}>
        {tab === 'canvas' && <CanvasPanel />}
        {tab === 'colors' && <ColorsPanel />}
        {tab === 'shapes' && <ShapesPanel />}
        {tab === 'effects' && <EffectsPanel />}
      </div>
      <ThemeActions />
    </div>
  )
}
