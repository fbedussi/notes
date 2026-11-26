# Note Flashcards

A minimal, installable PWA for practicing note reading: a random note appears on a
treble-clef staff and you name it by typing its letter before the timer runs out.

Built with **vanilla TypeScript + Vite** — the staff, clef, note heads, stems and
ledger lines are drawn as plain **SVG** (no canvas, no rendering libraries), and all
motion is done with **CSS animations** in a single stylesheet.

## How to play

- A random diatonic note in the range **C4–A5** (treble clef) is shown on the staff
- Press the **letter key A–G** (or tap the on-screen keys) to name it
  - ✅ Correct: **+1 point**
  - ❌ Wrong: **−1 point**
- Each card has a time limit (10 s at level 1); if it runs out you **lose a point**
  and the answer is revealed
- Every time your score reaches a **multiple of 10**, you level up and the time limit
  per card is **reduced by 20%** (L1 10.0 s → L2 8.0 s → L3 6.4 s → …). Levels never
  go back down.

Notes outside the staff (C4 below, A5 above) automatically get ledger lines.

## Getting started

```bash
npm install
npm run dev       # dev server with HMR
npm run build     # typecheck (tsc) + production build into dist/
```

Requires Node.js 22+.
