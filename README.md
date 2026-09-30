# Macro: build, deploy, set up

## What it is
A phone web app (PWA) that logs food and macros. Photograph a nutrition panel or a meal, Claude reads it, and the entry files against daily targets. Weight, calories and protein each get a trend chart. Data lives in this browser's storage on the phone. Backup is a JSON export, or automatic Google Drive sync through the App Data relay.

Hosted on GitHub Pages at https://jules1342.github.io/macro/

## Files
- `macro.html` is the only source file. Edit this.
- `_build/build.js` compiles it into `app/index.html` with React inlined. Never edit `app/index.html` by hand.
- `app/` is the folder that deploys. It holds `index.html`, `manifest.webmanifest`, `sw.js` and two icons.
- `import/` holds the one-time import of Julian's history. It is git-ignored, because it is real health data. Do not commit it.

## Build
```
node "_build/build.js"
```
Bump `BUILD_VERSION` in `macro.html` before every ship. Settings, Diagnostics shows the running build string on the phone, so you can tell what is live. The build refuses to write if the compiled code fails to parse, if an unpkg reference survives, or if an em dash is in the source.

Babel lives in `_build/node_modules/`, which is git-ignored. If it goes missing:
```
npm install --no-save @babel/core @babel/preset-react
```

## Deploy
A GitHub Actions workflow (`.github/workflows/pages.yml`) publishes `app/` on every push to `main`.

To ship a change: edit `macro.html`, bump `BUILD_VERSION`, build, then commit and push. `_build/deploy.cmd` does all three in one go. The site updates about a minute after the push, and the phone picks it up on the next open, because the service worker fetches the page network-first.

## Install on the phone
Open the site in Chrome on Android, tap the menu, Add to Home screen. It opens full screen and works offline.

## Claude API key
Settings, paste the key from console.anthropic.com. It stays in the browser storage on the phone, and calls go straight to Anthropic. It is never included in an export or a Drive sync. Extraction uses `claude-opus-5` at low effort.

## Google Drive sync (optional, one-time setup, about 5 minutes)

Sync goes through the **App Data relay**, a small Google Apps Script that runs in your own Google account (`drive-relay/Code.gs`). The phone never signs in to Google, so nothing expires and sync runs on its own. One relay serves both Macro and Receipts.

Why not the old in-app Google sign-in: a browser-only app can hold a Drive token for one hour at most, and getting another needs a tap on a Google pop-up. So it could never sync in the background, and it asked you to sign in again after every restart.

1. On a computer, go to https://script.google.com, **New project**, name it "App Data relay". Replace the contents of `Code.gs` with `drive-relay/Code.gs` from this repo. Save.
2. **Deploy, New deployment**, gear icon, **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy. Authorise when asked; Google warns the app is unverified because you wrote it yourself, so choose Advanced, Go to App Data relay, Allow.
3. In the function menu pick **setup** and press **Run**. The log shows the relay link, ending `/exec?k=...`. If it shows `/dev` or nothing, copy the Web app URL from Deploy, Manage deployments, and add `?k=` plus the key from the log.
4. Get the link to the phone (email or message it to yourself). In the app: Settings, Google Drive sync, paste it, **Link Google Drive**. Pasting it in Macro links Receipts too.

What happens next:
- A phone that has synced before starts auto-syncing straight away.
- A phone that never has (a new phone), where Drive already holds a backup, waits: tap **Restore from Drive** to pull the backup, or **Sync now** to replace it. This stops an empty new phone overwriting your history.
- After that, every change is pushed to `App Data/Macros/macro.json` about 8 seconds later, and again when the app goes to the background or reopens if a push was cut off.

The relay link is the only credential. Keep it private and never commit it: this repo is public. To revoke it, delete the deployment (or change the key in the script's properties and run setup again).

If you edit the script later: Deploy, Manage deployments, edit, Version: New version. That keeps the same link.

## Export and import
Settings, Backup & data. Export JSON writes a dated file to your downloads. Import JSON reads it back and overwrites the matching keys. Neither touches the API key.

Storage is tied to the site address. Data saved on one URL is invisible on another, so export before any move between hosts.
