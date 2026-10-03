# Deployment (GitHub Pages)
1. Create/use https://github.com/demonxyonko/Lynx, push this project to `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. The workflow installs, runs `npm run build` (tsc + vite, base `/Lynx/`) and deploys `dist/`.
4. Open https://demonxyonko.github.io/Lynx/ in Android Chrome → Install.

Base path lives in `vite.config.ts` (`base`), `index.html`/`manifest.webmanifest` (absolute `/Lynx/…`), and `sw.js` (relative URLs).
If you rename the repo, update those three. Routing is hash-based, so no 404 rewrites are needed. Updating: push; the SW refreshes the shell on next online load.
