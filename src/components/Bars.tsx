import { useEffect, useRef, useState } from 'react'
import { PAGE_URL, useStore } from '../store'
import { Button, IconButton } from './ui'
import { useToast } from './Toast'
import globeIcon from '../assets/icons/globe-muted.svg'
import copyIcon from '../assets/icons/copy.svg'
import checkIcon from '../assets/icons/check-saved.svg'
import arrowUpRight from '../assets/icons/arrow-up-right.svg'
import moreIcon from '../assets/icons/more.svg'
import eyeIcon from '../assets/icons/eye.svg'

export type AppView = 'editor' | 'analytics'

export function ViewTabs({ view, className = '' }: { view: AppView; className?: string }) {
  return (
    <nav className={`view-tabs ${className}`} aria-label="Sections">
      <a href="#editor" className="view-tabs__tab" aria-current={view === 'editor' ? 'page' : undefined}>
        Editor
      </a>
      <a href="#analytics" className="view-tabs__tab" aria-current={view === 'analytics' ? 'page' : undefined}>
        Analytics
      </a>
    </nav>
  )
}

function Logo() {
  return (
    <a href="/" className="logo" aria-label="LinkUp home">
      <span className="logo__mark" />
      <span className="logo__word">
        LINK<span className="logo__up">UP</span>
      </span>
    </a>
  )
}

function SaveStatus({ short }: { short?: boolean }) {
  const { saveStatus } = useStore()
  return (
    <p className="save-status t-caption t-muted" aria-live="polite">
      {saveStatus === 'saved' ? (
        <>
          <img src={checkIcon} alt="" width={16} height={16} />
          {short ? 'Saved' : 'All changes saved'}
        </>
      ) : (
        'Saving…'
      )}
    </p>
  )
}

function useCopyLink() {
  const toast = useToast()
  return async () => {
    try {
      await navigator.clipboard.writeText(`https://${PAGE_URL}`)
      toast({ message: 'Link copied to clipboard' })
    } catch {
      toast({ message: `Couldn't copy — your link is ${PAGE_URL}` })
    }
  }
}

function usePublish() {
  const toast = useToast()
  return () => toast({ message: `Published to ${PAGE_URL}` })
}

export function Topbar({ compact, view, onPreview }: { compact: boolean; view: AppView; onPreview: () => void }) {
  const copyLink = useCopyLink()
  const publish = usePublish()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  if (compact) {
    return (
      <header className="topbar topbar--mobile">
        <Logo />
        <div className="topbar__spacer" />
        <SaveStatus short />
        <div className="menu-anchor" ref={menuRef}>
          <IconButton icon={moreIcon} label="More" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
          {menuOpen && (
            <div className="menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  copyLink()
                }}
              >
                Copy page link
              </button>
            </div>
          )}
        </div>
      </header>
    )
  }

  return (
    <header className="topbar">
      <Logo />
      <span className="topbar__divider" />
      <div className="page-url">
        <img src={globeIcon} alt="" width={16} height={16} />
        <p className="t-body-s t-muted">
          linkup.to/<span className="page-url__slug">chetnagrover</span>
        </p>
        <button type="button" className="page-url__copy" aria-label="Copy page link" title="Copy page link" onClick={copyLink}>
          <img src={copyIcon} alt="" width={16} height={16} />
        </button>
      </div>
      <ViewTabs view={view} />
      <div className="topbar__spacer" />
      <SaveStatus />
      <Button icon={arrowUpRight} onClick={onPreview}>
        Preview
      </Button>
      <Button variant="primary" onClick={publish}>
        Publish
      </Button>
    </header>
  )
}

export function BottomBar({ onPreview }: { onPreview: () => void }) {
  const publish = usePublish()
  return (
    <div className="bottom-bar">
      <Button size="l" block icon={eyeIcon} onClick={onPreview}>
        Preview
      </Button>
      <Button size="l" block variant="primary" onClick={publish}>
        Publish
      </Button>
    </div>
  )
}
