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

Google reorganised this part of the console in 2024 and 2025. There is no longer a page called "OAuth consent screen". It is now **Google Auth Platform**, split into Branding, Audience, Data Access and Clients. Older guides on the web still describe the old layout.

1. Go to https://console.cloud.google.com and sign in with the Google account whose Drive you want to use. Create a project, any name, and make sure it is selected in the bar at the top.
2. **Enable the API.** APIs & Services, Library, search for "Google Drive API", Enable.
3. **Open Google Auth Platform.** Type it into the console search bar. On a new project you get a **Get started** button instead of the tabs. It asks for four things in order:
   - **App Information**: app name, and a user support email from the dropdown.
   - **Audience**: choose **External**. Internal is only for Workspace organisations.
   - **Contact Information**: your email address.
   - **Finish**: agree to the Google API Services User Data Policy, then **Create**.
4. **Publish the app.** On the **Audience** page, click **Publish app**.

   Do not leave it in Testing. A Testing app expires each authorisation after 7 days, so sync would break about weekly and need re-consenting. The `drive.file` scope this app uses is **non-sensitive**, because it only reaches files the app itself created, so publishing does not trigger Google's verification review. If it ever does ask for verification, go back to Testing and add yourself under **Test users**, **Add users**, and accept the weekly re-consent.
5. **Create the client.** Left sidebar, **Clients**, **Create client**. Application type **Web application**, name it anything. Under **Authorised JavaScript origins**, **Add URI**, and enter exactly:

       https://jules1342.github.io

   Scheme and host only. No `/macro/` path and no trailing slash. This is the most common mistake. Leave **Authorised redirect URIs** empty, because the app uses the token flow and never redirects.
6. **Create**, then copy the **Client ID**, which ends in `.apps.googleusercontent.com`. Ignore the client secret, which is only for server-side apps. Set it as `DRIVE_CLIENT_ID` near the top of `macro.html`, then rebuild and push. It is compiled into the app, so there is nothing to paste on the phone.
7. In the app: Settings, Google Drive sync, **Connect Google Drive**, and sign in. Then tap **Sync to Drive**. Google asks you to sign in and allow "See, edit, create and delete only the specific Google Drive files that you use with this app". That scope means the app can only touch files it created.

The app keeps `App Data/Macros/macro.json` in your Drive. One shared "App Data" folder holding a folder per app is the convention for all of Julian's apps. For it to hold, every app must reuse this same OAuth client ID: the `drive.file` scope lets a client see only files it created, so an app on its own client would be blind to the shared folder and would create a duplicate. All the apps sit on `https://jules1342.github.io`, so one client covers them. Sync overwrites it with the current device state. Restore pulls it back and replaces this device's data, so a new phone can be set up from it. Sync is manual: tap it after a change worth keeping.

The client ID is not a secret. OAuth client IDs are public by design, the way every Sign in with Google app ships one in its JavaScript, and the origin restriction is what protects them. Ours is committed to this public repo deliberately. To rotate it, delete the client in the Google Cloud console and create a new one; do not try to scrub git history.

Note: the Drive code could not be exercised from the build machine, because it needs your Google account and the live site URL. Expect to report back on the first try.

## Export and import
Settings, Backup & data. Export JSON writes a dated file to your downloads. Import JSON reads it back and overwrites the matching keys. Neither touches the API key.

Storage is tied to the site address. Data saved on one URL is invisible on another, so export before any move between hosts.
