// Exports the whole course corpus to course-content.csv for offline auditing.
//
// CLAUDE.md §6 flagged the CSV as a tracked, generated snapshot with no
// exporter — so it went stale silently whenever src/data/levels/* changed.
// This is that exporter. Re-run it as part of any content work:
//
//   npx tsx scripts/export-content.mts
//
// Output is UTF-8 with a BOM so Excel opens the Thai readings and meanings
// correctly, sorted by level → type → id, with tags joined by ';'. Pattern rows
// carry their templates ({slot} placeholders intact) and have no IPA.
import { writeFileSync } from 'node:fs'
import { ITEMS, PATTERNS } from '../src/data'

const COLUMNS = ['id', 'type', 'level', 'en', 'reading', 'ipa', 'th', 'pos', 'tags', 'notes'] as const
type Row = Record<(typeof COLUMNS)[number], string>

const rows: Row[] = []

for (const it of Object.values(ITEMS)) {
  rows.push({
    id: it.id,
    type: it.type,
    level: String(it.level),
    en: it.en,
    reading: it.reading,
    ipa: it.ipa ?? '',
    th: it.th,
    pos: it.pos ?? '',
    tags: (it.tags ?? []).join(';'),
    notes: it.notes ?? '',
  })
}

for (const p of Object.values(PATTERNS)) {
  rows.push({
    id: p.id,
    type: 'pattern',
    level: String(p.level),
    en: p.enTemplate,
    reading: p.readingTemplate,
    ipa: '',
    th: p.thTemplate,
    pos: '',
    tags: '',
    notes: p.explanation,
  })
}

rows.sort(
  (a, b) =>
    Number(a.level) - Number(b.level) ||
    a.type.localeCompare(b.type) ||
    a.id.localeCompare(b.id),
)

/** RFC 4180: quote when the field contains a comma, quote or newline. */
const cell = (v: string): string =>
  /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

const csv =
  '﻿' +
  [COLUMNS.join(','), ...rows.map(r => COLUMNS.map(c => cell(r[c])).join(','))].join('\r\n') +
  '\r\n'

writeFileSync('course-content.csv', csv, 'utf8')

const counts = rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.type]: (a[r.type] ?? 0) + 1 }), {})
console.log(
  `course-content.csv — ${rows.length} rows (` +
    Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' ') +
    ')',
)
