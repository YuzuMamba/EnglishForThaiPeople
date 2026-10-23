import type { ListeningExercise } from '../core/types'

// Listening Lab dialogues — short natural-speed English conversations built
// (almost) entirely from vocabulary taught at or below their level. Questions
// test MEANING and situation, in Thai, never word-by-word translation.
//
// The fixed cast and their genders, for voice casting (scripts/generate-audio.mts
// gives each character one voice of the right gender across every dialogue):
export const CAST: Record<string, 'MALE' | 'FEMALE'> = {
  Nam: 'FEMALE', Ploy: 'FEMALE', Fah: 'FEMALE', Bank: 'MALE', Tee: 'MALE', Nut: 'MALE',
  Emma: 'FEMALE', Sarah: 'FEMALE', Anna: 'FEMALE', Tom: 'MALE', Jack: 'MALE', 'Mr. Lee': 'MALE',
}

export const LISTENING: ListeningExercise[] = [
]
