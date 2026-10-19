# Learning Space for Android · 0.16.0

The Android app now contains the full dashboard and saves its library on the phone. It opens without login, internet, or a computer. The private hosted website remains an optional, separate account-backed copy.

## Update from 0.3 / 0.4

Install the new APK over the existing app. Package name and signing certificate are unchanged, and version code increases to 13. Do not uninstall if you want to preserve existing app data and widget styles. This is a personal development build, not a Play Store release.

## Appearance

Settings → Make yourself at home offers Light, Dark, and System. The choice persists in library backups and Wi-Fi sync. System resolves separately on each device. A local bootstrap cache prevents a bright frame when reopening a dark library. Native toolbar, status/navigation bars, dialogs, and widgets follow the saved appearance; widgets may use their own override.

## Use offline

Courses, priorities, goals, notes, study blocks, streaks, book outlines, and progress are stored locally. The app bundles its HTML, JavaScript, CSS, icons, and PDF worker. It serves them at a stable app-owned HTTPS origin using WebView resource interception. The library uses an atomic file in app-private storage with revision checks. No hosted sign-in or expiring callback is used.

PDF/EPUB files are chosen through Android’s document picker, extracted on the phone, and copied to app-private book storage. Open book uses a scoped read-only content URI for your installed reading app. There is no built-in full PDF/EPUB reader. Original files do not sync over Wi-Fi; attach the matching file separately on another device.

Export backups through Settings; Android’s Save document picker chooses their destination. Restore a hosted backup through Settings → Restore a backup, or share a full library JSON to Learning Space and confirm restoration after validation. Metadata/progress/backups exclude OpenAI keys and original book files. Uninstalling or clearing app data removes the local copy, so keep backups.

## Same Wi-Fi sync

Start the computer server (`npm run lan` from the project, after `npm run build:offline`) or unzip the standalone computer setup and run `node server.mjs`. Open `http://localhost:5180/` on the computer. Settings → On this device shows its private Wi-Fi address and connection code; the computer browser pairs itself automatically.

On the phone, open Wi-Fi / Settings, enter the computer’s address and code, and choose Save connection & sync. The code stays in the computer’s private `.local-learning` folder and does not expire after one use. Phone connection settings persist across app restarts. The computer must be running and both devices must be on a network that allows communication between them. If its DHCP address changes, update the saved address. A firewall or guest Wi-Fi/client isolation can prevent a connection.

Sync happens while the app is open: after local saves, on reconnect, periodically, or on explicit request. When the computer is unavailable, learning continues locally. Three-way merging combines separate edits, new courses, and distinct study events. Conflicting fields require a choice before replacing either value; stale server/local writes are rejected. Sync exchanges library metadata and notes, not book files or API keys. It uses HTTP with a persistent connection code on a trusted private network, not internet hosting. The native network bridge only accepts private IPv4/loopback destinations and a fixed library endpoint.

## Conversations & coach

The dashboard has insight cards based on saved activity. Reply / Ask coach carries the insight into a conversation. Chat history and explicitly edited learning intent/preferences are saved in the same offline library, exported in backups, and merged through Wi-Fi sync. Smart guidance needs no API key: it explains the existing ranking, proposes short plans, and asks when intent or outside activity is uncertain. It does not interpret arbitrary conversation like an AI model.

AI conversation uses your personal key, internet, the latest message, up to 12 recent messages, remembered preferences, goals, recorded activity, and bounded resource metadata. It excludes private course/lesson notes. Priority, module-focus, and today-plan changes are previews until Apply. A custom time target expires at the end of your timezone day and does not change your normal daily goal. History holds up to 8 conversations of 40 messages; delete older conversations when you need room. Memory is editable and never silently inferred.

## AI

Enter a personal OpenAI key in the app’s Settings. Android Keystore encrypts it; neither the saved plaintext nor the encryption key is exposed to the dashboard. AI requests go directly from native code to OpenAI over HTTPS for requested AI features, or after a new study session when automatic session reviews are enabled. Coaching excludes notes and validates resource references; grouping validates lesson IDs; book-name plans remain visibly inferred. AI needs internet, while deterministic planning and local imports do not. Hosted and phone keys are separate connections.

## Widgets

Seven resizable native RemoteViews widgets: Overview, Today, Streak, Daily goal, Next lesson, Reading, and Weekly rhythm. Overview combines a capped daily-goal ring with real streak and rolling-week metrics. Streak has an original sprout character and supportive encouragement. Long press the Samsung home screen → Widgets → Learning Space, or request a pin from the app’s Widgets menu. Choose app appearance, Light, Forest, or phone appearance. Widget configuration supports reconfiguration where the launcher offers it.

The embedded dashboard refreshes a bounded snapshot as local progress changes, without browser sign-in or manual snapshot sharing. Widgets render that cached data, adjust daily minutes/streaks at rollover, and show freshness in larger layouts. Refresh opens the local dashboard to rebuild the snapshot and attempt foreground Wi-Fi sync; its timestamp advances only when the dashboard supplies a snapshot. They do not run background network synchronization when the app is closed. A stale next lesson is labelled Saved next step. Rolling-week counts and missed-day streak resets are derived in the native renderer.

## Build and verification

Run `npm run build:offline` in the web project first to populate `assets/dashboard`, then `python3 android-companion/build-local.py`. The builder pins and verifies Google Maven AAPT2/R8/apksig and Maven Central Robolectric Android artifacts, compiles Java/resources, includes the offline assets, signs with the existing local development certificate, verifies APK signatures, and checks native library persistence/revision rejection, LAN address restrictions, and widget snapshot validation. The keystore/toolchain remain ignored under `.build/`.

The Gradle project supports Android Studio/JDK 17+, Gradle 8.10.2, and Android SDK 34. Its assets source directory uses the prebuilt offline dashboard. Minimum API 26; target/compile API 34. [Android’s local-network permission guidance](https://developer.android.com/privacy-and-security/local-network-permission) says apps targeting SDK 36 or lower retain LAN access through INTERNET; do not request ACCESS_LOCAL_NETWORK until targeting SDK 37. This build requests only INTERNET and confines LAN calls in native code.

Checks cover the compiled APK, embedded offline files, v2/v3 signatures, native disk persistence after reopening, stale writes, and two independent browser replicas syncing through the computer server. A real Samsung Android 17 / One UI 9 device is not attached to the build host. Installation, Android Keystore, WebView callbacks, document picker/reading app, and launcher behavior still need device testing. The prior browser-login loop is removed structurally: the app’s initial URL is its bundled dashboard, not the hosted site.

References: [in-app WebView content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [Android widgets](https://developer.android.com/develop/ui/views/appwidgets/overview).

## Phone experience and session reviews (0.7.0)

The phone has a dedicated four-tab layout: Today, Library, Coach, and Progress. Settings open from the profile button. The old native Widgets/Wi-Fi toolbar is removed; these tools live in Settings. Imports, course details, and focus sessions open as full-screen phone sheets. Typography uses the phone’s system font. Desktop retains its wider dashboard.

Saving a session records self-reported minutes, optional difficulty/reflection, and the recommendation from before the session. A deterministic review is available offline immediately and can question a detour from the saved priorities. It never treats watch time as demonstrated understanding. Finishing a lesson records its estimated remaining minutes, labelled as estimated. Undoing a completion removes its study events and reviews.

Settings → Session coaching enables personal-key AI reviews for future sessions only. The app sends the session evidence, goals, priorities, coach memory and bounded library/activity context to OpenAI; private course/lesson notes are excluded. Each generation uses API credit. Errors stay visible and require an explicit retry; queued work resumes when the app is reopened with the feature enabled. It does not run a background Android service. Reviews and follow-up chats are included in library backups and Wi-Fi merges. The latest 120 reviews are retained. Suggested plan changes remain previews until Apply.

Design research: Google’s official Fitbit personal health coach public-preview overview describes event-timed Today insights, recent-activity-aware suggestions and feedback. The implementation adapts these interaction patterns for learning; it does not reproduce Fitbit’s proprietary models or prompts. https://blog.google/products-and-platforms/devices/fitbit/personal-health-coach-public-preview/

## Focus timer notifications (0.10.0)

Start a focus timer from a lesson. Android owns the stopwatch in a foreground service, so opening another learning app, locking the screen or recreating the WebView does not reset it. Its standard Android notification displays a live chronometer, lesson title and planned block, with Pause/Resume and Finish controls. Tapping the notification restores the session; Finish pauses and opens the review form. A paused timer uses a normal notification and stops the foreground service. The app's floating session bar reopens the same session from any tab. Closing a sheet keeps the timer and its saved reflection/difficulty. The keyboard uses resize mode on Android.

Android 13+ asks for notification permission on the first timer start. Denying permission does not grant the app notification access: the timer can run, but its drawer notification is hidden by Android. Settings → Focus sessions opens Android notification settings. Notification and lock-screen appearance still follow the phone's settings; there is no custom One UI Now Bar integration. No exact-alarm, sensor, location, microphone, wake-lock or battery-optimization bypass permission is requested.

The timer's elapsed clock is monotonic in native code and includes time while the device sleeps. Paused time is excluded. State is persisted across process recreation on the same boot. Reboot recovery pauses at the last accumulated checkpoint instead of counting powered-off time. Timers are capped at 24 hours. Force stop or OS restrictions can interrupt the service, so review the time before saving. Native notification behavior still needs physical-device verification; JVM checks cover clock and lifecycle arithmetic, not One UI's rendering.

Nothing is logged automatically. Finish & review rounds down to whole minutes, and permits editing; under a minute cannot be silently logged as a full block. The separate lesson-complete shortcut explicitly uses the estimated remaining duration. The timer is cleared only after the library snapshot containing its session ID successfully saves. Draft timer details remain local and do not sync to other devices. The browser uses a persistent local stopwatch fallback without claiming native notifications.

The service declares Android's `specialUse` foreground type with a study-stopwatch explanation (API 34+). This is a personal sideloaded build; no Play Store policy approval is implied. References: [foreground service types](https://developer.android.com/develop/background-work/services/fgs/service-types), [notification permission](https://developer.android.com/develop/ui/compose/notifications/notification-permission).

## To-dos and milestone rewards (0.11.0)

Today has a quick checklist and the next unredeemed reward. Progress → Goals & rewards (or Settings → Goals, rewards & to-dos) manages the full collection. To-dos can have a date and a learning goal; checking them never adds study time. Learning goals and rewards accept JPEG/PNG/WebP photos, resized locally and saved with the library.

Rewards count learning days or the best consecutive run since a chosen start date, using their own saved minimum minutes. New challenges start today by default. Real dated study across the library counts; sample completions without dates and future-dated activity do not. Removing activity recalculates eligibility. Redeem records the personal treat once; a redeemed receipt stays if history later changes. Nothing is purchased or awarded externally. Photos, tasks, rules and redemption receipts travel in backups and Wi-Fi sync. Update both app and computer setup to 0.11 to sync these fields.

## Capture, Work and share (0.14.0)

The app uses a neutral paper/slate and iris palette. Today includes Log learning and Share my day. Inbox accepts natural-language notes and up to 20 detected links per capture. Import each link through the existing reviewed importer; make a to-do or topic from the text, then file the original. Saving and link detection are local and do not require AI.

Personal and Work partition resources, goals, to-dos, inbox, rewards and recorded progress. Work defaults to a 30-minute daily goal, independently editable in Settings. Existing items default to Personal. Edit resource moves an item between spaces without dropping lessons or recorded time. Appearance, weekly target and minimum streak minutes remain shared. The coach is a shared overview and can consider both spaces; the daily queue and progress follow the selected space. Widgets show Personal learning. Backups contain both spaces.

Quick logs record an article, video, practice or other learning with self-reported minutes and optional reflection. They count in activity, streaks, rewards and daily cards. Unless kept active, the completed resource is archived. Remove the study session or resource to retract its contribution. This is a learning log, not passive watch tracking.

Daily cards export an actual 1080×1350 PNG with the day’s minutes, finished steps, streak and extra discoveries. Personal is the default share scope, and titles are off by default. Work requires explicit selection. Notes, reflections, source URLs and account identifiers are excluded; an optional user-written thought is added to the caption. Share card opens Android’s Sharesheet with a temporary read-only content URI. Save PNG uses Android’s document picker. Draft for X opens a text composer; attach the saved image and publish yourself. No automatic social posting or social-account connection is configured. Receivers may handle image and caption differently.

The Android app registers for text/plain ACTION_SEND. In X, YouTube, a browser, or another app, choose Share → Learning Space. The text/link is kept in a bounded, durable local draft queue. Review and choose Personal or Work before saving it to Inbox. Single article/post links also offer Save to read: this creates a reading resource from the link and supplied text, files the original capture, and does not mark it read or add study minutes. Existing reading links in the same space are reused. The queue entry is acknowledged only after the library containing it saves; duplicate delivery uses the same draft ID. Closing preserves a draft until a later app resume. X normally shares a URL; the app does not claim to download an authenticated full thread. Paste the thread text if it was not supplied.

Every resource has Edit → Resource cover, accepting a locally resized JPEG/PNG/WebP. Covers travel with metadata backups and Wi-Fi sync. The native share queue, content-provider URI grants, save picker, and X share delivery still require verification on the physical Samsung device.

## Focus & Balance and coach memory (0.14.0)

Open Progress → Focus & Balance. Phone usage is optional: enable it, open Android Usage access, and allow Learning Space. Set a daily screen-time budget. All device use counts, including work, learning, and browsing; no app categories. YouTube is never automatically treated as studying. Usage estimates refresh locally on app open/resume and every two minutes while visible, from any page. Daily total-time summaries sync through the paired Wi-Fi library only after enabling automatic summary sync. App names require a separate opt-in, and coach use is a separate switch. Raw usage is not synced or added to social cards. Disable the feature or revoke Usage access to stop reads. This does not run a background Android monitoring service.

Coach → Memory lets you edit your learning profile and add, edit, or forget lasting memories. AI memory proposals need approval. Use the context button to choose Personal, Work, or both and attach selected inbox captures. Saving a dump alone does not send it to AI. “Think with coach” opens a reviewed draft. The existing encrypted AI key setup remains unchanged.


Version 0.14 adds a dedicated Screen time / Learning switch in mobile Progress, device/day filters, screen-time budget overruns, and a direct reality check. Coach → Context has Direct/Balanced and usage consent controls. Your existing phone key still works; installing this signed APK over 0.13 preserves it and your local library. Update the computer setup to 0.14 for automatic summary sync. The optional Mac companion requires macOS 15+ and tracks only while running. See its download README for setup.


## Daily coach (0.15.0)

Install over the previous version to keep the local library and encrypted key. Coach now includes a midnight review card. It targets 12:00 AM in the dashboard timezone and reviews the day that ended. The Android system may defer execution; network-constrained background work and open/resume catch-up handle the latest completed day. The phone needs internet and an existing key, but no Mac or new cloud backend. Daily reviews are enabled by default for this requested workflow and can be paused in the card.

Automatic context is the new default: saved captures, goals, compact resource inventory/notes, activity, tasks, rewards and a dated coach note. No attachments are required. Review the precise context in Coach’s context drawer. Full PDFs/EPUBs and images are not uploaded. Long text is visibly shortened. New shared X/link text can be included from the pending share queue; it is not a fetch of the complete article/thread.

The native job refreshes phone usage when Usage access and the coach usage switch are enabled. It keeps raw app records local and uses total screen-time estimates, with names only through the separate choice. Synced Mac estimates are dated snapshots. Successful reviews are saved privately before library writes, deduplicated by day and timezone, and delivered through the Daily coach reviews notification channel. Enable notifications in the card if Android has not granted them. Tapping a review notification opens Coach. RECEIVE_BOOT_COMPLETED supports persisted jobs; no exact-alarm, accessibility, or battery-exemption permission is requested. Android force-stop and Samsung power restrictions can still postpone work until the app is opened.

Coach-generated continuity notes are automatic, dated, editable by clearing, and separate from approved memories. Up to 60 reviews sync with backups and the v0.15 computer setup. A learning change marks its old assessment outdated. Failed automatic calls are bounded; cached successful results are recovered without another generation. This does not guarantee an exact wall-clock notification under Android scheduling constraints.

## Screen time fix (0.16.0)

Install this signed update over the existing app to keep the library and encrypted key. The phone total now uses observed screen-on/unlocked intervals, including home-screen time, when the events establish the day’s initial state. Lock-screen and screen-off time do not count. Incomplete screen events, or zero unlocked time contradicted by positive app activity, fall back to an activity estimate. Activity transitions now preserve the class name: an old screen’s pause or stop no longer closes a different active screen inside the same package. The public Android API does not expose activity instance IDs; app attribution remains an estimate for multiple instances/windows.

Progress → Screen time → How this is measured shows the source, timezone, app activity estimate, observed unlocked time and number of events. These are Android UsageEvents measurements, not Samsung’s private Digital Wellbeing total; exact parity is not promised. Today is explicitly a partial day and is no longer compared with yesterday’s entire day. No categories or filters are needed: the budget, score and both chat/background coach use the total. App names still require a separate choice. Update the computer setup to preserve the measurement metadata during Wi-Fi sync.
