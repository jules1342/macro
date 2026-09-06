# Macro: build, deploy, set up

## What it is
A phone web app (PWA) that logs food and macros. Photograph a nutrition panel or a meal, Claude reads it, and the entry files against daily targets. Weight, calories and protein each get a trend chart. Data lives in this browser's storage on the phone. Backup is a JSON export, or Google Drive sync once the OAuth client is set up.

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

## Google Drive sync (optional, one-time setup, about 10 minutes)
The app needs an OAuth client ID that is allowed to run from this site's address.

1. Go to https://console.cloud.google.com and sign in with the Google account whose Drive you want to use.
2. Create a project, any name.
3. APIs & Services, Library, search for "Google Drive API", Enable.
4. APIs & Services, OAuth consent screen. Choose External, fill in the app name and your email, and add yourself as a test user.
5. APIs & Services, Credentials, Create credentials, OAuth client ID, Web application.
   Under **Authorised JavaScript origins** add exactly:

       https://jules1342.github.io

   Origins are scheme plus host only, with no path, so the `/macro/` part is left off.
6. Copy the Client ID (it ends in `.apps.googleusercontent.com`). In the app: Settings, Google Drive sync, paste it, Save.
7. Tap Sync to Drive. Google asks you to sign in and allow "See, edit, create and delete only the specific Google Drive files that you use with this app". That scope means the app can only touch files it created.

The app keeps a folder called "Macro App" in your Drive holding one `macro.json`. Sync overwrites it with the current device state. Restore pulls it back and replaces this device's data, so a new phone can be set up from it. Sync is manual: tap it after a change worth keeping.

The client ID is not a secret. OAuth client IDs are public by design, and the origin restriction is what protects them.

Note: the Drive code could not be exercised from the build machine, because it needs your Google account and the live site URL. Expect to report back on the first try.

## Export and import
Settings, Backup & data. Export JSON writes a dated file to your downloads. Import JSON reads it back and overwrites the matching keys. Neither touches the API key.

Storage is tied to the site address. Data saved on one URL is invisible on another, so export before any move between hosts.
