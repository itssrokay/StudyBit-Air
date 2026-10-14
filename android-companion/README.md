# Learning Space for Android · 0.3.0

A native companion for the private Learning Space dashboard, with six resizable home-screen widgets. This is a development APK for personal testing, not a Play Store release.

## Use on your Samsung phone

1. Open the hosted dashboard on your phone and sign in with the account that owns the site. Download the APK from Settings → Android & widgets, and install it yourself.
2. Open Learning Space. If dashboard sign-in opens your browser, use the Browser button and continue there. Browser cookies and WebView cookies are separate; browser sign-in does not automatically sign the embedded dashboard in.
3. From the browser dashboard, choose Settings → Android & widgets → Share / export widget snapshot. Share the JSON file to Learning Space, or choose Widgets → Import widget snapshot inside the app.
4. Long press the Samsung home screen → Widgets → Learning Space. Choose Today’s plan, Streak, Daily goal, Next lesson, Reading, or Weekly rhythm. Choose Light or Forest and resize it. Widget style can be reconfigured from the launcher where supported. The app’s Widgets menu also offers pin requests.

Widgets use a validated local snapshot. They refresh when the embedded dashboard sends a snapshot or when you import/share one. Periodic widget rendering redraws the cached data; it does not fetch your account in the background. Date rollover clears today’s displayed minutes, and stale streaks reset after a missed day. Larger widgets show the last sync time. Small widgets open the app to inspect/refresh the snapshot.

The app opens external course URLs in a browser. The web dashboard extracts PDF/EPUB outlines locally and syncs chapter metadata; original files stay on the importing device. This companion does not include a native PDF/EPUB reader. Use your reading app for the original book. You can attach a matching original on another device without changing the learning plan.

## Implementation

Java framework Activity/WebView, RemoteViews, SharedPreferences, six AppWidgetProviders, and a configuration activity. Minimum API 26, target/compile API 34. One UI 9 / Android 17 device behavior still needs physical-phone testing.

Only Internet permission is requested. No OpenAI key, site session, or pairing credential is embedded in the APK. The JavaScript bridge accepts only bounded widget snapshots. Embedded navigation/bridge writes are restricted to the dashboard host; intent deep links are constrained to known pages or resource IDs. App data backup is disabled. Imported snapshots are validated and reduced to the allowed fields before storage.

## Build

The conventional Gradle project requires JDK 17+, Gradle 8.10.2, Android SDK platform 34, and build tools. Open this directory in Android Studio or run `gradle assembleDebug`. Android SDK setup/license acceptance is performed by the developer.

A lightweight macOS builder is also included and was used for the supplied APK:

```
python3 build-local.py
```

It uses Java 17+ and Python 3, downloads pinned/checksummed AAPT2/R8/apksig artifacts from Google Maven and Robolectric’s Android 14 framework artifact from Maven Central, compiles resources and Java, runs D8, signs with a generated local development certificate, verifies APK v2/v3 signatures, and runs native snapshot validation checks. Outputs go to `../public/downloads/learning-space-android.apk`. Toolchain and keystore are ignored under `.build/`. Keep the signing certificate if you want future APKs to update an installed development build. Gradle and this lightweight builder can use different debug certificates.

The supplied APK compiled successfully and passed signature/snapshot checks. Installation, authentication, rendering, resizing, launcher pinning, share intents, process recreation, and battery behavior have not been tested on a real Samsung device or emulator. The build host has no Android emulator or connected phone. This is the next device verification step, not a claim of completed Android QA.

Widget behavior follows the [Android widget overview](https://developer.android.com/develop/ui/views/appwidgets/overview) and [advanced widget guidance](https://developer.android.com/develop/ui/views/appwidgets/advanced).
