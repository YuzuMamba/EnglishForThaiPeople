import type {
  Level, LexItem, ListeningExercise, ScriptChar, ScriptLesson, SentencePattern,
} from '../core/types'
import * as l1 from './levels/level01'
import * as l2 from './levels/level02'
import * as l3 from './levels/level03'
import * as l4 from './levels/level04'
import * as l5 from './levels/level05'
import * as l6 from './levels/level06'
import * as l7 from './levels/level07'
import * as l8 from './levels/level08'
import * as l9 from './levels/level09'
import * as l10 from './levels/level10'
import * as l11 from './levels/level11'
import * as l12 from './levels/level12'
import * as l13 from './levels/level13'
import * as l14 from './levels/level14'
import * as l15 from './levels/level15'
import * as l16 from './levels/level16'
import * as l17 from './levels/level17'
import * as l18 from './levels/level18'
import * as l19 from './levels/level19'
import * as l20 from './levels/level20'
import * as l21 from './levels/level21'
import * as l22 from './levels/level22'
import * as l23 from './levels/level23'
import * as l24 from './levels/level24'
import * as l25 from './levels/level25'
import * as l26 from './levels/level26'
import * as l27 from './levels/level27'
import * as l28 from './levels/level28'
import * as l29 from './levels/level29'
import * as l30 from './levels/level30'
import * as l31 from './levels/level31'
import * as l32 from './levels/level32'
import * as l33 from './levels/level33'
import * as l34 from './levels/level34'
import * as l35 from './levels/level35'
import { SCRIPT_LESSONS as scriptLessons } from './script'
export { letterSound } from './script'
import { LISTENING as listening } from './listening'

const modules = [
  l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15, l16, l17, l18, l19, l20,
  l21, l22, l23, l24, l25, l26, l27, l28, l29, l30, l31, l32, l33, l34, l35,
]

/** Only levels with real content participate in the curriculum. */
export const CURRICULUM: Level[] = modules
  .map(m => m.level)
  .filter(lv => lv.itemIds.length > 0)

export const ITEMS: Record<string, LexItem> = {}
export const PATTERNS: Record<string, SentencePattern> = {}
for (const m of modules) {
  for (const it of m.items) ITEMS[it.id] = it
  for (const p of m.patterns) PATTERNS[p.id] = p
}

export const SCRIPT_LESSONS: ScriptLesson[] = scriptLessons
export const LISTENING: ListeningExercise[] = listening

/** Every teachable grapheme, keyed as written ('a', 'th', 'a-e') — the phonics SRS deck. */
export const SCRIPT_CHARS: Record<string, ScriptChar> = {}
for (const lesson of SCRIPT_LESSONS) {
  for (const c of lesson.chars) SCRIPT_CHARS[c.char] = c
}

/** Graphemes taught up to and including a given lesson stage. */
export function charsThroughStage(stage: number): string[] {
  return SCRIPT_LESSONS.filter(l => l.stage <= stage).flatMap(l => l.chars.map(c => c.char))
}

/** Convenience: pattern also participates in SRS as a pseudo-item. */
export function patternAsItem(p: SentencePattern): LexItem {
  return {
    id: p.id, type: 'pattern', en: p.enTemplate.replace(/\{\w+\}/g, '___'),
    reading: p.readingTemplate.replace(/\{\w+\}/g, '___'),
    th: p.thTemplate.replace(/\{\w+\}/g, '___'), level: p.level, tags: ['pattern'], notes: p.explanation,
  }
}

export function getAnyItem(id: string): LexItem | undefined {
  return ITEMS[id] ?? (PATTERNS[id] ? patternAsItem(PATTERNS[id]) : undefined)
}
