import './style.css'
import { renderStaff } from './staff'
import type { NoteName, StaffNote } from './types'

/**
 * Note Flashcards
 *
 * A random diatonic note (C4–A5, treble clef) is drawn on an SVG staff.
 * The user answers by typing the note letter (A–G) on the keyboard
 * (or tapping the on-screen keys): +1 point if correct, −1 if wrong
 * or if the time runs out. Every 10 points the level goes up and the
 * time limit per card is reduced by 20%.
 */

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

/** Diatonic range: 0 = C4 … 12 = A5 (two ledger notes included). */
const MIN_STEP = 0
const MAX_STEP = 12

function randomNote(): StaffNote {
  const step = MIN_STEP + Math.floor(Math.random() * (MAX_STEP - MIN_STEP + 1))
  const name = NOTE_NAMES[step % 7]
  return { step, name }
}

function isNoteName(value: string): value is NoteName {
  return (NOTE_NAMES as readonly string[]).includes(value)
}

const scoreEl = document.querySelector<HTMLElement>('#score')!
const levelEl = document.querySelector<HTMLElement>('#level')!
const feedbackEl = document.querySelector<HTMLElement>('#feedback')!
const keyboardEl = document.querySelector<HTMLElement>('#keyboard')!
const timerEl = document.querySelector<HTMLElement>('#timer')!
const timerBarEl = document.querySelector<HTMLElement>('#timer-bar')!

const BASE_LIMIT_MS = 10000 // time per card at level 1
const LEVEL_FACTOR = 0.8 // each level: time reduced by 20%
const FEEDBACK_MS = 1100 // how long correct/wrong feedback stays on screen

let score = 0
let level = 1
let current = randomNote()
let locked = false
let cardTimer = 0 // countdown for the current card
let nextTimer = 0 // delay before the next card after an answer

/** Time limit for the current level. */
const limitMs = (): number => BASE_LIMIT_MS * Math.pow(LEVEL_FACTOR, level - 1)

function setScore(value: number): void {
  score = value
  scoreEl.textContent = String(score)
  scoreEl.classList.toggle('negative', score < 0)
  scoreEl.classList.remove('bump')
  void scoreEl.offsetWidth // restart the CSS animation
  scoreEl.classList.add('bump')
}

function setLevel(value: number): void {
  level = value
  levelEl.textContent = String(level)
  levelEl.classList.remove('bump')
  void levelEl.offsetWidth
  levelEl.classList.add('bump')
}

function setFeedback(text: string, kind: '' | 'ok' | 'bad' | 'levelup'): void {
  feedbackEl.textContent = text
  feedbackEl.className = kind === '' ? 'feedback' : `feedback ${kind}`
}

function startTimerBar(ms: number): void {
  timerEl.classList.remove('timer--expired')
  timerBarEl.style.width = ''
  timerBarEl.style.animation = 'none'
  void timerBarEl.offsetWidth // restart the CSS animation
  timerBarEl.style.animation = `timer-drain ${ms}ms linear forwards`
}

function freezeTimerBar(): void {
  const width = getComputedStyle(timerBarEl).width
  timerBarEl.style.animation = 'none'
  timerBarEl.style.width = width
}

function startCard(): void {
  current = randomNote()
  renderStaff(current, 'question')
  setFeedback('Type the note name (A–G)', '')
  clearRevealedKeys()
  locked = false
  startTimerBar(limitMs())
  cardTimer = window.setTimeout(onTimeUp, limitMs())
}

function stopCardTimer(): void {
  window.clearTimeout(cardTimer)
  freezeTimerBar()
}

/** The card expired: −1 point, reveal the answer, move on. */
function onTimeUp(): void {
  if (locked) return
  locked = true
  timerEl.classList.add('timer--expired')
  setScore(score - 1)
  setFeedback(`⏱ Time's up — it was ${current.name}`, 'bad')
  renderStaff(current, 'wrong')
  revealKey(current)
  nextTimer = window.setTimeout(startCard, FEEDBACK_MS)
}

function answer(letter: string): void {
  if (locked || !isNoteName(letter)) return
  locked = true
  stopCardTimer()

  if (letter === current.name) {
    setScore(score + 1)
    let kind: 'ok' | 'levelup' = 'ok'
    let text = `✓ ${current.name} — correct!`
    // Every multiple of 10 points kicks in a new, faster level
    if (score > 0 && score % 10 === 0) {
      setLevel(level + 1)
      kind = 'levelup'
      text = `✓ ${current.name} — Level ${level}! (${(limitMs() / 1000).toFixed(1)}s)`
    }
    setFeedback(text, kind)
    renderStaff(current, 'correct')
    revealKey(current)
  } else {
    setScore(score - 1)
    setFeedback(`✗ It was ${current.name}`, 'bad')
    renderStaff(current, 'wrong')
    revealKey(current)
  }

  nextTimer = window.setTimeout(startCard, FEEDBACK_MS)
}

// On-screen keys (tap targets for touch devices)
const keys = new Map<NoteName, HTMLButtonElement>()
for (const name of NOTE_NAMES) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'key'
  btn.textContent = name
  btn.addEventListener('click', () => answer(name))
  keyboardEl.append(btn)
  keys.set(name, btn)
}

/** Light up the key holding the right answer… */
function revealKey(note: StaffNote): void {
  keys.get(note.name)?.classList.add('revealed')
}

/** …and clear it again when the next card starts. */
function clearRevealedKeys(): void {
  for (const btn of keys.values()) btn.classList.remove('revealed')
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
    startCard()
  }
})

startCard()

// ---------------------------------------------------------------------------
// PWA: register the service worker (production builds only)
// ---------------------------------------------------------------------------
if (import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Relative path: registers with the page's own directory as scope, so it
    // works both at a domain root and under a GitHub Pages subpath
    void navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error)
    })
  })
}
