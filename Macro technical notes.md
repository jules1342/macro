# Macro: technical notes
> _Location: Projects / Personal / App Development / Macro_

Context that is not visible in the code. Read this before touching anything in Macro. Most of it was learned by trial and error and would cost real time to rediscover.

## Build and deploy

`app/index.html` is a **built artefact, not source**. The JSX source is `macro.html`. Editing the built file is a trap: edit the source and rebuild.

```bash
node "_build/build.js"
```

`build.js` inlines React from `_build/vendor/` and precompiles the JSX with the classic runtime. It uses a **function replacement, not a string replacement**, because React's minified code contains `$` sequences that corrupt a string replace. It refuses to write if the compiled output fails to parse, if an `unpkg` reference survives, or if an em dash is in the source. It prints the `BUILD_VERSION` it wrote, so the string to check in Settings, Diagnostics is visible at build time.

Babel lives in `_build/node_modules/`. Three "Cannot find module @babel/preset-react" failures looked like the synced folder pruning it, and were not: Babel resolves preset **names** against the working directory, so `node _build/build.js` from the project root failed while `cd _build && node build.js` worked. The preset is now required by absolute path, so the build runs from any cwd. `build.js` also reinstalls Babel if it is genuinely absent, and `_build/package.json` declares it.

**Deploy is a push.** The folder is a git repo on `github.com/jules1342/macro`, and a GitHub Actions workflow publishes `app/` on every push to `main`. `_build/deploy.cmd` builds, commits and pushes in one step. The site updates about a minute later, and the phone picks it up on the next open, because the service worker fetches the page network-first.

The address is fixed:

    https://jules1342.github.io/macro/

This replaced Netlify Drop, which minted a new URL on every drop and repeatedly left Julian several builds behind. It also matters for Drive: Google only allows sign-in from a registered origin, so **this address must never change**.

## The icon

`_build/icons.js` draws both sizes from scratch with zlib, no dependencies, in the app palette. Run it after any change:

```bash
node "_build/icons.js"
```

The icons are cached **cache-first** by the service worker, so a new icon will not appear until `CACHE` in `app/sw.js` is bumped. On Android the installed home-screen icon is baked in at install time, so an icon change also needs the app removed and re-added to the home screen.

## No CDN dependencies for the app itself

React and the JSX transpile are inlined. Do not reintroduce a CDN for them. The white-screen incident was caused by an unpinned `@babel/standalone` flipping to Babel 8.0.1 on 18 June and breaking in-browser transpiling. Inlining is the fix.

Three external references remain, all deliberate:

- **Google Fonts** (Fraunces, IBM Plex Sans) via `<link>`. Degrades to the fallback stack if it fails.
- **`heic2any@0.0.4` from jsdelivr**, loaded lazily and only when a HEIC file is picked. It is version-pinned, which is what makes it safe: the June incident was an *unpinned* dependency, not a CDN as such. Keep the pin.
- **`accounts.google.com/gsi/client`**, loaded only when Drive sync is tapped. Google will not issue a token any other way, and it is never in the boot path.

## Google Drive sync

One file, at `App Data/Macros/macro.json`. `DRIVE_PATH` holds that as an array and `driveFolder` walks it from the Drive root, creating anything missing. A shared "App Data" folder holding one folder per app is the standing convention for Julian's apps.

The catch to remember: every app must reuse THIS OAuth client ID. `drive.file` lets a client see only files it created, so an app given its own client would be blind to the shared `App Data` folder and would silently create a duplicate beside it. All of Julian's apps are served from `https://jules1342.github.io`, so one client ID legitimately covers them all. Macro's whole state is a single localStorage object, so unlike Receipts there are no images to reconcile: sync overwrites the file, restore replaces the device. Restore sits behind a two-tap confirm. The API key and the client ID are stripped from the payload.

The client ID is compiled into `macro.html` as `DRIVE_CLIENT_ID`, so there is nothing to paste on the phone: Settings shows a Connect Google Drive button and the ordinary Google account picker. Client IDs are public by design, the way every Sign in with Google app ships one in its JavaScript, and the `drive.file` scope limits the app to files it created itself. The origin restriction is what protects it, which is why the site address is fixed. Setup steps are in `README.md`.

The code is ported from Receipts and **has never completed a real round trip** in either app. It needs Julian's Google account and the live URL, so the first run on the phone is the real test.

## The model

`claude-opus-5`, with adaptive thinking left on (its default) and `output_config.effort` set to `low`.

Three things follow from that and are easy to break:

- **`max_tokens` covers thinking as well as the reply.** The budgets are 5000 for vision calls and 4000 for text. They look generous for a small JSON payload because most of it is headroom for thinking. Cutting them back truncates answers mid-JSON.
- **Thinking is the point, not a side effect.** It is what makes the model do the per-100g arithmetic properly instead of recalling a whole-item figure. Turning it off would undo the accuracy work.
- **`effort` is the latency dial, and it is set for speed.** `low`, because Julian wants logging quick. Opus 5 holds up unusually well at `low`, but it is still the first thing to raise if estimates drift, before touching prompts or budgets.

## Averages must window on dates, not on entries

Julian weighs in every few days, not daily. So "the last 7 entries" is not "the last 7 days"; it is closer to three weeks. Two calculations made that mistake and were corrected on 10 August: the headline rolling average, and the weight chart's own trend line. Both now filter on a calendar window.

The symptom is worth recognising, because it is quiet: the headline kg/week disagreed with the kg/wk figures in the TDEE section, which were always date-based and always right. If those two numbers ever diverge again, an entry-based window has crept back in.

The related fix: the TDEE intake loop stops before the final weigh-in day. `daysSpan` is elapsed time between two weigh-ins, so the intake days have to match it. Counting the last day too produced impossible coverage like "15/14 days".

## Decisions that look wrong but are not

- **Label energy.** The model only transcribes raw kJ and kcal. The code does the kJ to kcal conversion. This is deliberate, because the model gets the arithmetic wrong. Do not have the model output kcal directly.
- **Portion maths** prefers the printed per-serving values over per-100g, to stop rounding drift.
- **The recovery beacon and banner code** is effectively dead now that `getUserMedia` does not reload, but it is left in harmlessly.

## State that lives on the phone, not in the repo

- Julian's real history (weights, daily calories, favourites) and his Anthropic API key are in browser localStorage only, tied to the site address. The app cannot do any analysis without his key.
- **Storage does not follow a change of address.** Moving hosts strands the data on the old URL, and if that URL stops resolving the app cannot load to export it. Export first, always. This is why the GitHub Pages address is fixed.
- The one-time import (`macro-import-step1`, `step2`, `targets.json`) is already done. Re-running it would duplicate data.

## Pre-ship checklist

Before every ship: bump `BUILD_VERSION`, build (the parse and em dash checks are enforced by `build.js`), then push. Confirm the new string in Settings, Diagnostics on the phone.
