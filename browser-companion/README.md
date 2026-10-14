# Learning Space · Course Capture v0.2 (prototype)

A Manifest V3 Chrome companion. The user clicks Capture; the extension reads rendered outline metadata from that tab, stores a local editable draft, and exports a course JSON for the dashboard. No account tokens, cookies, background browsing, external API calls, video downloads, or passwords are used.

## Load locally

1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode.
3. Choose Load unpacked and select this `browser-companion` directory (unzip the download first if needed).
4. Open a course page, expand the relevant folder or outline, and click the extension icon.
5. Capture (or Scan collapsed chapters) → edit course title/learning area/module/durations → select items → Download course JSON.
6. In the local or hosted dashboard: Add to library → Import file → review → add or merge into an existing course.

To collect multiple course folders, keep the course title, tick Merge into my current draft, navigate to the next folder, and Capture again. This merge only deduplicates page metadata; it does not invent missing deep links. Canonical exposed lesson URLs, explicit chapter IDs, or source-page+title identify items. Unknown durations remain marked as estimates in the export. Review coverage and durations.

## Current adapters

- **Boot.dev lesson page:** the current lesson and direct link, with the current chapter if available. Recent-history links from other courses are excluded.
- **Boot.dev course page:** chapter-level study tasks from the Chapter List. The public landing page does not expose every exercise. Scope is explicitly labeled; no promise of all 43 lessons is made.
- **100xDevs course content:** loaded lesson-card titles and durations in DOM order. Cards without exposed hrefs retain the source-page reference; clicking in the dashboard opens that course folder. No guessed video URL is emitted.
- **YouTube:** loaded playlist panel, or current video, excluding recommendations.
- **InterviewReady:** sidebar chapter/lesson links, original chapter labels and order, quizzes, PDF summary readings, direct lesson URLs, and chapter-average duration estimates. The real AI Engineering outline was checked: 51 links across nine chapters.
- **Other sites:** course-linked anchors from main content, sidebars, nested navigation and structured JSON-LD, or an explicitly partial current-page fallback. Review every capture.

Scan collapsed chapters collects a snapshot before/after each recognized disclosure and accumulates the results, even when opening one chapter closes another. It skips already scanned labels, preserves discovered module order, and stops after at most 40 expansions. Keep the popup open during scanning. It only opens recognized outline controls and excludes submission/payment/playback/completion controls.

Collapsed folders, virtualized lists, pagination, slow lazy loading, cross-origin iframes, inaccessible browser pages, and changing DOM structures still limit coverage. Open/expand/scroll on the site, then capture again. There is no universal complete-course scraper, direct extension-to-server pairing, automatic watch tracking, or Chrome Web Store release in this prototype.

Only `activeTab`, `scripting`, and `storage` permissions are requested. There are no persistent host permissions. The extension does not use an LLM; optional AI organizing and coaching live server-side in the dashboard and require its configured OpenAI key.
