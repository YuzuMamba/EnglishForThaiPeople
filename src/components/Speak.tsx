import { useState } from 'react'
import { speakEnglish } from '../core/audio'

/** Crisp speaker glyph in brand gold — emoji renders too dull on dark glass. */
function SpeakerIcon({ size, slow }: { size: number; slow: boolean }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9.5v5c0 .6.4 1 1 1h2.6l4 3.2c.7.5 1.6 0 1.6-.8V6.1c0-.8-.9-1.3-1.6-.8l-4 3.2H5c-.6 0-1 .4-1 1Z"
        fill="var(--gold)"
      />
      {slow ? (
        <path d="M16.2 12h4.2M18.3 9.9l2.1 2.1-2.1 2.1" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M16 9.2a4.2 4.2 0 0 1 0 5.6" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18.4 7.2a7.4 7.4 0 0 1 0 9.6" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
        </>
      )}
    </svg>
  )
}

/** Round audio button that speaks English text and pulses while speaking. */
export default function Speak({ text, slow = false, size = 44 }: {
  text: string
  slow?: boolean
  size?: number
}): JSX.Element {
  const [speaking, setSpeaking] = useState(false)
  return (
    <button
      className={`icon-btn ${speaking ? 'speaking' : ''}`}
      style={{ width: size, height: size }}
      aria-label={`ฟังเสียงภาษาอังกฤษ${slow ? ' (ช้า)' : ''}`}
      onClick={e => {
        e.stopPropagation()
        speakEnglish(text, slow ? 0.62 : 0.88)
        setSpeaking(true)
        window.setTimeout(() => setSpeaking(false), 1400)
      }}
    >
      <SpeakerIcon size={size * 0.55} slow={slow} />
    </button>
  )
}
