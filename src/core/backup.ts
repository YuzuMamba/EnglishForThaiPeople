import { PERSIST_VERSION, migrateState, snapshotOf, type PersistedSnapshot } from './store'

// ─── Learner-data backup: export / import as a JSON file ─────────────────────
// The file wraps a PersistedSnapshot with enough metadata to validate it and
// to migrate an OLD backup into the CURRENT shape on import (same chain the
// boot path uses). A backup from a NEWER app version is refused outright —
// downgrading a shape we don't know how to read risks silent data loss.

export interface BackupFile {
  app: 'chaienglish'
  /** PERSIST_VERSION at export time. */
  version: number
  exportedAt: string
  state: PersistedSnapshot
}

export interface BackupSummary {
  items: number
  letters: number
  xp: number
  maxUnlocked: number
  exportedAt: string
}

export function serializeBackup(st: PersistedSnapshot): string {
  const file: BackupFile = {
    app: 'chaienglish',
    version: PERSIST_VERSION,
    exportedAt: new Date().toISOString(),
    state: snapshotOf(st),
  }
  return JSON.stringify(file, null, 2)
}

export function backupFilename(now = new Date()): string {
  return `chaienglish-backup-${now.toISOString().slice(0, 10)}.json`
}

/** Parse + validate + migrate a backup file. Throws with a human-readable
 *  (Thai — it is shown to the learner) message on anything unusable; never
 *  partially applies. */
export function parseBackup(json: string): { state: PersistedSnapshot; summary: BackupSummary } {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('ไฟล์นี้ไม่ใช่ JSON ที่ถูกต้อง — แน่ใจไหมว่าเป็นไฟล์สำรองของ ChaiEnglish?')
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ ChaiEnglish')
  }
  const file = raw as Partial<BackupFile>
  if (file.app !== 'chaienglish' || typeof file.state !== 'object' || file.state === null) {
    throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ ChaiEnglish')
  }
  // Strict, not best-guess: a backup with a damaged version field is most
  // likely mangled or from the future — the two cases where guessing "treat
  // as v0" is exactly wrong. Files can afford strictness; boot cannot.
  if (typeof file.version !== 'number' || !Number.isInteger(file.version) || file.version < 0) {
    throw new Error('ช่องเวอร์ชันของไฟล์สำรองนี้เสียหาย — ขอไม่เดาวิธีอ่าน เพื่อความปลอดภัยของข้อมูลคุณ')
  }
  if (file.version > PERSIST_VERSION) {
    throw new Error(
      `ไฟล์สำรองนี้สร้างจาก ChaiEnglish เวอร์ชันใหม่กว่า (v${file.version} ส่วนแอปนี้อ่านได้ถึง v${PERSIST_VERSION}) อัปเดตแอปก่อน แล้วค่อยนำเข้า`,
    )
  }
  // Same migration chain as boot — an old backup lands on the current shape.
  const state = migrateState(file.state, file.version)
  const items = Object.keys(state.progress).length
  const letters = Object.keys(state.scriptProgress).length
  if (items === 0 && letters === 0 && state.xp === 0) {
    throw new Error('ไฟล์สำรองนี้ไม่มีความคืบหน้าอยู่เลย — ขอไม่แทนที่ข้อมูลของคุณด้วยไฟล์นี้')
  }
  return {
    state,
    summary: summarize(state, typeof file.exportedAt === 'string' ? file.exportedAt : 'ไม่ทราบวันที่'),
  }
}

function summarize(state: PersistedSnapshot, exportedAt: string): BackupSummary {
  return {
    items: Object.keys(state.progress).length,
    letters: Object.keys(state.scriptProgress).length,
    xp: state.xp,
    maxUnlocked: state.maxUnlocked,
    exportedAt,
  }
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Accept EITHER a backup file (`{app:'chaienglish', version, state}`) or a raw
 * `chaienglish-v1` localStorage value (`{state, version}`).
 *
 * The raw shape matters for real recovery: when a deploy URL dies, the
 * learner's history is stranded on that origin, and the only way to get it out
 * of a phone with no devtools is to read localStorage by hand and paste the
 * value in. Refusing that shape would make the stranded data unrecoverable.
 */
export function parseAnyBackup(text: string): { state: PersistedSnapshot; summary: BackupSummary } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('นี่ไม่ใช่ JSON ที่ถูกต้อง — วางค่าทั้งหมด ตั้งแต่ { ตัวแรกจนถึง } ตัวสุดท้าย')
  }
  if (!isObj(raw)) throw new Error('ข้อมูลนี้ดูไม่เหมือนข้อมูลของ ChaiEnglish')
  if (raw.app === 'chaienglish') return parseBackup(text)   // a proper backup file
  if (isObj(raw.state)) {                                // a raw localStorage value
    const r = parseStorageBlob(text, Date.now())
    if (Object.keys(r.state.progress).length === 0 &&
        Object.keys(r.state.scriptProgress).length === 0 && r.state.xp === 0) {
      throw new Error('ข้อมูลนี้ไม่มีความคืบหน้าอยู่เลย — ขอไม่แทนที่สิ่งที่คุณมีด้วยข้อมูลนี้')
    }
    return r
  }
  throw new Error('ข้อมูลนี้ดูไม่เหมือนข้อมูลของ ChaiEnglish — ต้องเป็นไฟล์สำรอง หรือค่า chaienglish-v1')
}

/** Parse a raw zustand storage blob (`{state, version}`) — the format rescue
 *  keys hold — through the same migration chain. For the Restore UI. */
export function parseStorageBlob(raw: string, stashedAt: number): { state: PersistedSnapshot; summary: BackupSummary } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('สแนปช็อตนี้อ่านไม่ได้')
  }
  const blob = (typeof parsed === 'object' && parsed !== null ? parsed : {}) as { state?: unknown; version?: unknown }
  const version = typeof blob.version === 'number' && Number.isFinite(blob.version) ? blob.version : 0
  // Rescue snapshots restore best-effort even from a newer version — the raw
  // original stays under its rescue key, so nothing is lost by trying.
  const state = migrateState(blob.state, Math.min(version, PERSIST_VERSION))
  return { state, summary: summarize(state, new Date(stashedAt).toISOString()) }
}
