# VaultX website

Static GitHub Pages site for VaultX (no build step, no add-on code on this branch).

| Page | Content |
|---|---|
| `index.html` | Hero, highlights, live password-generator demo, how it works, screenshots, FAQ |
| `features.html` | Autofill, generator, vault, Security Center, sync & backups, import/export, unlock, productivity |
| `passkeys.html` | VaultX as passkey provider, passkey inventory |
| `security.html` | Encryption model, defense in depth, audits |
| `install.html` | Firefox, Chromium, Firefox for Android, build from source, Google Drive setup |
| `privacy.html` | Privacy policy |

Assets: `assets/css/site.css` (light/dark design system), `assets/js/site.js` (theme, nav, reveal,
tabs, lightbox, scroll-spy, generator demo — progressive enhancement), `assets/img/` (screenshots).

## Publish
GitHub → **Settings › Pages** → Source: *Deploy from a branch* → Branch: `website`, folder `/ (root)`.
The site is then served at `https://<owner>.github.io/vaultx/`.

## Preview locally
```bash
python3 -m http.server 8000
```
