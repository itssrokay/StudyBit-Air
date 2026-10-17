# Learning Space for Android · 0.11.0

The Android app now contains the full dashboard and saves its library on the phone. It opens without login, internet, or a computer. The private hosted website remains an optional, separate account-backed copy.

## Update from 0.3 / 0.4

Install the new APK over the existing app. Package name and signing certificate are unchanged, and version code increases to 12. Do not uninstall if you want to preserve existing app data and widget styles. This is a personal development build, not a Play Store release.

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
