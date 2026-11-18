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

## Unreleased
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
