#StudyBit Air  

A personal learning dashboard with a private hosted library and a login-free Android/local mode. Built with React, Vinext, Cloudflare Workers, D1, and a native Android companion.

## What works

- A daily lesson plan with a configurable budget (45 minutes initially), including resumable study blocks for long videos.
- A ranked library of courses, books, videos, articles, and topics.
- Course-order prerequisites, explicit priorities, focus goals, deadlines, and pinning. Learning-area folders and lesson modules can be nested; a course can focus on one module branch.
- Lesson completion, course progress, focus timer, resource and lesson notes, and activity history.
- Course import from a pasted syllabus or JSON. YouTube video links use oEmbed metadata; other links are saved for manual labeling.
- Editable import previews, prior-completion import, archive/restore, backup export and full backup restore.
- Account-specific D1 storage, authenticated APIs, optimistic revision checks, and unsaved-change warnings.
- PDF bookmark/contents extraction, EPUB navigation, manual chapter lists, and editable page-based reading blocks. Original book files stay local; chapter metadata and progress sync.
- Current/best streaks based on logged learning, a configurable daily threshold, and a 28-day habit calendar.
- A signed Android development APK with six native widget types in light/forest styles and validated cached snapshots. See `android-companion/README.md`.
- An optional server-side OpenAI coach and AI syllabus organizer with structured, validated outputs and explicit review before applying priorities.

Sample courses are illustrative. They are not purchased course content. Seed progress has no completion timestamps and does not contribute to study history.

## Local development

Requirements: Node >=22.13, npm, Git. Run `npm run install:ci` when dependencies are absent.

Set `d1` to `DB` in `.openai/hosting.json`. Generate migrations with `npm run db:generate` after schema changes. Build once with `npm run build`, then apply each pending migration once:

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_tan_zaladane.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_conscious_longshot.sql
npm run dev
```

Portable preview uses dispatch-owned mock sign-in on loopback. Production uses Sites authentication. Data is keyed by stable authenticated user ID, not email.

## Checks

```
npx tsc --noEmit
node --experimental-strip-types --test tests/learning.test.mjs
npm run build
```

Tests cover time budgets, prerequisites, study blocks, course merges, timezone/streak rollover, book page blocks, API-key encryption and owner isolation, widget snapshots, and capture deduplication/order. Real browser checks also cover InterviewReady’s visible course outline, PDF bookmarks, EPUB navigation, key save/remove, and widget export.

## Ranking

Resource score = priority × 12 + goal importance × 4 + focus bonus 12 + started bonus 6 + deadline bonus (6/14/20 within 30/7/3 days). Completed and archived resources are excluded. Only the next unfinished lesson from each resource is eligible. Pinning an eligible lesson adds 1,000. Each further lesson from the same resource gets a 30-point variety penalty. Lessons longer than the remaining time become study blocks. Eligible lessons follow the focused module branch when one is selected. Ties prefer a full lesson that fits over a partial block. The plan is recomputed as progress or priorities change.

Learning time is the estimated duration of lessons marked complete, grouped by the selected timezone. The timer is a focus aid; it does not independently create activity. Logging a study block increments studied minutes and creates a dated activity record. Completion logs only the unlogged remaining duration, so it does not double count blocks. Undoing completion clears that lesson’s logged blocks and completion time.

## Importing

A syllabus uses one lesson per line:

```
Introduction | 10 min
Components | 18 min | https://example.com/lesson | done
```

JSON resource shape:

```json
{
  "title": "My course",
  "provider": "Udemy",
  "kind": "course",
  "lessons": [
    {"title": "Introduction", "minutes": 10, "done": true},
    {"title": "First project", "minutes": 25, "done": false}
  ]
}
```

Imports preserve prior completion without fabricating study timestamps. Full exported backups go through Settings → Restore a backup. Restore replaces the complete library after confirmation.

Paid platform login/progress synchronization, server-side YouTube playlist extraction, video downloading, OCR for scanned PDFs, and full-text book hosting are not included. The Chrome companion can capture a loaded playlist. The dashboard never claims to have read protected course content.

## Optional AI

No API key is required for the dashboard. In Settings → Your AI connection, enter your own OpenAI API key and model, save it, and optionally test the connection. Your key is encrypted with AES-GCM in an account-specific D1 row and never returned to the browser, included in backups, or sent to widgets. Saving does not call OpenAI; Test connection calls the models endpoint without generating a model response. AI features use your OpenAI account. Remove key deletes the stored personal key.

The server must have a separate 32-byte base64 `LEARNING_KEYS_SECRET` runtime secret. Local preview loads it from ignored `.dev.vars`. Keep this encryption secret stable across redeploys; replacing it makes existing encrypted keys unreadable. An optional server `OPENAI_API_KEY` / `OPENAI_MODEL` is a fallback; the personal key takes precedence. The default model is `gpt-4.1-mini`. No keys belong in Git or the hosting manifest.

The server calls the [Responses API with Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), sets `store: false`, limits inputs and outputs, validates returned suggestions, and sends only goal/settings/resource summaries for coaching. Course syllabus text is sent only when requesting AI organization. Book-title-only requests generate a visibly inferred reading plan, not a verified table of contents or edition metadata. Contents extraction sends only the text shown in the book importer, title/author, and learner context on an explicit request. PDFs are not uploaded for outline extraction. API keys are not exposed to the client. Coach requests do not send notes; they send goals, folders, module names, completion counts, and next-lesson metadata. AI errors preserve the library. Priorities are applied only after reviewing the response.

## Publishing

The exact Site identity is tracked in `.openai/hosting.json`. Use the Sites skill source-workflow helper to push and package, then save/deploy that exact pushed commit with the owner-private operation. Migrations are applied by Sites during deployment. Preserve private access.

## Grouped course capture

The Chrome prototype is in `browser-companion/`; a ZIP download is available at `/downloads/learning-space-companion.zip`. Load it unpacked in Chrome using its README instructions. It uses activeTab, scripting and local storage only. It discovers sidebar, navigation, main-content and structured outline metadata on a user click, can scan up to 40 recognized chapter disclosures, and exports reviewed JSON; it has no continuous scraping, automatic watch tracking, direct account pairing, or Chrome Web Store release.

Capture multiple course folders into a draft, export, and import the JSON. The dashboard supports lesson `modulePath`, `format` (video/exercise/reading), and `sourceId`, plus resource `folderPath`, `focusModule`, `captureScope`, and `captureNote`. Choose Merge into an existing course to append new items idempotently while preserving existing IDs, notes, progress, and manual grouping. Existing records and older backups receive compatible defaults. The personal-key table is introduced by migration `0001_conscious_longshot.sql`.

A syllabus can use `DevOps > Docker > Images | 15 | https://...`. Import previews and course details offer title-based topic folder suggestions. These are local heuristics, visibly distinct from AI suggestions. Optional AI grouping accepts a contextual request and returns validated assignments for only the supplied lesson IDs; it never changes titles, order, durations, or URLs. AI coaching can recommend priorities and an existing module focus using goal and next-lesson context. All suggestions require review before applying. AI grouping supports up to 200 lessons per request; manual and local topic grouping support up to 500.

Boot.dev’s public course page exposes chapter-level tasks rather than every exercise. Lesson capture excludes recent history from other courses. 100xDevs exposes loaded titles and durations; missing direct URLs intentionally fall back to the source folder. No guessed playback URL is generated. Review import coverage on every course.

## Books and habits

Library → Add a book accepts PDF/EPUB or just a book title. PDF leaf bookmarks become chapter tasks with estimated page ranges; a possible contents page or 15-page blocks is the fallback. Review/edit titles, durations, and PDF page ranges before saving. EPUB navigation/NCX provides chapter titles. Name-only AI plans remain unverified suggestions. Encrypted PDFs, scans, edition differences, and missing outlines may require manual chapters or OCR outside this app. Files are kept in local IndexedDB and excluded from cloud backups; attach the matching original again on another device.

Streaks count calendar days in the selected timezone with at least the chosen number of logged minutes (five by default). Imported prior completion and illustrative sample progress do not earn a streak. Yesterday’s streak remains active until today is missed. Best streak and the habit calendar use recorded activity. Changing the threshold recalculates history.

## Android widgets

Download `/downloads/learning-space-android.apk` from Settings. The six native widgets are Today, Streak, Daily goal, Next lesson, Reading, and Weekly rhythm. They cache a bounded snapshot of progress and next tasks, with no notes or API keys. The bundled Android dashboard refreshes them through a constrained local bridge, without hosted sign-in or manual snapshot sharing. Wi-Fi synchronization runs while the app is open; widgets do not fetch accounts in the background. See the Android README for installation, styling, build instructions, and the untested Samsung device checks.

The Chrome and Android source packages are downloadable alongside the APK. The site stays owner-private. Local preview data and hosted account data are separate databases; use a backup export/restore when transferring a local prototype library.

## Android 0.4: no login, offline first, optional Wi-Fi sync

The phone app now opens its bundled dashboard and keeps an atomic local library file. It never loads the hosted sign-in page by default. Widgets refresh directly from phone progress. PDF/EPUB originals use app-private storage and a scoped reading-app content URI; backup export uses the Android document picker. Personal OpenAI keys use Android Keystore and are excluded from Wi-Fi sync.

The offline entry is `offline/main.tsx`, built separately by `npm run build:offline`. It shares the dashboard, schemas, planning, books, and habits with the hosted app through `lib/client-api.ts`. Browser-only local copies use transactional IndexedDB; native copies use the app’s local bridge. Hosted API authentication remains intact and the site stays owner-private.

Run `npm run lan`, then open `http://localhost:5180/`. The computer browser connects itself to the local server. Settings shows a private Wi-Fi URL and persistent connection code for the phone. `public/downloads/learning-space-lan.zip` is a standalone Node 22 setup with bundled dependencies/assets. Private runtime files in `.local-learning/` are ignored and never packaged.

Three-way sync uses a saved baseline, preserves independent changes/deletions, combines unique study events without counting them twice, and exposes conflicting fields for review. Revisions protect both local and server writes. Sync runs while the app is open and keeps local work available when the computer is absent. Book bytes and API keys are not synced. The hosted library and the local copies remain separate; use backup export/restore to move existing hosted data once. A changed DHCP address needs a connection-settings update.

Meaningful checks: `node --experimental-strip-types --test tests/learning.test.mjs tests/sync.test.mjs tests/lan-server.test.mjs`, `npx tsc --noEmit`, `npm run build:offline`, and the Android builder’s persistence/address/snapshot/signature checks. Browser QA uses two independent origins to verify actual synchronization and reload persistence. Phone-specific WebView, Keystore, SAF, and launcher checks remain pending on the real Samsung device.


### YouTube playlist import
Paste a playlist URL (or a watch URL containing `list=`) in Add resource → Link → Get details. Review every public video in source order, with creator, exact video durations, rounded planning minutes, and YouTube thumbnails. No YouTube or OpenAI key is needed. The hosted app and computer server fetch public metadata; Android 0.9 fetches it directly, without needing the computer. Importing needs internet; saved lessons and progress work offline. Thumbnails need internet and fall back to the built-in cover if unavailable.

Existing playlist resources have **Refresh from YouTube** under Modules & lessons. Preview before applying. Matching videos retain IDs, progress, notes, pins, and modules; custom course title, priority, and goal remain. An untouched synthetic placeholder can be replaced; previous items with saved work are kept. Partial outlines and unavailable entries are labelled. Playlists are bounded to 500 distinct videos. Public YouTube page layouts can change; Browser capture remains a fallback. No playback, account cookies, or YouTube watch-history sync is involved.


### Reading and course outlines (0.10)
Use **Add → Article / post** to save an article, X/Twitter post, or thread link. Suggested titles come from the URL; edit the title and optionally paste up to 20,000 characters of reading text. Pasted text works offline. Reading time is an editable estimate (220 words/minute for pasted text). Opening the original still needs that website’s access. No article bodies, private posts, or complete threads are scraped automatically.

Use **Add → File** for a nested chapter JSON file, a `.txt` / `.md` outline, or an existing flat capture. Download `public/downloads/course-template.json` in the importer. Chapter JSON shape:
```json
{"title":"My course","chapters":[{"title":"Chapter 1","lessons":[{"title":"Introduction","minutes":15,"url":"https://example.com/intro","format":"video"}]}]}
```
Lessons need titles; minutes default to 15 and links are optional. `format` can be `video`, `reading`, or `exercise`. Nested chapters preserve source order (up to eight levels, 500 lessons). In **Course outline**, use `# Chapter` / `## Subchapter` headings, then `Lesson title | minutes | optional URL | optional done`. The editable preview validates errors before saving. Imported completion never invents study time or streaks.

Use **Progress / Activity → Study history** or **Delete session** on a review to remove a recorded block. Use resource **Details → Reset resource progress** to start a course again, keeping notes and its outline. Unmarking a finished lesson resets its study history. Deleting a resource removes its linked records. Cleanup also repairs dangling history from older versions. Removal records persist through backup/restore and Wi-Fi merges, so stale copies do not silently resurrect removed time. Sync still asks you to resolve a delete-versus-edit conflict that contains an offline course edit. Existing API credentials are unchanged.


## Screen time and direct coaching (0.14)

Mobile Progress now separates Screen time from Learning history. Optional Android foreground estimates refresh on open/resume and every two minutes while visible. Classify Leisure apps to compare usage with a chosen budget. Daily summaries sync through the paired Wi-Fi library only after explicit opt-in; app names and coach usage each have separate switches. No AI call is made simply because usage refreshes. The Direct coach uses actual numeric gaps and one concrete next step, while qualifying missing data, mixed use, partial days, and device overlap.

`python3 mac-companion/build.py` produces a universal macOS 15+ menu-bar app. It records foreground app names and time while running and writes private local files, excluding idle/sleep time. The local Wi-Fi server ingests approved category summaries even with its browser closed. It does not import historical Apple Screen Time. See `mac-companion/README.md`, `offline/COMPUTER_SETUP.md`, and `COACH_STRATEGY.md`.

Release packaging: `npm run build:offline`, `python3 mac-companion/build.py`, `python3 android-companion/build-local.py`, then `python3 scripts/package-release.py`. Keep the existing Android signing key for in-place updates. Private user data and signing material are excluded from release archives.


## Daily reviews (0.15)

The phone runs a persisted, network-constrained midnight JobScheduler job using its existing encrypted key, with foreground catch-up and a notification. Review timing remains subject to Android delays. Daily results/checkpoints live in `coach.dailyReviews`, sync with v0.15, and are invalidated for context when their underlying learning records change. Successful results are receipted before library writes, and retries reuse them. Automatic context includes a bounded inventory of captures and learning data by default; per-field truncation and excluded sources are inspectable. `COACH_STRATEGY.md` describes the lifecycle and limits. This is a phone-first implementation; the hosted Worker backend remains available for manual web AI requests, without an unattended cloud schedule.


## Vercel browser-local deployment

Vercel uses `npm run build:vercel` and serves `.vercel-dist` as a static website. This is the offline dashboard without login. Libraries, progress and drafts are stored in browser storage for that origin; export backups before clearing browser data. It does not connect to the existing Sites/Cloudflare account database, upload device usage automatically, or store an OpenAI key in the browser. Native AI, midnight reviews, notifications, widgets and phone usage remain in the Android app. YouTube URL extraction runs in Android or the computer server; the static website supports syllabus/JSON imports. GitHub pushes to main redeploy the Vercel project. Local runtime files, libraries, keys and Cloudflare account data are excluded from the build output.
