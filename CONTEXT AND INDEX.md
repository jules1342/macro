# CONTEXT AND INDEX: Macro
> _Location: Projects / Personal / App Development / Macro_

## Context
Macro is a phone app that Julian built for himself. The user photographs a food label or a meal, gets the macros, and logs them against daily targets. It runs as an installed PWA on his phone. To deploy it, drop the built `app/` folder onto Netlify. His real data and his Anthropic API key live in browser localStorage on the phone, not here. Thus you cannot do an end-to-end test of the app from this workspace.

Two things govern all work in this folder. First, `macro.html` is the source and `app/index.html` is the build output. Edit the source, then rebuild. Second, several decisions in the app look wrong until you know their reasons. The technical notes cover both.

## Index
- **DECISIONS.md**: between-session memory. Task state lives in the root `CURRENT STATUS.md`.
- **Macro technical notes.md**: primary source. Build and deploy, the model configuration, device-specific findings, decisions that look wrong but are not, and the pre-ship checklist. Read it before you do work on Macro.
- **macro.html**: primary source. The JSX source for the whole app, and the only file to edit.
- **_build/**: primary source. `build.js` compiles `macro.html` into `app/index.html` and inlines React from `vendor/`. `node_modules/` holds Babel so the build runs offline with no reinstall.
- **app/**: deliverable. The built app, ready to deploy: `index.html`, `manifest.webmanifest`, `sw.js` and the two icons. This is the folder that goes to Netlify. Never edit it by hand. Each build overwrites it.
- **import/**: primary source. The three one-time import files that seeded Julian's history. They are already used. If you run them again, they make duplicate data.
- **2026-07-31 Built app/**: superseded. A snapshot of the June build, kept only until Julian agrees that it can go.
