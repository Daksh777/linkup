import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { PAGE_URL, useStore } from '../store'
import { PublicProfile } from './PublicProfile'
import { Section } from './Section'
import { PanelHeader, Segmented } from './ui'

type Device = 'mobile' | 'desktop'

/** Desktop editor: sticky live preview with a Mobile/Desktop frame toggle. */
export function LivePreview() {
  const { profile } = useStore()
  const [device, setDevice] = useState<Device>('mobile')

  return (
    <aside className="panel live-preview" aria-label="Live preview">
      <div className="live-preview__header">
        <PanelHeader title="Live preview" />
        <Segmented
          label="Preview device"
          className="live-preview__device"
          options={[
            { value: 'mobile', label: 'Mobile' },
            { value: 'desktop', label: 'Desktop' },
          ]}
          value={device}
          onChange={setDevice}
        />
      </div>
      <div className="stage">
        {device === 'mobile' ? (
          <div className="device device--phone" inert>
            <PublicProfile profile={profile} />
          </div>
        ) : (
          <div className="device device--browser" inert>
            <div className="device__chrome">
              <span />
              <span />
              <span />
              <p>{PAGE_URL}</p>
            </div>
            <div className="device__viewport">
              <PublicProfile profile={profile} className="pp--desktop" />
            </div>
          </div>
        )}
        <p className="t-caption t-muted">Updates as you type · {PAGE_URL}</p>
      </div>
    </aside>
  )
}

/** Mobile editor: the real profile at ~56% scale, faded at the bottom. */
export function PeekPreview() {
  const { profile } = useStore()
  return (
    <Section title="Live preview" compact gap={16}>
      <div className="stage stage--peek">
        <div className="device device--peek" inert>
          <PublicProfile profile={profile} />
          <div
            className="device__fade"
            style={{ '--fade-to': profile.look.theme === 'full-bleed-lime' ? '#e1f000' : '#0a0a0a' } as CSSProperties}
          />
        </div>
        <p className="t-caption t-muted">Tap Preview for full screen</p>
      </div>
    </Section>
  )
}

/** Full-screen preview with live links. */
export function PreviewOverlay({ onClose }: { onClose: () => void }) {
  const { profile } = useStore()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Page preview">
      <button ref={closeRef} type="button" className="btn btn--secondary btn--m overlay__close" onClick={onClose}>
        Close
      </button>
      <div className="overlay__page">
        <PublicProfile profile={profile} interactive />
      </div>
    </div>
  )
}
