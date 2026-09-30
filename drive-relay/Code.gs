/**
 * App Data relay: Google Drive sync for Julian's phone apps (Macro, Receipts).
 *
 * Why this exists: a browser-only app can hold a Google Drive token for one hour
 * at most, and can only get a new one through a pop-up that needs a tap. So the
 * apps could never sync in the background and asked for sign-in again after
 * every restart. This script runs inside Julian's own Google account, so it
 * never needs a token from the phone. The apps POST to it and it reads and
 * writes Drive for them.
 *
 * It only touches My Drive / App Data / <app folder>, and only the apps listed
 * in APPS. Every call must carry the relay key (?k=...), which setup() creates.
 *
 * Setup (once, on a computer):
 *   1. script.google.com > New project. Name it "App Data relay". Replace
 *      Code.gs with this file. Save.
 *   2. Deploy > New deployment > gear > Web app.
 *      Execute as: Me. Who has access: Anyone. Deploy, then authorise
 *      (Advanced > Go to App Data relay > Allow; the warning is because you
 *      wrote the script yourself and Google has not reviewed it).
 *   3. Pick "setup" in the function menu and press Run. The log shows the
 *      relay link. It must end in /exec?k=... If it shows /dev or nothing, copy
 *      the Web app URL from Deploy > Manage deployments and add ?k=<key>.
 *   4. Get that link to the phone and paste it into Settings > Google Drive sync
 *      in each app.
 *
 * If you edit this file later: Deploy > Manage deployments > edit > Version:
 * New version. That keeps the same URL, so the apps keep working.
 */

const ROOT_NAME = 'App Data';
const APPS = { macro: 'Macros', receipts: 'Receipts' };

function doPost(e) {
  try {
    const key = PropertiesService.getScriptProperties().getProperty('RELAY_KEY');
    if (!key || !e.parameter || e.parameter.k !== key) {
      return reply_({ error: 'Relay key is wrong or missing. Copy the full link from the setup log again.' });
    }
    const req = JSON.parse(e.postData.contents);
    const sub = APPS[req.app];
    if (!sub) return reply_({ error: 'Unknown app: ' + req.app });
    const folder = appFolder_(sub);

    switch (req.action) {
      case 'ping':
        return reply_({ ok: true, folder: ROOT_NAME + ' / ' + sub, file: req.name ? info_(findByName_(folder, req.name)) : null });

      case 'list': {
        const files = [];
        const it = folder.getFiles();
        while (it.hasNext()) { const f = it.next(); if (!f.isTrashed()) files.push(info_(f)); }
        return reply_({ ok: true, files: files });
      }

      case 'getText': {
        const f = findByName_(folder, req.name);
        return reply_({ ok: true, text: f ? f.getBlob().getDataAsString('UTF-8') : null, file: info_(f) });
      }

      case 'putText': {
        let f = findByName_(folder, req.name);
        if (f) f.setContent(req.text);
        else f = folder.createFile(req.name, req.text, req.mime || 'application/json');
        return reply_({ ok: true, file: info_(f) });
      }

      case 'getFile': {
        const f = ownFile_(folder, req.id);
        const b = f.getBlob();
        return reply_({ ok: true, mime: b.getContentType(), data: Utilities.base64Encode(b.getBytes()) });
      }

      case 'putFile': {
        const blob = Utilities.newBlob(Utilities.base64Decode(req.data), req.mime || 'application/octet-stream', req.name);
        return reply_({ ok: true, file: info_(folder.createFile(blob)) });
      }

      case 'rename':
        ownFile_(folder, req.id).setName(req.name);
        return reply_({ ok: true });
    }
    return reply_({ error: 'Unknown action: ' + req.action });
  } catch (err) {
    return reply_({ error: String((err && err.message) || err) });
  }
}

function doGet() {
  return reply_({ ok: true, relay: 'App Data relay. The apps talk to this with POST.' });
}

// Run once from the editor after the first deploy. Creates the key and logs the link.
function setup() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('RELAY_KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    props.setProperty('RELAY_KEY', key);
  }
  Object.keys(APPS).forEach(function (a) { appFolder_(APPS[a]); }); // also confirms Drive access
  const url = ScriptApp.getService().getUrl();
  Logger.log('Relay key: ' + key);
  Logger.log(url ? 'Relay link: ' + url + '?k=' + key : 'No web app URL yet. Deploy first, then run setup again.');
}

// App Data may exist more than once: the old in-app Google sign-in could only
// see folders it made itself, so it sometimes created a second one. Prefer the
// copy that already holds this app's folder with files in it.
function appFolder_(sub) {
  const props = PropertiesService.getScriptProperties();
  const cached = props.getProperty('FOLDER_' + sub);
  if (cached) {
    try { const f = DriveApp.getFolderById(cached); if (!f.isTrashed()) return f; } catch (_) {}
  }
  const roots = live_(DriveApp.getRootFolder().getFoldersByName(ROOT_NAME));
  let found = null, fallback = null;
  roots.forEach(function (r) {
    live_(r.getFoldersByName(sub)).forEach(function (s) {
      if (!fallback) fallback = s;
      if (!found && s.getFiles().hasNext()) found = s;
    });
  });
  let folder = found || fallback;
  if (!folder) folder = (roots[0] || DriveApp.getRootFolder().createFolder(ROOT_NAME)).createFolder(sub);
  props.setProperty('FOLDER_' + sub, folder.getId());
  return folder;
}

function live_(it) { const out = []; while (it.hasNext()) { const x = it.next(); if (!x.isTrashed()) out.push(x); } return out; }

function findByName_(folder, name) {
  if (!name) return null;
  const files = live_(folder.getFilesByName(name));
  files.sort(function (a, b) { return b.getLastUpdated() - a.getLastUpdated(); });
  return files[0] || null;
}

// Only files inside the app's own folder can be read or renamed by id.
function ownFile_(folder, id) {
  const f = DriveApp.getFileById(id);
  const parents = f.getParents();
  while (parents.hasNext()) if (parents.next().getId() === folder.getId()) return f;
  throw new Error('That file is not in the app folder.');
}

function info_(f) {
  return f ? { id: f.getId(), name: f.getName(), modifiedTime: f.getLastUpdated().toISOString(), size: f.getSize() } : null;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
