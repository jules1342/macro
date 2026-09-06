# CONTEXT AND INDEX: Macro
> _Location: Projects / Personal / App Development / Macro_

## Context
Macro is a phone app that Julian built for himself. The user photographs a food label or a meal, gets the macros, and logs them against daily targets. Weight, calories and protein each get a trend chart. It runs as an installed PWA on his phone.

This folder is a git repo, pushed to `github.com/jules1342/macro`. A GitHub Actions workflow publishes `app/` on every push, so the live address never changes:

    https://jules1342.github.io/macro/

Three things govern all work here. First, `macro.html` is the source and `app/index.html` is the build output. Edit the source, then rebuild. Second, several decisions in the app look wrong until you know their reasons; the technical notes cover them. Third, browser storage is tied to the site address, so Julian's data and API key live on the phone under that URL, not here. Thus you cannot do an end-to-end test of the app from this workspace, and a change of address strands the data.

## Index
- **DECISIONS.md**: between-session memory. Task state lives in the root `CURRENT STATUS.md`.
- **README.md**: primary source. The repo's own front page. Build, deploy, phone install, the Google Drive setup steps, export and import.
- **Macro technical notes.md**: primary source. The model configuration, device-specific findings, the calculation traps, decisions that look wrong but are not, and the pre-ship checklist. Read it before you do work on Macro.
- **macro.html**: primary source. The JSX source for the whole app, and the only file to edit.
- **_build/**: primary source. `build.js` compiles `macro.html` into `app/index.html` and inlines React from `vendor/`. `icons.js` draws the two icons. `deploy.cmd` builds, commits and pushes in one step. `package.json` declares Babel, and the build reinstalls it when the synced folder prunes `node_modules/`.
- **app/**: deliverable. The built app that GitHub Pages serves. `index.html` is generated on every build and must never be edited by hand. `manifest.webmanifest`, `sw.js` and the two icons are static, and `sw.js` is edited in place.
- **import/**: primary source, and git-ignored. The three one-time import files that seeded Julian's history. They hold his real weights and calorie history, so they must never be committed to the public repo. They are already used, and running them again makes duplicate data.
- **2026-07-31 Built app/**: primary source. The June build, kept as a known-good rollback. Not the current app.
- **.github/workflows/pages.yml**: primary source. The action that publishes `app/` on every push to `main`.
