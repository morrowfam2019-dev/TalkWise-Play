# Mini Games — Launch Collection 01

Six new TalkWise Play games (GAME-003 … GAME-008) on one shared framework.

> Restore point: [`docs/RESTORE-POINT-MINIGAMES-01.md`](./RESTORE-POINT-MINIGAMES-01.md)
> Architecture: [`docs/ARCHITECTURE.md` → Mini Games](./ARCHITECTURE.md#mini-games--launch-collection-01)

---

## The six games

| Id | Name | Route | Session | Core mechanic | Speech cadence |
| --- | --- | --- | --- | --- | --- |
| GAME-003 | Bubble Blast | `/games/bubble-blast` | 30 sec | Tap-to-pop arcade field | One gate, then play |
| GAME-004 | Sound Match | `/games/sound-match` | 8 rounds | Drag into the backpack | Every round |
| GAME-005 | Colour & Shape Hunt | `/games/color-shape-hunt` | 8 finds | Search a scene and tap | Finds 1, 4, 7 |
| GAME-006 | Guess the Sound | `/games/guess-the-sound` | 8 sounds | Listen and choose | Rounds 1, 4, 7 |
| GAME-007 | Action Dash | `/games/action-dash` | 8 actions | Speech drives the animation | Every round |
| GAME-008 | Story Builder | `/games/story-builder` | 4 scenes | Build a sentence from parts | Every scene |

Each is separately registered, routed, and saved. None is a mode inside a
wrapper game.

## Learning modes

Every game runs all three tiers:

| Tier | What it asks | Bubble Blast | Story Builder |
| --- | --- | --- | --- |
| Beginner | a sound / one concept | "Pop every M" | "cat" |
| Intermediate | a word / short phrase | "Pop things that start with M" | "silly dog" |
| Expert | a sentence / a direction | "Pop what belongs in: The dog is running." | "The dog is running in the park." |

## Content packs

Nine reusable packs, 152 items, one dataset feeding every compatible game.

Animal World · Colours & Shapes · Food Fun · Things That Go · Action Time ·
My Body · Around the House · Outside Adventures · Feelings

## Persistence namespaces

```
games["GAME-003"] … games["GAME-008"]
  records      keyed `${packId}:${level}` → bestScore, bestAccuracy, bestCombo, plays
  collected    game-defined ids (stories built, objects found)
  achievements
  dailyPlays   today's session count, for the coin decay
  lastSetup    pack + level to re-offer
  totalSessions
```

Platform-wide and **unchanged**: profile, wallet, streak, entitlement.

## Coin formula

```
speechParticipation = 3   performance = min(10, floor(score / pointsPerCoin))
personalBest        = 3   levelBonus  = beginner 0 | intermediate 1 | expert 2

base  = min(15, sum)      coins = max(1, round(base * dailyMultiplier(sessionsToday)))
dailyMultiplier(n) = 1.00 (n<3) | 0.50 (n<8) | 0.25 (n≥8)
```

Per-game `pointsPerCoin`: Bubble Blast 220, Story Builder 60, everything
else 90 — tuned so a strong session of any game earns comparably.

**Anti-farming.** A session under 8 seconds, or with zero correct actions,
pays only its floor coin and does **not** advance the daily counter. The
performance term is capped before the multiplier.

Measured end-to-end: five consecutive Story Builder sessions paid
15, 13, 13, 7, 7 — full rate for three, then half, as documented.

---

# FOUNDER iPHONE TEST CHECKLIST

Open TalkWise Play in Whop on your iPhone, tap **OPEN TALKWISE PLAY**, and
work through this in your own browser (Safari). The mini-games need the
microphone, so they need the external browser exactly as the big games do.

## A. Before anything else — the existing games still work

- [ ] **Speech Adventures** opens, all three stages load, a word adventure
      plays through and banks coins as before.
- [ ] **Speech Basketball** opens, Shootout and Time Attack play through and
      bank coins as before.
- [ ] Both **shops** open; your owned items are still owned and still
      equipped. Nothing new has appeared in either wardrobe.
- [ ] Your **coin total and streak** are exactly what they were.

> If any of these are wrong, stop and roll back — see the restore point doc.

## B. The library

- [ ] The home screen now shows **two shelves**: Featured (2 games) and
      Quick Play (6 games).
- [ ] All six new cards have their own picture — you can tell the games
      apart without reading the titles.
- [ ] Each Quick Play card shows a session length.
- [ ] Tapping each of the six reaches its setup screen.

## C. Each mini-game — the shared checks

For **every** one of the six:

- [ ] The setup screen offers packs and levels, and your last choice is
      remembered next time.
- [ ] **PLAY** is reachable with your thumb without scrolling.
- [ ] Miss Maya's voice works — tap the 🔊 button.
- [ ] The microphone prompt appears once, and after allowing it the
      "Listening…" state shows a moving sound wave.
- [ ] **"I SAID IT!" is on screen from the first second** — you never have
      to fail to get past a speech moment.
- [ ] The game is understandable within a few seconds without instructions.
- [ ] The **✕** button asks before quitting.
- [ ] Results show your score and coins, and **PLAY AGAIN** works.
- [ ] Coins appear in the header when you get back to the library.
- [ ] Your score is remembered — replay and the setup screen shows a best.

## D. Bubble Blast (GAME-003)

- [ ] The 30-second clock runs and the last five seconds pip.
- [ ] Bubbles float up smoothly — no stutter late in the round.
- [ ] Tapping a correct bubble pops it with sparkles and a rising sound.
- [ ] Tapping a wrong bubble pops it gently and **takes nothing away**.
- [ ] **Rest a finger on a bubble and hold it for several seconds** — nothing
      pops, and the score does not move.
- [ ] **Press a bubble, drag your finger away, and let go** — nothing pops.
- [ ] Five in a row lights a power-up badge.
- [ ] Try all three levels: letters, pictures, and the sentence round.

## E. Sound Match (GAME-004)

- [ ] Dragging a card lifts it and it follows your finger.
- [ ] Dropping it on the backpack snaps it in with a celebration.
- [ ] Dropping it **anywhere else** puts it back and costs nothing.
- [ ] **Tapping a card without dragging selects it but does not submit it** —
      then tapping the backpack places it.
- [ ] Wrong card in the backpack comes straight back out, gently.
- [ ] Eight rounds, then results.

## F. Colour & Shape Hunt (GAME-005)

- [ ] Every object is fully on screen — nothing is cut off at an edge.
- [ ] Objects are big enough to tap comfortably.
- [ ] Miss Maya's instruction plays, and the 🔊 button replays it.
- [ ] There is **exactly one** right answer for each instruction.
- [ ] The right object jumps and gets a star; wrong taps do nothing harsh.
- [ ] At Expert the instruction has two parts ("the small blue circle next
      to the tree") and the position is actually right.
- [ ] The speech moment appears on the 1st, 4th and 7th find only.

## G. Guess the Sound (GAME-006)

- [ ] The sound plays on its own when a round starts.
- [ ] The big **Play again** button replays it.
- [ ] **Mash the replay button** — you hear one clean sound, not six overlapping.
- [ ] Sounds are clearly distinguishable from each other.
- [ ] The right answer reveals and animates; Miss Maya names it.
- [ ] At Beginner the three choices are obviously different kinds of thing.
- [ ] At Expert there are four choices and they are all similar.

## H. Action Dash (GAME-007)

- [ ] TJ appears and idles.
- [ ] Picking the right action opens the speech moment.
- [ ] **Saying the word makes TJ perform it** — the animation matches the verb.
- [ ] TJ performs even if you tap "I SAID IT!" instead of speaking.
- [ ] A power-up puts an accessory above TJ's head.

## I. Story Builder (GAME-008)

- [ ] Choices appear one slot at a time and the sentence grows visibly.
- [ ] At Expert the finished sentence reads properly
      ("The dog is running in the park.").
- [ ] Miss Maya reads back **your** sentence.
- [ ] The scene celebrates after you say it.
- [ ] Four scenes, then results, and the results name how many stories you
      built.

## J. Economy and anti-farming

- [ ] Play the **same** mini-game four times in a row. The fourth round pays
      noticeably fewer coins than the first — this is intentional.
- [ ] Start a mini-game and quit within a few seconds. It pays 1 coin and
      does **not** use up one of your full-rate sessions.
- [ ] Beating your own best score shows a "New personal best!" ribbon and an
      extra coin bonus.

## K. Platform and security

- [ ] Switch child profiles on the home screen, play a mini-game, and switch
      back — each child's scores are their own.
- [ ] Close Safari, reopen from Whop, and your mini-game bests are still there.
- [ ] Every mini-game returns cleanly to the library via **Back to TalkWise Play**.
- [ ] Open a mini-game URL directly in a **private window** with no session —
      you land on the membership screen, not the game.
- [ ] Try it on an iPad too.

## L. Report anything that

- feels slow, stuttery, or hot on the phone,
- is hard for a child to tap,
- has words a pre-K child would not understand,
- says anything that reads as failure,
- or just is not fun.

---

## Known limitations

1. **Speech is recorded-only, so most of it is currently silent.** Browser
   text-to-speech was removed entirely after founder testing: it read as a
   robot, and in a speech-practice app whatever comes out of the speaker is
   the target a child imitates. The rule is now Miss Maya's real voice or
   nothing, and nothing is ever narrated automatically.

   Recorded today: **35 words and the 7 Beginner sounds.** Not recorded: the
   152 mini-game pack words, every instruction line ("Find something blue"),
   every reveal, and every sentence. Where there is no recording the UI
   hides the speaker button rather than offering a silent one — so several
   mini-games currently show Miss Maya's line as text with no 🔊 at all.

   **This is the single highest-value thing to fix next**, and it is a
   recording session, not code: drop mp3s into `public/audio/maya/`
   (words), `sounds/` or `sentences/`, run `npm run gen:maya-clips`, and the
   buttons appear on their own. Sentence files are named by slug —
   "I see the big moon." → `i-see-the-big-moon.mp3`.

2. **Guess the Sound's audio is deliberately stylised.** These are cartoon
   impressions synthesised from oscillators, not field recordings. That is
   what makes the "no copyrighted sounds" test true by construction, but a
   few (wind, rain, thunder) are more suggestive than recognisable in
   isolation — they work because the choices on screen frame them.

3. **Emoji artwork is the content stand-in** for the objects inside the
   games (bubbles, cards, scene objects), as it is throughout the platform.
   The `ContentItem.glyph` field is the seam for replacing them.

   Card art is the founder-approved TJ cover set. In-game TJ is drawn as
   vector in his approved colours, because he has to animate per action
   verb; a transparent photographic render of him exists in Higgsfield
   (element `tj-talkwise-play`) and can be swapped in by saving it as
   `public/characters/tj.png` and flipping `TJ_PHOTO` in
   `src/minigames/ui/TJ.tsx`.

4. **Accuracy in Story Builder is always 100%.** It has no wrong actions to
   count, by design. It is reported honestly rather than hidden.

5. **Analytics events are emitted into a no-op sink.** Nothing is recorded
   anywhere yet. Wiring a transport is `setAnalyticsSink`.

6. **The daily coin counter is per mini-game, not per collection.** Three
   full-rate sessions of Bubble Blast *and* three of Sound Match are both
   available in one day. That is deliberate — playing six different games is
   the behaviour worth rewarding — but it means a determined day across all
   six earns roughly 250–300 coins. Worth watching against real usage.

7. **No pack/level combination is hidden when a pack is thin.** Sound Match
   at Beginner and Guess the Sound at Expert top up their choices from the
   whole library rather than refusing to run. The target still comes from
   the chosen pack.

8. **Power-ups are visual only.** They do not change scoring, timing or
   difficulty. Making them mechanically meaningful is a design decision, not
   an oversight.
