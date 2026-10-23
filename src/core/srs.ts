import type { ItemProgress, SrsStage } from './types'
import { SRS_INTERVALS_H } from './types'

const BURN_STAGE = (SRS_INTERVALS_H.length - 1) as SrsStage

export function newProgress(now = Date.now()): ItemProgress {
  return {
    stage: 0,
    due: now + SRS_INTERVALS_H[0] * 3600_000,
    correct: 0,
    incorrect: 0,
    streak: 0,
    learnedAt: now,
    updatedAt: now,
  }
}

/**
 * Apply a review answer. Correct → advance one stage. Incorrect → drop
 * (harder falls from higher stages, WaniKani-style).
 *
 * `schedule: false` records the outcome (stats/streak) WITHOUT moving the
 * stage or due date — used for same-session requeues and Builder practice,
 * which measure nothing about spaced retention and must not corrupt the
 * scheduler.
 */
export function applyAnswer(
  p: ItemProgress, correct: boolean, now = Date.now(), schedule = true,
): ItemProgress {
  const stats = {
    correct: p.correct + (correct ? 1 : 0),
    incorrect: p.incorrect + (correct ? 0 : 1),
    streak: correct ? p.streak + 1 : 0,
    learnedAt: p.learnedAt,
    // Stamped even when schedule=false: the stats really did change, and a
    // sync that ignored practice credit would resurrect stale counts.
    updatedAt: now,
  }
  if (!schedule) return { ...stats, stage: p.stage, due: p.due }

  let stage = p.stage
  if (correct) {
    stage = Math.min(BURN_STAGE, stage + 1) as SrsStage
  } else {
    const penalty = stage >= 5 ? 2 : 1
    stage = Math.max(0, stage - penalty) as SrsStage
  }
  const hours = SRS_INTERVALS_H[stage]
  return {
    ...stats,
    stage,
    due: hours === Infinity ? Number.MAX_SAFE_INTEGER : now + hours * 3600_000,
  }
}

export function isDue(p: ItemProgress, now = Date.now()): boolean {
  return p.stage < BURN_STAGE && p.due <= now
}

/** 0‥1 mastery used for progress rings and level-unlock checks. */
export function mastery(p: ItemProgress | undefined): number {
  if (!p) return 0
  return Math.min(1, p.stage / 5)
}

export function stageColor(stage: SrsStage): string {
  const colors = [
    '#f97316', '#fb923c', '#facc15', '#a3e635', '#34d399',
    '#2dd4bf', '#38bdf8', '#a78bfa', '#4ade80', '#f0abfc',
  ]
  return colors[stage]
}
