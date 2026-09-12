# 金庫密碼 / The Last Frequency

Route: `/vault` (also `/vault.html`). No backend, microphone, login, external images or fonts.

## Visual direction

The home and play-screen concept was designed and visually reviewed before game implementation in `vault-visual-design.svg`. The implementation uses CSS metal gradients, hinges, engraved rings, low-intensity energy lighting, a pointer-operated wheel and a reduced-motion alternative. Green confirmation sparks, a static red damage warning and an opening door distinguish outcomes without depending on sound alone.

## Rules

- 3 / 5 / 7 / 10 instructions; 75 / 105 / 135 / 180 seconds respectively.
- Instructions are left or right, 1–9 steps. Chinese TTS says only the direction and number, e.g. 「左，七。左，三。右，四。」, at rate 0.65 and pitch 0.82. Device voices can sound different.
- Left is counterclockwise; right is clockwise. One large tick is 18 degrees / one step. Drag the outer dial, use buttons, or use left/right keys with Enter to confirm.
- The signed draft is limited to nine steps in either direction. Opposite-direction movement undoes steps; Clear resets only the current draft. Each instruction must be confirmed separately, even consecutive instructions in the same direction.
- Three shields. Incorrect confirmation consumes one shield and applies an 850ms input cooldown. No answer is revealed.
- Speech completion starts the clock. Replays (remaining instructions only) cost five seconds, at most twice per door; narration itself does not consume time. Default captions appear only during speech. Text fallback is explicit, hides on starting input and halves that door's score.
- Score per door: instructions ×100 + floor(remaining seconds) ×2 + min(streak,10) ×50, halved for text fallback. Incorrect confirmation resets the streak. Next door restores at most one shield and requires a fresh tap for speech.
- Pausing hides the code and stops audio and countdown. Backgrounding pauses automatically. No active-game saves; returning to selection explicitly ends the current run. Only the highest cumulative score for each difficulty is stored locally, independent of other games.

## Audio implementation notes

Speech synthesis is called synchronously in the start/replay/next click handler. A single retained utterance contains all remaining instructions; the game waits for `onend`. Errors and a bounded timeout offer retry or text practice. Cancelled speech callbacks are invalidated across pause, restart and navigation. Mandarin voices are selected with zh-TW preferred, then another zh voice, then platform selection with zh-TW language.

Web Audio uses best-effort `navigator.audioSession.type = 'playback'`, resumes non-running contexts from interactions and never plays home-screen audio automatically. The sound toggle applies to effects only, as stated on-screen.

API reference: [SpeechSynthesisUtterance](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance), [speech cancellation](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/cancel).

## Verification

`node scripts/test-vault.cjs` tests all difficulties, consecutive directions, scoring, shields, timeouts, cooldowns, replay limits, exact pairs of direction/step instructions, engine terminal states, real UI code in a DOM harness, pointer movement, visibility pause, speech success/failure/cancellation and iPad-style interrupted audio startup. It is included in `npm test` / `npm run build`.

Browser QA includes a real three-instruction speech-to-unlock run, home/play/result screens, phone-width layout and browser console checks. Physical iPad TTS voice quality and touch behavior still require user testing; desktop viewport emulation is not a real iPad.
