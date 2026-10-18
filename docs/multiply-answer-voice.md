# Multiplication answer voices

The user selected these synthetic Mandarin previews on 2026-10-18 for 乘法小學堂.

- `assets/multiply-correct-voice-v2.mp3`: “答對了！你真棒！” — requested final wording in `correct-v6-you-are-great-xiaoyi.mp3`, using the approved lively voice and pacing.
- `assets/multiply-wrong-voice-v1.wav`: “喔喔，你答錯了。” — approved `incorrect-v8-connected.wav`, with a slower opening connected directly to the rest of the line.

Both use Microsoft `zh-CN-XiaoyiNeural`, generated through edge-tts 7.3.1. The correct line uses +14% rate and +4 Hz pitch. The wrong opening uses −28% rate and −12 Hz pitch; its ending uses +5% rate and natural pitch. The two decoded segments were joined with an 8 ms crossfade after trimming boundary silence, with no inserted pause. The shipped files are copies of the selected previews.

Audio plays only after an explicit correct/wrong answer check, including story-formula checks. Incomplete input is quiet. Mute, hidden pages, mode changes, next questions, and leaving the page stop playback. New feedback replaces the prior clip. Existing synthesized tones remain the fallback if the files cannot play; no runtime speech service is required.
