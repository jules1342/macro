# DECISIONS: Macro
> _Location: Projects / Personal / App Development / Macro_

## Broader task
Build and maintain Macro, Julian's personal food and macro tracker app.

## Decisions
- **Working preferences for this project.** No em dashes, ever. Australian English. AUD by default. Be concise, give pushback, and flag uncertainty.
- **2026-08-10, the model is Opus 5 with thinking on at low effort.** Julian's call, made twice. Estimation errors were the complaint, and thinking makes the model do the arithmetic rather than recall it. He then set effort to low, because logging must be quick. Raise effort first if estimates drift.
- **2026-08-10, the model never recalls a whole-item macro figure.** It works from per-100g values scaled to a stated weight, then reconciles them against the 4/4/9 factors. Recall of finished per-item numbers was the source of the egg error.
- **2026-08-10, portion size is judged against a reference object in frame** (cutlery, plate, mug, can, hand), not estimated directly. The model names the reference it used.
- **2026-08-10, the intake charts smooth over 14 days, not 7.** Seven made the line too spiky to show a trend. Weight keeps its own 7-day average, which Julian did not ask to change.
- **2026-08-10, deletes confirm with two taps rather than a dialog.** The edit sheet already used a Delete then Confirm pair, so the same idiom now covers food entries, weigh-ins and favourites. The armed state clears itself after 3 seconds.
- **2026-08-10, rolling averages count calendar days, never weigh-in entries.** Taking the last N entries had become "the last N weigh-ins". At Julian's weigh-in frequency that spans three weeks, so the headline kg/week disagreed with the TDEE section. Any new average must window on dates.
- **2026-08-10, TDEE intake days stop before the final weigh-in day.** Food eaten on the morning of the last weigh-in has not moved that weigh-in yet. Counting it overstated coverage, which showed as "15/14 days", and misaligned the energy balance.
- **2026-09-06, GitHub Pages is the host, not Netlify.** Julian's call. The address is fixed at `https://jules1342.github.io/macro/`, and a push deploys it, so no drag and drop and no minted URL. Google only allows Drive sign-in from a registered origin, so this address must never change.
- **2026-09-06, the repo is public and the personal data is git-ignored.** Free Pages needs a public repo. `import/` holds Julian's real weights and calorie history, so it is excluded. The app code carries no key and no data, so publishing it costs nothing.
- **2026-09-06, Drive sync keeps one JSON file, not a merge.** Macro's whole state is one localStorage object, so `macro.json` in a "Macro App" folder is the entire backup. Sync overwrites it, restore replaces the device behind a two-tap confirm. The API key is never in the payload. Ported from Receipts, and untested until Julian creates the OAuth client.
- **2026-09-06, the icon is an apple.** Julian's pick from five options (cutlery, bars, apple, egg, gauge, kept in `_build/icon-options.js`). Drawn by `_build/icons.js` in the app palette on the cream ground. `_build/icons.js` regenerates both sizes. Bump the service worker cache name whenever an icon changes, or the old one stays cached.
- **2026-09-06, the model breaks a plate into items and gives an everyday measure.** Julian's ask. Each item carries its own grams, macros and a measure you can picture (a palm, a fist, a cup). Top-level totals must equal the sum of the items, and the prompt says to add them explicitly.
- **2026-09-06, the save button sits above the result card, not below it.** So an estimate can be accepted without scrolling past the editable fields.
- **2026-09-06, Today can step back through days.** Arrows on the header, a Today chip when looking back, and + logs to the day shown. Never forward past today.
- **2026-09-06, saved meals live only under +, not on Today.** Julian tried a favourites block on Today and removed it the same day: adding always starts from +, so the block was a duplicate. The Saved tab is two sub-tabs, Favourites and Recent.
- **2026-09-06, the Weight tab is Trends.** It holds weight, calories, protein and a maintenance-over-time chart. Each TDEE dot is a 21-day trailing window whose endpoints are the 7-day average weight, not a single weigh-in, and the line is a 14-day average of the dots. Julian's call: averaging the endpoints is what removes the noise, so the window can be short enough to show change within a month. The headline TDEE windows use the same averaged endpoints so the two agree. The five-window breakdown is collapsed by default. The range selector has a 1Y option and stays pinned to the top while scrolling, so it can be changed from any chart.
- **2026-09-06, History is grouped by month,** current month open, so a long history is a few sections rather than every day mounted at once.
- **2026-09-06, photo meals keep a 256px thumbnail,** about 10 KB, so History and Edit can show what was eaten. If storage fills, the day is saved again without its images and the user is told, rather than the entry vanishing.
- **2026-09-06, backups are a whitelist.** Only profile, targets, weights, favourites and the daily logs. The camera lens choice, the error log and the crash beacon are device-specific and used to ride into Drive and onto the next phone.
- **2026-09-06, long explanations sit behind an (i) toggle.** `InfoNote` shows a one-line summary with an i button that reveals the paragraph. Used for the maintenance-over-time method, the energy-balance note, and the Drive and Backup blurbs. Use it for any new explanatory text longer than a line.
- **Date keys are built from local time, never `toISOString()`.** In Australia the UTC date is yesterday for most of the evening. `dateStr()` is the one helper for this.
- **No CDN dependencies.** React and the JSX transpile are inlined at build time. In June, an unpinned `@babel/standalone` changed its version and broke the app. The inline build is the fix.
- **Capture uses `getUserMedia`, not the native camera.** Android kills the browser in the background when the camera app opens, and the photo is lost. Do not return to `<input capture>`.
- **The model transcribes raw kJ and kcal only. The code converts.** The model gets the arithmetic wrong.
- **Portion maths uses printed per-serving values over per-100g**, to avoid rounding drift.
