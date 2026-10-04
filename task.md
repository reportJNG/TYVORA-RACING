Exactly. **Before cars, world, effects, leaderboard, or anything else, the typing experience needs to become exceptional.**

The important architectural change is to separate **sentence/passage content** from the **typing engine** itself. The sentence engine decides *what the player should type*; the typing engine decides *what the player actually typed and whether it is correct*; the visual component only presents that state as quickly and clearly as possible.

Use this as the next AGY instruction:

# TypeRace — PRIORITY 0: Perfect the Typing Experience

This task takes priority over everything else.

**Do not spend time upgrading the cars, 3D world, showroom, leaderboard, profile, settings, or other visual features until the typing system and typing experience are genuinely excellent.**

The heart of TypeRace is:

> **The player looks at the words, types them quickly, sees exactly where they are, and feels the car respond instantly.**

If the typing experience is slow, confusing, visually cluttered, or difficult to follow, the entire game fails no matter how good the 3D graphics are.

The typing system must therefore be treated as its own serious game subsystem.

---

# 1. SEPARATE THE SENTENCE ENGINE FROM THE TYPING ENGINE

This is a required architectural change.

Do NOT treat:

```text
passage text
+
keyboard handling
+
character validation
+
typing UI
```

as one system.

Split them.

The architecture should become:

```text
                    SENTENCE / PASSAGE ENGINE
                              │
                              ↓
                     Target Passage
                              │
                              ↓
                       TYPING ENGINE
                              │
                 ┌────────────┼────────────┐
                 ↓            ↓            ↓
              Input        Evaluation    Progress
                 │            │            │
                 └────────────┼────────────┘
                              ↓
                       TYPING VIEW MODEL
                              │
                              ↓
                         TYPING UI
```

Each layer has one responsibility.

---

# 2. SENTENCE / PASSAGE ENGINE

Create a dedicated sentence/passage/content engine.

This system is responsible for:

* choosing text
* preparing race passages
* difficulty
* round progression
* word grouping
* passage metadata
* text normalization
* punctuation rules
* vocabulary/difficulty balancing
* ensuring the passage is long enough for the race
* preventing awkward or duplicated content

It should NOT handle:

* keyboard events
* Backspace
* character correctness
* WPM calculation
* race speed
* visual rendering

It only answers:

> **What should the player type?**

---

# 3. PASSAGE MODEL

Define a clean passage model.

Conceptually:

```text
Passage
├── id
├── text
├── words
├── difficulty
├── round
├── estimatedDuration
└── metadata
```

The exact structure should follow the existing codebase.

The important thing is that passage data is independent from the typing implementation.

---

# 4. WORD WINDOW / ROLLING TEXT SYSTEM

This is a major UX improvement.

Do NOT force the player to stare at a giant paragraph.

The player should see a **small rolling window of upcoming words**.

For example:

```text
THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG
```

Instead of displaying everything at once, show approximately:

```text
THE QUICK BROWN FOX JUMPS
```

As the player progresses, advance the window:

```text
QUICK BROWN FOX JUMPS OVER
```

then:

```text
BROWN FOX JUMPS OVER THE
```

then:

```text
FOX JUMPS OVER THE LAZY
```

and so on.

The player should always have a clear view of:

```text
current word
+
a few words ahead
```

without visual overload.

---

# 5. THE WINDOW MUST FEEL CONTINUOUS

Do NOT make the text suddenly disappear and get replaced with another block.

It should feel like the text is **flowing forward**.

Conceptually:

```text
THE QUICK BROWN FOX JUMPS
          ↓
           QU﻿ICK BROWN FOX JUMPS OVER
```

Use a subtle transition as words leave and upcoming words enter.

The transition should be:

* fast
* smooth
* predictable
* subtle
* never distracting

The player must never lose their typing position because the visual window moved.

---

# 6. SHOW ENOUGH FUTURE TEXT TO TYPE FAST

The player must know what is coming.

A major goal is:

> **The player's eyes should be able to stay slightly ahead of their fingers.**

Do not show only the current word.

Do not show a giant wall of text.

The target should generally expose approximately the next **4–6 words**, tuned based on viewport size.

Example:

```text
CURRENT      UPCOMING

TYPE         FAST CLEAN RACING GAMES
^^^^
```

The player can visually prepare the next words while typing the current one.

This is important because the game rewards fast typing.

---

# 7. RESPONSIVE WORD WINDOW

The word window must adapt to the available width.

Desktop might show:

```text
THE QUICK BROWN FOX JUMPS OVER
```

while smaller screens might show:

```text
THE QUICK BROWN FOX JUMPS
```

Do not force fixed widths that cause:

* ugly wrapping
* clipping
* horizontal overflow
* unpredictable line breaks

The number of words should be determined intelligently.

---

# 8. DO NOT BREAK THE WORD IN THE MIDDLE VISUALLY

The player should primarily perceive **words**, not an arbitrary stream of characters.

The system can internally evaluate every character.

The UI should organize those characters into word units.

Example:

```text
THE     QUICK     BROWN     FOX     JUMPS
```

This improves scanning and anticipation.

---

# 9. TYPING ENGINE — SINGLE SOURCE OF TRUTH

The typing engine must own:

* current input
* cursor position
* character evaluation
* correct characters
* incorrect characters
* Backspace
* correction
* mistake accounting
* completion
* progress
* WPM
* accuracy-related state

It should NOT own:

* DOM layout
* CSS
* Three.js
* React component tree
* visual animation

It is gameplay logic.

---

# 10. PERFECT CHARACTER EVALUATION

The evaluation must remain independent by position.

For:

```text
Target:
HELLO

Input:
HELOO
```

the state is:

```text
H ✓
E ✓
L ✓
O ✕
O ✓
```

Never allow a mistake to cascade.

There is no:

```text
first error = everything after it is wrong
```

That behavior is forbidden.

---

# 11. BACKSPACE MUST BE FIRST-CLASS

Backspace needs to be treated as a fundamental typing action.

Example:

```text
Target:
HELLO

Input:
HELOO
```

Backspace:

```text
HELO
```

Backspace:

```text
HEL
```

Then:

```text
L
O
```

produces:

```text
HELLO
```

The player has successfully recovered.

Backspace itself is:

> **a correction/navigation operation**

not an additional typo.

---

# 12. CORRECTION SEMANTICS MUST BE FORMALLY DEFINED

Do not use vague wording.

Define precisely:

```text
typed buffer
cursor index
character state
mistake state
correction event
final accuracy
```

Determine what happens when:

* the player types a wrong character
* the player types another wrong character
* the player presses Backspace
* the player corrects an earlier mistake
* the player repeatedly presses Backspace
* the player reaches the end
* the player changes a previously incorrect position to correct

Every case needs deterministic behavior.

---

# 13. DO NOT MAKE THE PLAYER FIGHT THE INPUT SYSTEM

Keyboard input needs to feel immediate.

A fast typist should be able to type extremely quickly without:

* dropped keys
* delayed rendering
* duplicated keys
* caret jumping
* visible lag
* race UI freezing
* text reflow glitches

The typing system should be designed around **high-frequency input**.

---

# 14. TYPING INPUT ARCHITECTURE

Use:

```text
Keyboard Event
      ↓
Input Controller
      ↓
Typing Engine
      ↓
Minimal State Update
      ↓
Typing Renderer
```

Do not do:

```text
Keyboard Event
↓
React parent setState
↓
entire race re-render
↓
Three.js scene update
↓
all HUD components update
↓
typing text rebuild
```

Every keystroke must have a minimal update path.

---

# 15. TYPING COMPONENT MUST BE EXTREMELY LIGHTWEIGHT

This component is performance-critical.

It should render only the text state that actually changed.

Avoid:

* rebuilding the entire passage on every key
* expensive measurements on every key
* unnecessary DOM creation
* giant React trees for individual characters
* expensive animation libraries for every keystroke
* layout calculations on every key
* unnecessary state propagation upward

The typing component must remain responsive at:

```text
80 WPM
100 WPM
120 WPM
140+ WPM
```

where physically possible.

---

# 16. USE WORD BLOCKS, NOT A GIANT TEXT TREE

Structure the visual component more intelligently.

Conceptually:

```text
TypingStream
├── WordBlock
│   ├── Character
│   ├── Character
│   └── Character
│
├── WordBlock
├── WordBlock
├── WordBlock
└── WordBlock
```

But avoid creating massive numbers of expensive reactive character components.

Use lightweight rendering and update only the active region.

The goal is:

> **The player sees a clean word stream, while the engine still evaluates exact character positions.**

---

# 17. CURRENT CHARACTER MUST BE OBVIOUS

The player must never wonder:

> “Where exactly do I type?”

The current position should be unmistakable.

Possible visual language:

```text
THE QUICK BROWN FOX
    ^
```

or a subtle animated caret/highlight.

Use a clean indicator rather than a giant flashing effect.

The current character can have:

* thin underline
* accent glow
* caret
* subtle background
* small positional animation

But never sacrifice readability.

---

# 18. CURRENT WORD SHOULD HAVE HIGHEST PRIORITY

Example:

```text
THE   QUICK   BROWN   FOX   JUMPS
      ↑
```

The current word should receive slightly more emphasis.

Upcoming words should remain clearly readable but visually secondary.

Completed words should fade into a quieter state.

This gives the eye a natural hierarchy:

```text
completed
   ↓
current
   ↓
next
   ↓
future
```

---

# 19. SMOOTH WORD TRANSITIONS

When a word is completed, do not violently rearrange the entire component.

Instead:

```text
completed word
   ↓
subtle fade/slide
   ↓
new future word enters
```

The transition duration should be short.

Around:

```text
100–220ms
```

can be tested, but do not hardcode this blindly.

Tune it using actual gameplay.

The animation must never delay input.

---

# 20. NO ANIMATION SHOULD BLOCK TYPING

This rule is extremely important.

Animations are presentation only.

Never:

```text
word transition running
↓
wait
↓
accept next key
```

Input always wins.

If the player types faster than the animation:

> the animation should simply adapt.

The game never waits for visual effects.

---

# 21. VISUAL FEEDBACK FOR CORRECT CHARACTERS

Correct typing should feel satisfying without being noisy.

Use subtle visual feedback:

```text
correct
→ crisp text
→ tiny movement or brightness response
```

Do not animate every correct character with huge scaling or glowing explosions.

At 120 WPM that would look ridiculous and destroy performance.

---

# 22. VISUAL FEEDBACK FOR MISTAKES

Mistakes should be clear immediately.

Example:

```text
HELLO
   O
   ↑
 incorrect
```

Use:

* restrained red
* underline
* tiny flash
* immediate error state

No massive screen shake.

No huge popup.

No blocking modal.

The player should instantly continue typing or press Backspace.

---

# 23. TYPO RECOVERY VISUAL

When the player presses Backspace and fixes a mistake:

```text
incorrect
   ↓
Backspace
   ↓
pending
   ↓
correct
```

The visual state should reflect that transition naturally.

The old error should disappear.

Do not leave stale red markers behind.

---

# 24. PROGRESSIVE TEXT FLOW

The typing area should feel almost like the words are moving along a race track.

Potential visual direction:

```text
COMPLETED      CURRENT       UPCOMING

THE QUICK      BROWN         FOX JUMPS OVER
quiet          highlighted   readable
```

As the user progresses, the stream advances.

It should give the impression of **momentum**.

This is especially appropriate for TypeRace.

---

# 25. TYPING UI SHOULD BE DESIGNED FOR THE EYES

Ask this question during every iteration:

> Can a fast typist glance at the screen and instantly know what comes next?

The answer must be yes.

The UI should have:

* clear word separation
* strong current position
* readable upcoming text
* stable layout
* no unnecessary information
* no distracting animations

---

# 26. REMOVE TYPING CLUTTER

The typing area should NOT contain:

```text
giant WPM cards
giant accuracy cards
multiple badges
huge borders
too many colors
unnecessary instructions
large labels
```

The typing stream itself should occupy the attention.

Telemetry can stay nearby but secondary.

---

# 27. TYPING COMPONENT LAYOUT

Aim for something conceptually like:

```text
┌─────────────────────────────────────────────────┐
│                                                 │
│    the quick     BROWN     fox jumps over       │
│                 ^^^^^^^                         │
│                                                 │
│        current word is unmistakable             │
│                                                 │
└─────────────────────────────────────────────────┘
```

The final visual treatment should be more refined than this ASCII example.

The important thing is hierarchy.

---

# 28. DO NOT PUT THE USER'S FULL PASSAGE IN A TEXTAREA

The player should not feel like they are using a normal form.

The typing experience should be game-specific.

Capture keyboard input through the dedicated input system and render the passage visually.

The browser input implementation may use a hidden/controlled input mechanism where appropriate for accessibility, but the visible experience must remain the custom TypeRace typing interface.

---

# 29. SENTENCE ENGINE + ROUND ENGINE

The sentence engine should provide round content.

Example:

```text
Round 1
90–110 characters

Round 2
115–130 characters

Round 3
130–160 characters
```

But the exact values should be configurable.

The passage engine should expose content without knowing anything about car physics.

---

# 30. PASSAGE DIFFICULTY

Create a controlled difficulty model.

Possible variables:

```text
word length
vocabulary difficulty
punctuation
capitalization
word frequency
character combinations
```

Do not make text harder simply by making it random.

The player should feel a logical progression.

---

# 31. PASSAGE QUALITY

This is important.

Generated text must feel like real language.

Avoid:

```text
random word salad
awkward combinations
unnecessary punctuation
uncomfortable sentence structure
repeated phrases
obvious machine-generated nonsense
```

The player spends the entire race looking at this text.

Bad text directly damages gameplay.

---

# 32. EYE-LEAD DESIGN

Optimize the typing stream so the player can read slightly ahead.

The current word should be obvious.

The next 2–4 words should be immediately available.

Further words can be lower emphasis.

This creates:

```text
eyes
 ↓
next word

fingers
 ↓
current word
```

This is how the interface helps players type faster without directly changing the game rules.

---

# 33. RESPONSIVE TYPOGRAPHY

Use a typography system optimized for code-like readability.

The typing font should prioritize:

* character distinction
* consistent spacing
* high readability
* clear punctuation
* strong numeral visibility

Test:

```text
l
I
1

O
0

'
`
"
```

because ambiguous characters can hurt high-speed typing.

---

# 34. NO LAYOUT SHIFT

The typing area must not jump vertically or horizontally as words change.

Prevent:

* height changes
* line-wrap jumps
* container resizing
* font metric changes
* scrollbar appearance
* unexpected horizontal movement

The player's eyes should stay anchored.

---

# 35. CACHING / PRECOMPUTATION

Do expensive passage processing before the race begins.

Prepare:

```text
word boundaries
character offsets
word positions
display windows
passage metadata
```

before active typing where possible.

During the race, favor simple operations.

---

# 36. PRECOMPUTE CHARACTER METADATA

Do not repeatedly calculate:

```text
"where is this character?"
"which word?"
"which position?"
```

on every keypress if those relationships can be prepared once.

Build a passage map:

```text
characterIndex
wordIndex
wordStart
wordEnd
```

Then runtime operations can remain extremely cheap.

---

# 37. TYPING ENGINE API

Design a minimal, clean API.

Conceptually:

```text
createTypingSession(passage)

session.handleCharacter(char)
session.handleBackspace()
session.handleWordBackspace()

session.getState()
session.getProgress()
session.getWpm()
session.getAccuracy()
session.isComplete()
```

The actual API should follow the repository's architecture.

The important rule is:

> **Simple public contract, complex internal correctness.**

---

# 38. TYPING ENGINE MUST BE PURE WHERE POSSIBLE

Keep the core typing logic deterministic and testable.

Given:

```text
initial state
+
sequence of input events
```

the result should always be the same.

This is essential for:

* race consistency
* replay verification
* testing
* debugging
* anti-cheat

---

# 39. INPUT EVENTS SHOULD BE EXPLICIT

Represent:

```text
character
backspace
wordBackspace
```

as explicit actions/events.

Do not hide typing behavior inside random DOM callbacks.

This will help replay verification.

---

# 40. WPM SHOULD NOT JITTER

Live WPM must be readable and stable.

Do not display a wildly changing number every keypress.

Use an appropriate rolling measurement.

The visual WPM can be smoothed.

The authoritative race calculation remains in the simulation.

Do not let visual smoothing alter gameplay physics.

---

# 41. ACCURACY SHOULD BE CLEAR

Accuracy should immediately communicate the player's performance.

Example:

```text
98.4%
```

Do not display five different accuracy values.

Use one clear metric.

---

# 42. TYPING + CAR MUST REMAIN DECOUPLED

The typing engine should produce gameplay information.

The physics system interprets that information.

The typing component visualizes it.

Architecture:

```text
Typing Engine
      ↓
typing performance
      ↓
Race Simulation
      ↓
vehicle speed
      ↓
3D renderer
```

Never let the UI directly decide the car speed.

---

# 43. ZERO-LAG RULE

For every keystroke:

```text
physical key
↓
input recognized
↓
typing state updated
↓
visual feedback
```

should feel immediate.

There should not be a noticeable:

```text
keypress
...
...
UI catches up
```

delay.

---

# 44. TESTING — TYPING FIRST

Before touching the rest of the game, create exhaustive tests.

At minimum:

### Exact typing

```text
HELLO → HELLO
```

### Independent mistake

```text
HELLO → HELOO
```

Expected:

```text
✓ ✓ ✓ ✕ ✓
```

### Backspace

```text
HELOO
↓ backspace
HELO
↓ backspace
HEL
```

### Correction

```text
HEL
↓
HELLO
```

### Multiple mistakes

Test several wrong characters in different positions.

### Wrong → Backspace → Correct

Ensure the correction is represented correctly.

### Word backspace

Test Ctrl+Backspace / Alt+Backspace according to the final supported behavior.

### High-speed input

Simulate extremely fast key sequences.

### Long passage

Ensure the UI remains smooth.

### Word window movement

Verify the next words enter correctly.

### End of passage

Verify completion exactly.

---

# 45. PERFORMANCE TESTING

Measure the typing component separately.

Do NOT assume it is fast.

Test:

```text
50 WPM
80 WPM
100 WPM
120 WPM
140+ WPM
```

Observe:

* input latency
* dropped keystrokes
* frame rate
* render count
* DOM updates
* memory allocations
* layout recalculation

The typing UI must remain smooth.

---

# 46. React RENDER PROFILING

Use actual profiling tools.

Determine:

* which component rerenders on each key
* why it rerenders
* how much work happens
* whether unrelated components rerender

The desired result is something close to:

```text
KEYPRESS
  ↓
Typing state
  ↓
small typing-region update
```

not:

```text
KEYPRESS
  ↓
entire RaceScreen
  ↓
entire HUD
  ↓
entire 3D tree
  ↓
all stats
```

---

# 47. DO NOT OPTIMIZE WITH COMPLEXITY FOR NO REASON

The architecture should be fast because it is well designed.

Do not introduce obscure optimization tricks that make the code impossible to maintain.

Prefer:

* clear data ownership
* stable references
* isolated state
* memoization where useful
* precomputation
* small render surfaces
* efficient DOM structure

---

# 48. ANIMATION SYSTEM

The typing UI should have polished, subtle motion.

Possible animations:

### Current character

Subtle caret pulse.

### Correct character

Tiny brightness transition.

### Mistake

Short red emphasis.

### Completed word

Very short fade/slide away.

### Incoming word

Very short fade/slide in.

All animation must be:

* fast
* smooth
* low amplitude
* interruptible
* non-blocking

---

# 49. REDUCED MOTION

When reduced motion is enabled:

* remove sliding transitions
* remove unnecessary pulses
* keep state changes immediate
* preserve readability

The typing functionality must remain identical.

---

# 50. VISUAL TARGET

The typing component should feel like it belongs in a premium racing game.

Not:

```text
typing practice website
```

Not:

```text
textarea
```

Not:

```text
giant dashboard card
```

Instead:

```text
race cockpit
+
clean kinetic text
+
precise focus
+
excellent typography
+
minimal UI
```

---

# 51. THE PLAYER SHOULD ALWAYS KNOW THREE THINGS

At any moment, the player must instantly understand:

### 1. What am I typing now?

### 2. What comes next?

### 3. Am I typing correctly?

If any of these answers are unclear, the UI is not finished.

---

# 52. TYPING ENGINE FIRST — DEVELOPMENT ORDER

Do this exact sequence:

```text
1. Audit current typing implementation
2. Audit current passage/sentence implementation
3. Separate passage engine
4. Separate typing engine
5. Formalize character evaluation
6. Fix Backspace
7. Fix correction semantics
8. Add exhaustive typing tests
9. Build word-window model
10. Build optimized typing renderer
11. Add smooth word transitions
12. Profile high-WPM typing
13. Remove render churn
14. Verify race integration
15. Verify replay compatibility
16. Only then continue to 3D/UI redesign
```

Do NOT start phase 16 before 1–15 are solid.

---

# 53. DEFINITION OF PERFECTION

The typing system is considered complete only when:

```text
✓ Every character position evaluates independently
✓ Mistakes do not cascade
✓ Backspace feels natural
✓ Mistakes can always be corrected
✓ Backspace does not create fake mistakes
✓ Corrected text becomes visually correct
✓ Current position is unmistakable
✓ Next words are always visible
✓ Approximately 4–6 words are available ahead
✓ Words transition smoothly
✓ No layout jumping occurs
✓ High-speed typing remains responsive
✓ No dropped keyboard events
✓ No typing-induced race-screen rerender storm
✓ WPM is stable and readable
✓ Accuracy is correct
✓ Passage progression is deterministic
✓ Replay verification remains deterministic
✓ Typing UI never blocks input
✓ Animations never delay gameplay
✓ Reduced motion works
✓ Long passages remain performant
✓ Race speed reacts immediately
✓ Cars continue moving
✓ No active race reaches zero speed from typing mistakes
```

---

# 54. FINAL INSTRUCTION

**Treat this as the most important system in TypeRace.**

Do not say:

> “The typing works.”

That is not enough.

The standard is:

> **A fast typist should be able to look at the next few words, understand exactly where they are, type continuously, correct mistakes naturally, and never feel the UI getting in their way.**

The typing engine should disappear into the experience.

The user should stop thinking about the interface and simply think:

> **“I need to type faster.”**

That is when TypeRace is working.

This is the part I'd make **Priority 0**. Once AGY finishes this, the next work on the cars/world will be much safer because the race renderer can simply consume a clean typing-performance stream instead of being tangled with the typing UI.

