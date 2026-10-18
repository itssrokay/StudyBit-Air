Learning Space Time · macOS 15+ companion v0.14

1. Extract the ZIP and open Learning Space Time.app. This is a locally built, ad-hoc signed app, not an App Store or notarised release; macOS may require you to review it in Privacy & Security before opening.
2. Choose Start tracking in its first-run prompt. A ◷ menu-bar icon lets you pause, resume, open the dashboard, or quit.
3. Run the updated Learning Space computer Wi-Fi server. In its dashboard, open Progress → Focus & Balance → Settings. Assign app categories, choose a leisure budget, and optionally enable summary sync.
4. Pair your Android app with the computer as usual. Foreground Wi-Fi sync brings approved per-device daily summaries to the phone. The computer server imports fresh Mac summaries when the phone syncs, even if the computer browser is closed.

The tracker measures foreground app time from when it starts. It pauses during sleep and after one minute of inactivity. It does not import Apple's historical Screen Time database, read URLs, window titles, page text, or keystrokes. Browser apps are mixed/unclassified until you categorise them. Concurrent phone and Mac use is reported as device-minutes, not elapsed free time.

Raw app totals stay in ~/Library/Application Support/Learning Space/usage.json. Settings are in settings.json in the same private folder. Only daily category totals sync by default; optional leisure app names need their own switch. AI sees summaries only if enabled separately in Coach context. No automatic API calls are made by this companion.

Quit stops tracking. To launch it after login, add the app through macOS System Settings → General → Login Items. The app does not install a hidden login agent.
