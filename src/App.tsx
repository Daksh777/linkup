import { useCallback, useState } from 'react'
import { StoreProvider, useMediaQuery } from './store'
import { ToastProvider } from './components/Toast'
import { BottomBar, Topbar } from './components/Bars'
import { ProfileSection } from './components/ProfileSection'
import { LinksSection } from './components/LinksSection'
import { SocialSection } from './components/SocialSection'
import { LookSection } from './components/LookSection'
import { LivePreview, PeekPreview, PreviewOverlay } from './components/Preview'
import './App.css'

function Editor() {
  // Three-column workspace needs room for two 400px editor columns + the 390px device.
  const compact = !useMediaQuery('(min-width: 1200px)')
  const [previewOpen, setPreviewOpen] = useState(false)
  const openPreview = useCallback(() => setPreviewOpen(true), [])
  const closePreview = useCallback(() => setPreviewOpen(false), [])

  return (
    <div className={compact ? 'editor editor--mobile' : 'editor'}>
      <Topbar compact={compact} onPreview={openPreview} />
      {compact ? (
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
      {compact && <BottomBar onPreview={openPreview} />}
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
