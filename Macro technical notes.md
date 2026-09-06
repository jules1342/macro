# Macro: technical notes
> _Location: Projects / Personal / App Development / Macro_

Context that is not visible in the code, carried over from the session that built the app (31 July 2026). Read this before touching anything in Macro. Most of it was learned by trial and error and would cost real time to rediscover.

## Build and deploy

This is the biggest gotcha.

- `app/index.html` is a **built artefact, not source**. The JSX source is `macro.html` at the project root. Editing `index.html` directly is a trap. Edit the source and rebuild.
- Rebuild with `_build/build.js`, which inlines React from `_build/vendor/` and precompiles the JSX using the classic runtime.
- The build uses a **function replacement, not a string replacement**, because React's minified code contains `$` sequences that corrupt a string replace.
- It refuses to write if the compiled output fails to parse, or if any `unpkg` reference survives, so a broken build fails loudly rather than shipping.

**The build now runs on Julian's own machine, not in a container.** Node 24 and npm 11 are installed locally, `build.js` resolves its paths from its own location, and `_build/node_modules/` holds Babel. So the container-wipe ritual no longer applies: there is nothing to reinstall between sessions.

```bash
node "C:\Users\julia\⚡Claude Cowork\Projects\Personal\App Development\Macro\_build\build.js"
```

It prints the output path, the byte count, and the `BUILD_VERSION` it just wrote, so the string to check in Settings, Diagnostics is visible at build time.

## No CDN dependencies for the app itself

React and the JSX transpile are inlined. Do not reintroduce a CDN for them. The white-screen incident was caused by an unpinned `@babel/standalone` flipping to Babel 8.0.1 on 18 June and breaking in-browser transpiling. Inlining is the fix.

Two external references do remain, and both predate the inlining work:

- **Google Fonts** (Fraunces, IBM Plex Sans) via `<link>`. Degrades to the fallback stack if it fails.
- **`heic2any@0.0.4` from jsdelivr**, loaded lazily and only when a HEIC file is picked. It is version-pinned, which is what makes it safe: the white-screen incident was caused by an *unpinned* dependency, not by a CDN as such. If it ever needs touching, keep the pin.

## Netlify Drop and the stale URL problem

Netlify Drop mints a new URL on every drop, and the installed home-screen icon freezes on the old URL. This repeatedly left Julian several builds behind without realising.

- Verify what is actually live via **Settings, Diagnostics**, which shows the running build string.
- Claiming the Netlify site to get a stable URL would end this problem permanently.

## Device-specific findings

Pure trial and error, invisible in the code. Device is a Samsung Galaxy S22 Plus, Chrome 148, 8GB RAM, JS heap around 20MB. Memory was never the app's fault.

- **The native camera (`<input capture>`) was abandoned.** Android kills the backgrounded browser process when the camera app opens, which reloads the page and loses the photo. That is why capture uses `getUserMedia`. Do not switch back.
- **Lens 2 is the good lens on this device.** The auto-picked Lens 1 does not hold focus. The app remembers the choice in `macro_camera_device`, but first run still defaults to Lens 1. Anyone tempted to "fix" the lens heuristic needs to know Lens 2 is empirically correct here.

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

- Julian's real history (weights, daily calories, favourites) and his Anthropic API key are in browser localStorage only. The app cannot do any analysis without his key.
- The one-time import (`macro-import-step1`, `step2`, `targets.json`) is already done. Re-running it would duplicate data.

## Pre-ship checklist

Before every ship: validate the parse, audit for em dashes, bump `BUILD_VERSION`.
