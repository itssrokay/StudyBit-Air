# Learning Space · Design principles

How the phone app should look, read and move. Every UI change follows this file; when a rule and a screen disagree, fix the screen or change the rule here, in the same commit.

Sources: our own system (below), the ui-skills baseline, accessibility and motion skills (`npx ui-skills`), and the stageshow craft rules (`.agents/skills/stageshow/references/craft.md`), adapted to a plain-CSS, phone-first WebView app.

## The one idea

**Open the app, see one number that matters, do one thing.** Every screen has a single job, a single loudest element, and a single primary action. Everything else is quieter.

## 1. Identity (keep it)

- **Phone first.** The Android WebView is the product. Desktop is a wider layout of the same app, not a different design.
- **One tone per tab**, Material-style, set in `health-theme.css`: Today **blue**, Library **teal**, Inbox **green**, Progress **orange**, Coach **violet**. A tab uses its own tone for its primary action, active states and progress. It does not borrow another tab's tone.
- **System font**, sentence case, one weight step for hierarchy (400 body, 600 titles). Serif only for quotes.
- **Calm surfaces.** Background `--m-bg`, cards `--m-card`, quiet fills `--m-soft`, hairlines `--m-line`. No gradients, glows or purple "AI" sparkle styling except the Coach button itself.

## 2. Hierarchy

- **One big number per view** (stageshow: "one number gets to be big; the rest are lines"). Today: the ring. Progress: the period total. Everything else is regular text.
- **Say it once.** A message, card or promo appears on one screen only. (The "Coaching is tailored to your goals" card lives on Today, not on Progress too.)
- **Compose, don't stack boxes.** Hierarchy comes from size, space and tone, not from more bordered cards. A list is rows with hairlines, not a card per row.
- **Accent budget:** one filled, toned control per view (the primary action: on Today it's hero **Start**). Other actions are tonal (`--h-con` fill), outlined (**Log**) or text. Status pills use a soft tint with a toned icon, never three saturated fills side by side.
- **Empty states give one next action** (a button), not only text.

## 3. Numbers (this is a numbers app)

- **Every number uses `font-variant-numeric: tabular-nums`**, so values don't jiggle as they change.
- **Units stay attached** to their value (`45 min`, `3 days`), never on their own line. Use `briefDuration` / `fmtMinutes` for minutes; never hand-roll `Xh Ym`.
- **The formula behind a number is explainable** in one tap (the goal forecast sheet is the model). Numbers that disagree across screens are bugs: one definition per concept, in `lib/`, tested in `tests/formulas.test.mjs`:
  - an **active day** is a day at the streak minimum (`isActiveDay`)
  - **pace** is minutes divided by the days actually studied (3 to 14)
  - **days left** counts today and the deadline day
  - a **week** starts Monday in the user's timezone (`weekStartOf`)
- **Never show NaN, Infinity or "-0"**: guard divisions, and show `—` with a short reason when there's no data.

## 4. Layout and spacing

- **16px side gutter** on phone; content never touches a card edge (12px minimum inset for words).
- **Row padding 12px**; a title sits 4 to 6px above its metadata, and a record is visibly closer to its own metadata than to the next record.
- **Touch targets ≥ 44px** for every control, text or icon, at least 8px apart. Tiny indicators (the hero page dots) get an invisible 44px-tall hit area. Inline links inside a sentence are exempt.
- **Grow with content.** The phone uses a large system font: no fixed row heights, no `height` on text containers. Long titles wrap to two lines (`line-clamp: 2`), metadata truncates to one.
- **Large system text (Android Font size ≥ 120%)** sets `html[data-text-scale]` (`l` or `xl`, from the native `textScale()` bridge, see `lib/app-info.ts`). Layouts reflow rather than clip:
  - the header wraps (Personal/Work goes to its own row)
  - the tab bar shows icons only, with labels kept for screen readers
  - the Today ring drops its curved labels for a plain caption, and the pills stack full width
  - paired tiles stack
  Test at **320px with text at 200%** in both themes.
- **Fixed elements respect `env(safe-area-inset-*)`**, and use `100dvh`, never `100vh`.
- **Columns line up.** Rows in a list share one layout. Optional trailing controls keep their slot, so progress bars and titles don't change width row to row.
- **Radii:** 12px cards, 999px pills and chips, 10px small controls. A nested shape's radius = outer radius − padding.

## 5. Type

- Headings `text-wrap: balance`, paragraphs `text-wrap: pretty`.
- UI text 12 to 16px, small text line-height ≥ 1.3. Never below 11px.
- Don't change letter-spacing except on the existing eyebrow labels.

## Library

- Grouped by status, in rank order: **In progress**, then **Not started** (or **Up next** when nothing is started), with **Finished** folded away (`lib/library-sections.ts`). Search and Archived show one flat list.
- A row's only trailing controls are its state (tick, Read ASAP). Edit lives in the detail sheet, not on every row.
- The "Add to library" grid appears only while your own library has fewer than 3 items. Otherwise the + button is the way in.

## 6. Icons and covers

- Lucide icons at 16 to 22px, stroke 2. Decorative icons are `aria-hidden`.
- **An icon names the thing:** course `Layers`, book `BookOpen`, article `FileText`, video `Play`, topic `Compass`. No play icon on something you read.
- Real imagery first (YouTube thumbnails, book covers). Generated covers are quiet tinted tiles; decoration never crosses the icon.

## 7. Motion

- Animate only `transform` and `opacity`. Never width, height, top, left, margin or padding.
- Interaction feedback ≤ 200ms, `ease-out` on entrance. Sheets and the ring may take up to 300ms.
- **Every motion has a cause** (stageshow): something you did, or data that changed. No idle loops; loops pause off-screen.
- `prefers-reduced-motion: reduce` turns all non-essential motion off (one global rule in `globals.css`).
- Numbers that change in place transition; content doesn't swap with a flash.

## 8. Accessibility

- Every control has an accessible name; icon-only buttons get `aria-label`. Toggles use `aria-pressed`, and expandables use `aria-expanded`.
- Visible focus ring on every interactive element (`:focus-visible`), never removed without a replacement.
- Text contrast ≥ 4.5:1 (≥ 3:1 for large text and icons), in light **and** dark. A disabled control says why nearby; color is never the only signal.
- Dialogs: Escape closes, focus moves in and returns to the trigger. Destructive actions confirm.
- Toasts confirm; they are never the only place important information appears.

## 9. Copy

- Short, concrete, second person. Say what happened and what's next: "Saved to read in Career." / "Marked as read."
- No exclamation-mark hype, no "Oops". The Unhinged tone is allowed only in coach and verdict copy, never in errors or controls.

## 10. Before you ship a UI change

1. Screenshot Today, Library, Inbox, Progress and Coach at **390px and 320px**, **light and dark**, and again at **320px with 200% text**.
2. Check: one loudest element per view, one filled action, no clipped text, numbers aligned, nothing touching edges.
3. Measure: every control ≥ 44px tall, and text contrast ≥ 4.5:1, from pixels, not just CSS, since tinted and translucent surfaces fool computed checks.
4. `npx tsc --noEmit -p .` and the tests pass.
5. Note the change in CHANGELOG.md.

## Using the skills

- **ui-skills** (`npx ui-skills`, or the bundled skills in the npm package): `baseline-ui` for a polish pass, `fixing-accessibility`, `fixing-motion-performance`, and `improve-ui` for an evidence-based audit of one screen. ui-skills.com is blocked in Claude's sandbox; the npm package carries the same skills.
- **stageshow** (`.agents/skills/stageshow`): builds animated faux-UI product demos. We use it for the README demo and store/launch visuals, never for the app's real screens. Its craft rules (restraint, spacing, say it once) apply to our real screens too.
