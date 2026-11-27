/**
 * SVG rendering of the treble-clef staff and a single note.
 */

import type { StaffNote } from './types'

type CardState = 'question' | 'correct' | 'wrong'

// ---------------------------------------------------------------------------
// Staff geometry (SVG user units)
// ---------------------------------------------------------------------------
const SPACING = 16 // distance between two staff lines (one "staff space")
const HALF = SPACING / 2
const STAFF_LEFT = 40
const STAFF_RIGHT = 300
const BOTTOM_LINE_Y = 110 // E4, bottom line of the treble staff
const NOTE_X = 205
const HEAD_RX = 9.6
const HEAD_RY = 6.7
const HEAD_TILT = -18
const STEM_LEN = SPACING * 3.2
const LEDGER_EXT = 15 // how far a ledger line sticks out around the note head

/** Diatonic step → Y coordinate. E4 (step 2) sits on the bottom line. */
const stepToY = (step: number): number => BOTTOM_LINE_Y - (step - 2) * HALF

const staffEl = document.querySelector<SVGSVGElement>('#staff')!

function staffLinesMarkup(): string {
  let out = ''
  for (let i = 0; i < 5; i++) {
    const y = BOTTOM_LINE_Y - i * SPACING
    out += `<line class="staff-line" x1="${STAFF_LEFT}" y1="${y}" x2="${STAFF_RIGHT}" y2="${y}" />`
  }
  return out
}

/** Short extra lines for notes outside the staff (C4 below, A5 above). */
function ledgerMarkup(step: number): string {
  let out = ''
  for (let s = 0; s >= step; s -= 2) {
    const y = stepToY(s)
    out += `<line class="ledger" x1="${NOTE_X - LEDGER_EXT}" y1="${y}" x2="${NOTE_X + LEDGER_EXT}" y2="${y}" />`
  }
  for (let s = 12; s <= step; s += 2) {
    const y = stepToY(s)
    out += `<line class="ledger" x1="${NOTE_X - LEDGER_EXT}" y1="${y}" x2="${NOTE_X + LEDGER_EXT}" y2="${y}" />`
  }
  return out
}

function noteMarkup(note: StaffNote, state: CardState): string {
  const y = stepToY(note.step)
  const stemUp = note.step < 6 // below the middle line B4 the stem points up
  const stemX = stemUp ? NOTE_X + HEAD_RX - 1 : NOTE_X - HEAD_RX + 1
  const stemEnd = stemUp ? y - STEM_LEN : y + STEM_LEN
  return `
    <g class="note note--${state}">
      ${ledgerMarkup(note.step)}
      <line class="stem" x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemEnd}" />
      <ellipse
        class="head"
        cx="${NOTE_X}"
        cy="${y}"
        rx="${HEAD_RX}"
        ry="${HEAD_RY}"
        transform="rotate(${HEAD_TILT} ${NOTE_X} ${y})"
      />
    </g>`
}

/** Name label shown next to the note when the answer was wrong. */
function answerLabelMarkup(note: StaffNote): string {
  const y = stepToY(note.step)
  return `<text class="note-label" x="${NOTE_X + 26}" y="${y + 5}">${note.name}</text>`
}

export function renderStaff(note: StaffNote, state: CardState): void {
  staffEl.innerHTML = `
    ${staffLinesMarkup()}
    <text class="clef" x="64" y="${BOTTOM_LINE_Y - 2 * SPACING}">𝄞</text>
    ${noteMarkup(note, state)}
    ${state === 'wrong' ? answerLabelMarkup(note) : ''}
  `
}
