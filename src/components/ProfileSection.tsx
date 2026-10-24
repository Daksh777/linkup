import { useRef, type KeyboardEvent } from 'react'
import { LIMITS, useStore } from '../store'
import { Button, TextField } from './ui'
import { Section } from './Section'
import cameraIcon from '../assets/icons/camera.svg'

function AvatarUploader({ compact }: { compact: boolean }) {
  const { profile, dispatch } = useStore()
  const fileInput = useRef<HTMLInputElement>(null)

  const onFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => dispatch({ type: 'set', field: 'photo', value: reader.result as string })
    reader.readAsDataURL(file)
  }

  return (
    <div className="avatar-uploader">
      <div className="avatar-uploader__thumb">
        {profile.photo ? <img src={profile.photo} alt="Profile photo" /> : <span className="sr-only">No photo</span>}
      </div>
      <div className="avatar-uploader__actions">
        <div className="avatar-uploader__buttons">
          <Button icon={cameraIcon} onClick={() => fileInput.current?.click()}>
            {compact ? 'Change' : 'Change photo'}
          </Button>
          <Button variant="ghost" disabled={!profile.photo} onClick={() => dispatch({ type: 'set', field: 'photo', value: null })}>
            Remove
          </Button>
        </div>
        <p className="t-caption t-muted">JPG or PNG · square · min 400×400 px</p>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

export function ProfileSection({ compact }: { compact: boolean }) {
  const { profile, dispatch } = useStore()
  const nameLines = profile.name.split('\n').length
  const bioOver = profile.bio.length - LIMITS.bio

  // Enter inserts the single line break that splits the two-tone headline.
  const onNameKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && profile.name.includes('\n')) e.preventDefault()
  }

  return (
    <Section title="Profile" compact={compact} gap={20}>
      <AvatarUploader compact={compact} />
      <TextField
        multiline
        label="Name"
        counter={`${profile.name.length}/${LIMITS.name}`}
        helper={compact ? 'Shown big on your page.' : 'Shown big on your page. Line break = new line.'}
        value={profile.name}
        maxLength={LIMITS.name}
        rows={nameLines}
        fieldHeight={nameLines * 24}
        onKeyDown={onNameKeyDown}
        onChange={(e) => dispatch({ type: 'set', field: 'name', value: e.target.value.replace(/\n{2,}/g, '\n') })}
      />
      <TextField
        label="Tagline"
        counter={`${profile.tagline.length}/${LIMITS.tagline}`}
        helper={compact ? 'Sits above your name.' : 'Sits above your name as a small kicker.'}
        value={profile.tagline}
        maxLength={LIMITS.tagline}
        onChange={(e) => dispatch({ type: 'set', field: 'tagline', value: e.target.value })}
      />
      <TextField
        multiline
        label="Bio"
        counter={`${profile.bio.length}/${LIMITS.bio}`}
        over={bioOver > 0}
        helper={compact ? 'Short & punchy reads best.' : 'Short & punchy reads best on mobile.'}
        error={bioOver > 0 ? `${bioOver} over the limit — trim it to ${LIMITS.bio}.` : undefined}
        value={profile.bio}
        onChange={(e) => dispatch({ type: 'set', field: 'bio', value: e.target.value })}
      />
    </Section>
  )
}
