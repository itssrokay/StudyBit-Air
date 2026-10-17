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


Version 0.11: update the computer setup together with the Android app. This release adds to-dos, photo goals, and milestone rewards while preserving reading text and activity removal records. The app pauses sync with older computer servers to protect those fields. Keep the existing `.local-learning` folder when replacing server and www files; it contains your library and connection code.
