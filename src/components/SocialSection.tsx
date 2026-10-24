import { useStore, type SocialId } from '../store'
import { TextField } from './ui'
import { Section } from './Section'
import instagram from '../assets/icons/field-instagram.svg'
import linkedin from '../assets/icons/field-linkedin.svg'
import youtube from '../assets/icons/field-youtube.svg'
import whatsapp from '../assets/icons/field-whatsapp.svg'
import globe from '../assets/icons/field-globe.svg'

const FIELDS: { id: SocialId; label: string; icon: string; placeholder: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: instagram, placeholder: '@handle' },
  { id: 'linkedin', label: 'LinkedIn', icon: linkedin, placeholder: 'linkedin.com/in/yourname' },
  { id: 'youtube', label: 'YouTube', icon: youtube, placeholder: '@channel' },
  { id: 'whatsapp', label: 'WhatsApp community', icon: whatsapp, placeholder: 'chat.whatsapp.com/…' },
  { id: 'website', label: 'Website', icon: globe, placeholder: 'yoursite.com' },
]

export function SocialSection({ compact }: { compact: boolean }) {
  const { profile, dispatch } = useStore()
  const filled = FIELDS.filter((f) => profile.socials[f.id].trim()).length

  return (
    <Section title="Social icons" count={String(filled)} compact={compact} defaultOpen={!compact} gap={16}>
      {FIELDS.map((field) => (
        <TextField
          key={field.id}
          label={field.label}
          leadingIcon={field.icon}
          placeholder={field.placeholder}
          value={profile.socials[field.id]}
          onChange={(e) => dispatch({ type: 'social', id: field.id, value: e.target.value })}
        />
      ))}
    </Section>
  )
}
