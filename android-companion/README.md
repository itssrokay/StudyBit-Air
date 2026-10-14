# Learning Space for Android · 0.5.0

The Android app now contains the full dashboard and saves its library on the phone. It opens without login, internet, or a computer. The private hosted website remains an optional, separate account-backed copy.

## Update from 0.3 / 0.4

Install the new APK over the existing app. Package name and signing certificate are unchanged, and version code increases to 6. Do not uninstall if you want to preserve existing app data and widget styles. This is a personal development build, not a Play Store release.

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

Enter a personal OpenAI key in the app’s Settings. Android Keystore encrypts it; neither the saved plaintext nor the encryption key is exposed to the dashboard. AI requests go directly from native code to OpenAI over HTTPS on an explicit request. Coaching excludes notes and validates resource references; grouping validates lesson IDs; book-name plans remain visibly inferred. AI needs internet, while deterministic planning and local imports do not. Hosted and phone keys are separate connections.

## Widgets

Six resizable native RemoteViews widgets: Today, Streak, Daily goal, Next lesson, Reading, and Weekly rhythm. Long press the Samsung home screen → Widgets → Learning Space, or request a pin from the app’s Widgets menu. Choose Light or Forest. Widget configuration supports reconfiguration where the launcher offers it.

The embedded dashboard refreshes a bounded snapshot as local progress changes, without browser sign-in or manual snapshot sharing. Widgets render that cached data, adjust daily minutes/streaks at rollover, and show freshness in larger layouts. They do not run background account/network synchronization when the app is closed.

## Build and verification

Run `npm run build:offline` in the web project first to populate `assets/dashboard`, then `python3 android-companion/build-local.py`. The builder pins and verifies Google Maven AAPT2/R8/apksig and Maven Central Robolectric Android artifacts, compiles Java/resources, includes the offline assets, signs with the existing local development certificate, verifies APK signatures, and checks native library persistence/revision rejection, LAN address restrictions, and widget snapshot validation. The keystore/toolchain remain ignored under `.build/`.

The Gradle project supports Android Studio/JDK 17+, Gradle 8.10.2, and Android SDK 34. Its assets source directory uses the prebuilt offline dashboard. Minimum API 26; target/compile API 34. [Android’s local-network permission guidance](https://developer.android.com/privacy-and-security/local-network-permission) says apps targeting SDK 36 or lower retain LAN access through INTERNET; do not request ACCESS_LOCAL_NETWORK until targeting SDK 37. This build requests only INTERNET and confines LAN calls in native code.

Checks cover the compiled APK, embedded offline files, v2/v3 signatures, native disk persistence after reopening, stale writes, and two independent browser replicas syncing through the computer server. A real Samsung Android 17 / One UI 9 device is not attached to the build host. Installation, Android Keystore, WebView callbacks, document picker/reading app, and launcher behavior still need device testing. The prior browser-login loop is removed structurally: the app’s initial URL is its bundled dashboard, not the hosted site.

References: [in-app WebView content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [Android widgets](https://developer.android.com/develop/ui/views/appwidgets/overview).
