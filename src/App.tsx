import { useCallback, useEffect, useState } from 'react'
import { StoreProvider, useMediaQuery } from './store'
import { ToastProvider } from './components/Toast'
import { BottomBar, Topbar, ViewTabs, type AppView } from './components/Bars'
import { ProfileSection } from './components/ProfileSection'
import { LinksSection } from './components/LinksSection'
import { SocialSection } from './components/SocialSection'
import { LookSection } from './components/LookSection'
import { LivePreview, PeekPreview, PreviewOverlay } from './components/Preview'
import { AnalyticsPage } from './analytics/AnalyticsPage'
import './App.css'

function readView(): AppView {
  return window.location.hash === '#analytics' ? 'analytics' : 'editor'
}

function useView() {
  const [view, setView] = useState(readView)
  useEffect(() => {
    const onHash = () => {
      setView(readView())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return view
}

function Editor() {
  // Three-column workspace needs room for two 400px editor columns + the 390px device.
  const compact = !useMediaQuery('(min-width: 1200px)')
  const view = useView()
  const [previewOpen, setPreviewOpen] = useState(false)
  const openPreview = useCallback(() => setPreviewOpen(true), [])
  const closePreview = useCallback(() => setPreviewOpen(false), [])

  return (
    <div className={compact ? 'editor editor--mobile' : 'editor'}>
      <Topbar compact={compact} view={view} onPreview={openPreview} />
      {compact && <ViewTabs view={view} className="view-tabs--mobile" />}
      {view === 'analytics' ? (
        <AnalyticsPage />
      ) : compact ? (
        <main className="workspace-mobile">
          <PeekPreview />
          <ProfileSection compact />
          <LinksSection compact />
          <SocialSection compact />
          <LookSection compact />
        </main>
      ) : (
        <main className="workspace">
          <div className="panel">
            <ProfileSection compact={false} />
            <LinksSection compact={false} />
          </div>
          <div className="panel">
            <SocialSection compact={false} />
            <LookSection compact={false} />
          </div>
          <LivePreview />
        </main>
      )}
      {compact && view === 'editor' && <BottomBar onPreview={openPreview} />}
      {previewOpen && <PreviewOverlay onClose={closePreview} />}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Editor />
      </ToastProvider>
    </StoreProvider>
  )
}
