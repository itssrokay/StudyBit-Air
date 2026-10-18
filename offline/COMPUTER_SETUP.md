# Learning Space on your Wi-Fi

Requirements: Node.js 22.13 or newer. No account or npm install is needed for the standalone download.

1. Unzip the computer setup into a folder you intend to keep.
2. In that folder, run `node server.mjs`.
3. Open `http://localhost:5180/` on this computer. The library works without login.
4. Open Settings → On this device. Copy the Wi-Fi address and connection code to the phone app’s Wi-Fi settings. Choose Save connection & sync on the phone.

Leave the server running when you want to sync. Without it, the phone continues using its own library. The connection code is persistent, not an expiring sign-in link. If the computer’s Wi-Fi IP changes, update the phone address. Guest Wi-Fi isolation or a firewall can block the connection.

Data and the code live in `.local-learning/` beside this setup. Keep that folder across restarts; it is not included in downloads. Back up the library through dashboard Settings. Existing hosted data can be exported once and restored here/on the phone. Original PDF/EPUB files and OpenAI keys are not transferred by sync.

Sync combines independent changes and asks which value to keep when both devices edit the same field. It does not silently replace a whole library. Wi-Fi traffic uses HTTP and a saved connection code; use this on your own trusted private network. Internet/public IPs are rejected for native app connections, and the library endpoints require the code. This server is not an internet deployment.

From the source project, use `npm run build:offline` followed by `npm run lan` instead. The standalone build already contains all browser assets and the Android APK at `/downloads/learning-space-android.apk`.


Version 0.12: update the computer setup together with the Android app. This release adds Personal/Work spaces, a capture inbox, resource covers, quick logs and daily progress cards while preserving earlier learning history. The app pauses sync with older computer servers to protect those fields. Keep the existing `.local-learning` folder when replacing server and www files; it contains your library and connection code.


## Automatic screen-time summaries (0.14)

Update both the Android app and computer setup to 0.14. Keep the existing `.local-learning` folder. In the phone’s Progress → Screen time → settings, enable phone usage and Android Usage access, classify Leisure apps, and turn on automatic daily summary sync. Usage refreshes on open/resume and every two minutes while the app is visible. Existing Wi-Fi auto-sync runs while the app is open; this is not a background Android monitoring service. The phone works locally without Wi-Fi.

For Mac foreground time, download `learning-space-mac-time.zip` from Progress → Screen time. It requires macOS 15 or newer and supports Apple Silicon and Intel. Unzip, open Learning Space Time, and choose Start tracking. The menu-bar companion records foreground app names and time only while running, and pauses during sleep or after one minute of inactivity. This is a new recording, not an import of Apple’s Screen Time history. It is ad-hoc signed, not Apple-notarized; review macOS’s security prompt before choosing to open it.

Open this computer’s local dashboard at `http://localhost:5180/`. In Screen-time settings, classify apps and optionally enable summary sync. The server reads the companion’s local file during normal phone sync even when the computer’s browser is closed. Keep the companion and this server running. Raw app records and preferences stay in `~/Library/Application Support/Learning Space/` with private file permissions. The optional shared summaries contain category totals; app names require a separate choice. Device-minutes may overlap.

“Let coach use synced screen time” is another explicit switch. It adds the available summaries to chats and session reviews using your existing key. Refresh and sync never trigger an AI call by themselves. The hosted website remains a separate library and can receive summaries through an exported backup.
