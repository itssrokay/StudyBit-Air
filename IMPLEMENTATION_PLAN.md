# Import, books, habit tracking, and Android

## Import v2

Discover course-linked anchors in main content, sidebars, nested navigation, chapter containers, accessibility structures, and structured JSON-LD. Keep direct source URLs, module paths, estimated-duration provenance, and discovery diagnostics. Do not classify a /learn/<course>/... lesson as an article merely because only one item was found.

Offer a bounded, user-triggered expansion scan of chapter disclosure controls. Never click lesson completion, payment, submit, playback, or answer controls. Collect additional DOM snapshots after expansion and merge by canonical lesson URL. Report page scope, partial coverage, expected chapters/items when available, and unknown links. Keep explicit adapters for Boot.dev, 100xDevs, InterviewReady, and YouTube plus a generic structural fallback. Review every capture before export/import.

## Books and AI

Add book resources with reading chapters and optional page ranges. Parse PDF bookmarks first; offer contents-page text extraction and editable page-based reading blocks when bookmarks are absent. Support EPUB navigation/NCX and manual chapter lists. Keep originals local during outline extraction.

Add account-specific OpenAI key settings. Encrypt keys with AES-GCM using a separate server secret; never include them in backups or browser storage. Validate connectivity on explicit request, support removing a key, and use it for grouping, coaching, and reading-plan suggestions. Book-title-only suggestions must be labeled inferred study plans, not verified tables of contents.

## Streaks and mobile

Calculate current/best streaks from real logged minutes in the selected timezone with a configurable minimum daily threshold. Include a habit calendar and native widget snapshot.

Build an Android companion with a WebView for the private hosted dashboard and native RemoteViews widgets: Today, Streak, Goal, Next Lesson, Reading, Weekly Rhythm. Restrict privileged bridges and embedded navigation to the dashboard host; external learning links open externally. Cache a validated snapshot for offline widgets, refresh whenever the app receives a new snapshot, and display freshness. Provide JSON share/import fallback when browser authentication is preferred. No secrets are embedded in the APK.

## Verification

Regression-test the real InterviewReady DOM, source URL/module preservation, bounded disclosure scanning, fallback diagnostics, PDF/EPUB extraction, encryption/key isolation, streak day boundaries, and widget snapshot validation. Run TypeScript checks and production build. Build an Android APK when local tooling supports it and state exactly which device-level tests remain.

## Delivered and checked

Implemented outline scanning/merging, books, encrypted personal keys, streaks, six native widget providers, styling, snapshot share/import, APK download, and source packages. Real InterviewReady DOM verification found 51 unique lesson links in nine ordered modules (quizzes and PDF summaries included). PDF bookmark and EPUB navigation fixtures passed browser import checks. Personal-key save/remove passed a local nonfunctional-key check, and the key was removed. Twenty domain tests and TypeScript passed. The APK passed v2/v3 signature verification, resource alignment, and native snapshot validation checks. The source helper runs the final production build before packaging.

Device testing remains: install on the supplied Android 17 / One UI 9 phone, authenticate, share a snapshot, place/reconfigure/resize widgets, and check launcher/process/battery behavior. This host has no emulator or connected Android phone. Widgets use explicit snapshot synchronization, and book files stay local. Universal complete import cannot be guaranteed for hidden/locked/virtualized structures; the importer retains partial-coverage diagnostics and manual fallback.
