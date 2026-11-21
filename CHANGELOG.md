# Changelog

One short entry per change: what you asked for and what changed. Newest first.
Versions match the Android app (Settings → Apps → Learning Space).

**How to add an entry** (every chat that changes the app does this):

```
## 0.x.y · YYYY-MM-DD
- Asked: what you asked for, in one line
- Changed: what was built or fixed, in one or two lines
```

---

## 0.36.1 · 2026-11-21
- Asked: fix Find by meaning for older saves.
- Changed: older captures without a why or intent can be searched alongside new saves. Search validation errors show a short message.

## 0.36.0 · 2026-11-21
- Asked: remember whatever I save, with an optional "why I'm saving this"; save screenshots and links from anywhere on my Galaxy S25, including from a shortcut.
- Changed:
  - **Why, intent, reminder:** every save can carry an optional "why", a one-tap intent (Read later, Watch later, Try this, Buy, For interview, For the shop, For work, Idea; your most used first) and "remind me" (Tonight, Tomorrow, This weekend, Next week). Due saves show under **Saved for today** on Today, with your own words.
  - **Screenshots:** share any image or screenshot to Learning Space. It's resized and kept privately on the phone. With your AI key, AI reads it: a title, a one-line gist, the text and any links (a link it finds is added to the save).
  - A new screenshot stays in the share queue even if its attached link was saved before.
  - **Quick save:** a new "Quick save" launcher entry for the Side key's double-press, plus a Quick Settings tile. Either one attaches the link you copied in the last 15 minutes and the screenshot you took in the last 10 minutes. With nothing to attach, it opens a blank note. Set it up in Profile → Quick save.
  - **Find it again:** search the Inbox by title, text, your why, intent or screenshot text, or tap **Find by meaning** to let AI match what you describe ("the bathtub for the small bathroom").
  - Themes now use your why, intent and screenshot text. New inbox fields are optional, so older captures, sync and coach proposals are unchanged.

## 0.35.0 · 2026-11-20
- Asked: make the app usable; club what I share and jot down (bookmarks and thoughts) together using AI.
- Changed: Inbox has a new **Themes** tab. One tap groups everything you've saved (inbox captures plus unread readings) into a few named themes. Each theme says what connects its items and gives one next step. With your OpenAI key, AI does the grouping; without it, or offline, it groups on the phone by topic (system design, career, coding practice, AI, frontend, and your reading categories). Themes are kept until you regroup, the view shows how many new saves arrived since, and tapping an item opens the capture or the link.

## 0.34.0 · 2026-11-19
- Asked: have AI Coach notice when phone use clusters, which apps account for usage, and ask what drives the pattern.
- Changed: Android summarizes recurring local-time windows and top foreground-app shares across the last seven completed days. See the pattern under Progress → Screen time and opt in to share it with AI chat and daily reviews. App names have their own switch.

## 0.33.0 · 2026-11-19
- Asked: make Library, Inbox and Settings less overwhelming.
- Changed: Library keeps search and one add action up front, with filters and priority ordering in a sheet. Inbox opens captures for review from a compact queue. Settings groups controls under expandable categories.

## 0.32.0 · 2026-11-19
- Asked: fix four gaps (large text, dark Coach contrast, small touch targets, competing focal points), make the Library better with the design skills, and show the app version in Profile.
- Changed:
  - **Large text:** at Android Font size 200% the app reflows instead of clipping. The header wraps, the tab bar goes icon-only (names kept for screen readers), the Today ring swaps its curved labels for a plain caption, the pills stack, and Progress tiles stack. Android tells the app its font scale through a new `textScale()` bridge.
  - **Contrast:** dark Coach's selected "Smart" goes from 1.85:1 to readable on-container ink. Today's pill units ("of 45 min", "days") go from 3.7:1 to full ink.
  - **Touch targets:** 44px for every control: Personal/Work, profile, filters, range buttons, Coach mode and context, brief buttons, to-do add, inbox tabs, tick and Read ASAP. The page dots get tall hit areas.
  - **Focus:** on Today, Start is the one filled action and Log is outlined. Plan my week and the brief's Start are tonal. The planning card has no gradient. Progress shows the 7-day total once, in the chart. The header reads "Learning and screen time", and the second tile is Best streak.
  - **Library:** grouped into In progress, Not started and Finished (folded). The edit pencil left every row (edit is in the detail sheet). "Add to library" shows only for a small library. The header shows how many are in progress.
  - **Profile:** "Learning Space · v0.32.0" at the top, read from the installed app (new `appVersion()` bridge), with a build-time fallback.
  - DESIGN.md: a large-text section, a Library section, and stricter touch-target and contrast checks.

## 0.31.0 · 2026-11-19
- Asked: go through the formulas and correct them.
- Changed (formulas, each pinned by tests/formulas.test.mjs):
  - Goal forecast pace divides by the days you've actually studied (3 to 14), not always 14, so a new goal isn't shown at a quarter of its real pace.
  - Finish date and deadline count today as a study day: 30 min left at 30 min/day finishes today; a deadline tomorrow leaves 2 study days, so "needed per day" is no longer overstated. The forecast sheet explains the real pace window.
  - Deadline urgency uses calendar days in your timezone, not UTC.
  - A resource with no lessons shows 0% instead of NaN.
  - The 12-month chart average divides by the days actually covered, not 365.
  - "Active days" means days at your streak minimum everywhere (This week tile, momentum, weekly plan), not "any minute".
  - Week report finish estimate uses that course's own minutes this week (not all learning) and shows a date instead of just a year.
  - Today's "to-dos done this week" starts on Monday in your timezone when there is no weekly plan.
- Asked: update our design/UI principles using the ui-skills and stageshow skills, and do a full UI pass.
- Changed (design):
  - New DESIGN.md: one job, one loudest element and one action per screen; per-tab tones; number, spacing, icon, motion, accessibility and copy rules; a ship checklist. Built from the ui-skills baseline/accessibility/motion skills and stageshow's craft rules.
  - Library: articles show a document icon and topics a compass (they all showed a play icon). The cover's page-curl no longer cuts across the icon. Readings and other one-step items show the tick instead of a 0% bar.
  - Progress no longer repeats the "Coaching is tailored to your goals" card from Today.
  - Dark mode Today pills are quiet tints with a toned icon instead of three saturated blocks.
  - Numbers use tabular figures, headings wrap evenly, every control shows a focus ring, and the read tick gives a 180ms press-and-pop (off with Reduce Motion). Toast copy is plain: "Marked as read."
- Asked: use the new skills to make something that makes the product better.
- Changed: an animated README demo built with stageshow (share → Save to read → lands in Library → tick → Marked as read), recorded frame-exact as a seamless 8.8 s loop. Source and re-render steps in design/demo/.

## 0.30.4 · 2026-11-13
- Asked: still not fixed. After saving a share, 4-5 old shared links (X, Reddit) popped up one by one (screen recording).
- Changed: root cause was Android re-delivering old share intents (the app opens inside X's or Reddit's task, and restoring or reopening it from Recents re-imported the old share as brand new). Restored or Recents launches no longer import shares. The phone remembers every handled share for 7 days by id and text, so a replay can't re-enter the queue. Closing a share with X now removes it for good, and a share whose link is already in your Library or Inbox is skipped silently.

## 0.30.3 · 2026-11-07
- Asked: no way to mark a reading or task as completed after finishing it.
- Changed: a tick button on each saved reading (and any single-step item) in the Library marks it read or done in one tap; tap again to undo. The item's detail sheet also has a clear "Mark as read" / "Mark as done" button.

## 0.30.2 · 2026-11-07
- Asked: after saving a shared link, 5-6 old shared links popped up one by one and had to be closed each time.
- Changed: only a link shared in the last 15 minutes pops up now. Older leftover shares are moved quietly to the Inbox (one toast) and cleared from the phone's share queue, so they never come back.
- Also: added this CHANGELOG.md, and the publish step now includes it.

## 0.30.1 · 2026-11-05
- Asked: sharing from X opened an old Reddit link titled "Reddit".
- Changed: shares now open newest first, and a share closed with X no longer blocks newer ones. Reddit links get a title from the post URL, and login pages are never used as titles.

## 0.30.0 · 2026-10-30
- Asked: pull down to refresh, and make logging better.
- Changed:
  - Pull to refresh on Today, Library, Inbox and Progress.
  - New Log learning screen:
    - Up next and Recent suggestions
    - a timer ring
    - a minutes stepper with presets
    - Practice / Watched / Read tiles
    - "when" chips and a "Log 25 min" button

## 0.29.2 · 2026-10-29
- Asked: an add button for to-dos in the hero, and handling for many to-dos.
- Changed: an Add to-do tile, "N more · See all · Add", and a To-dos sheet. Tiles now fit large system fonts.

## 0.29.1 · 2026-10-29
- Asked: what the goal forecast numbers mean, and no visible Delete button.
- Changed:
  - Tapping Goal progress opens a step-by-step breakdown.
  - Sample courses are excluded from the forecast, and the pace fallback was fixed.
  - Archive and Delete moved to the top of the editor.
  - The README shows the app version, with a link that skips the download cache.

## 0.29.0 · 2026-10-29
- Asked:
  - deleting courses
  - better library adding
  - to-dos in the hero
  - planning when the week is ending
  - screen time not updating
  - a goal ETA
  - checking that Unhinged works
- Changed:
  - an Add to library sheet: paste a link, or "Learn a topic" with subtopics
  - Delete
  - To-dos and Goal progress hero pages
  - "normal week" interview questions
  - live screen time for today
  - roasts in the offline coach

## 0.28.1 · 2026-10-28
- Asked: a Fitbit-style weekly cardio ring with tiles, swipeable to the right.
- Changed: the Today hero now has a ring with curved labels and three pill tiles, on swipeable pages with dots.

## 0.28.0 · 2026-10-28
- Asked:
  - an AI coach that plans and tracks weekly goals
  - Unhinged mode
  - share bad weeks to X
  - brain facts
  - easy reordering
  - custom instructions
- Changed:
  - "Plan my week" chat and a This week card
  - weekly reports with A–F grades and Post on X
  - Unhinged tone
  - 27 sourced facts
  - drag-to-reorder priorities
  - 14-day history for each tile
  - custom coach instructions

## 0.27.x · 2026-10-28
- Asked: name shared X posts, write my own titles, reading categories, Read ASAP.
- Changed:
  - X post titles, using the full text of long posts
  - your own titles
  - categories
  - Read ASAP, which means "by Sunday"

## 0.26.x and earlier · 2026-10-27 to 2026-10-28
- Asked: fix time logging, clean up the phone UI, a full-screen coach, a morning brief, Google Health styling.
- Changed:
  - save recovery after sync conflicts
  - timer-first Today
  - full-screen coach chat
  - Fitbit-style morning brief and notification
  - Material 3 Google Health redesign
  - one-command publish script
