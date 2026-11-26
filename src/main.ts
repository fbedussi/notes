import './style.css'

/**
 * Note Flashcards
 *
 * A random diatonic note (C4–A5, treble clef) is drawn on an SVG staff.
 * The user answers by typing the note letter (A–G) on the keyboard
 * (or tapping the on-screen keys): +1 point if correct, −1 if wrong.
 */

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
type NoteName = (typeof NOTE_NAMES)[number]

interface StaffNote {
  /** Diatonic step: 0 = C4, each +1 is one letter (line/space) up. */
  readonly step: number
  readonly name: NoteName
  readonly octave: number
}

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

/** Diatonic range: 0 = C4 … 12 = A5 (two ledger notes included). */
const MIN_STEP = 0
const MAX_STEP = 12

const stepToY = (step: number): number => BOTTOM_LINE_Y - (step - 2) * HALF

function randomNote(): StaffNote {
  const step = MIN_STEP + Math.floor(Math.random() * (MAX_STEP - MIN_STEP + 1))
  const name = NOTE_NAMES[step % 7]
  const octave = 4 + Math.floor(step / 7)
  return { step, name, octave }
}

function isNoteName(value: string): value is NoteName {
  return (NOTE_NAMES as readonly string[]).includes(value)
}

// ---------------------------------------------------------------------------
// SVG rendering
// ---------------------------------------------------------------------------
const staffEl = document.querySelector<SVGSVGElement>('#staff')!
const scoreEl = document.querySelector<HTMLElement>('#score')!
const feedbackEl = document.querySelector<HTMLElement>('#feedback')!
const keyboardEl = document.querySelector<HTMLElement>('#keyboard')!

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

function renderStaff(note: StaffNote, state: CardState): void {
  staffEl.innerHTML = `
    ${staffLinesMarkup()}
    <text class="clef" x="64" y="${BOTTOM_LINE_Y - 2 * SPACING}">𝄞</text>
    ${noteMarkup(note, state)}
  `
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let score = 0
let current = randomNote()
let locked = false
let nextTimer = 0

function setScore(value: number): void {
  score = value
  scoreEl.textContent = String(score)
  scoreEl.classList.toggle('negative', score < 0)
  scoreEl.classList.remove('bump')
  void scoreEl.offsetWidth // restart the CSS animation
  scoreEl.classList.add('bump')
}

function setFeedback(text: string, kind: '' | 'ok' | 'bad'): void {
  feedbackEl.textContent = text
  feedbackEl.className = kind === '' ? 'feedback' : `feedback ${kind}`
}

function answer(letter: string): void {
  if (locked || !isNoteName(letter)) return
  locked = true

  if (letter === current.name) {
    setScore(score + 1)
    setFeedback(`✓ ${current.name}${current.octave} — correct!`, 'ok')
    renderStaff(current, 'correct')
  } else {
    setScore(score - 1)
    setFeedback(`✗ It was ${current.name}${current.octave}`, 'bad')
    renderStaff(current, 'wrong')
  }

  nextTimer = window.setTimeout(() => {
    current = randomNote()
    renderStaff(current, 'question')
    setFeedback('Type the note name (A–G)', '')
    locked = false
  }, 1100)
}

// On-screen keys (tap targets for touch devices)
for (const name of NOTE_NAMES) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'key'
  btn.textContent = name
  btn.addEventListener('click', () => answer(name))
  keyboardEl.append(btn)
}

// Physical keyboard
window.addEventListener('keydown', (event) => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
  if (/^[a-gA-G]$/.test(event.key)) answer(event.key.toUpperCase())
})

// Keep timers honest if the tab is hidden mid-feedback
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && locked) {
    window.clearTimeout(nextTimer)
    current = randomNote()
    renderStaff(current, 'question')
    setFeedback('Type the note name (A–G)', '')
    locked = false
  }
})

renderStaff(current, 'question')
