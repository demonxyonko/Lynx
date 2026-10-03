# LYNX Mobile (Phone Lynx)

An installable PWA that makes your phone a second client of your **PC LYNX**. Same assistant, same conversation — the AI,
memory and personality stay on the PC; this app is the phone-side interface (text, voice, device status, pairing).

- Live site: https://demonxyonko.github.io/Lynx/ · Repo: https://github.com/demonxyonko/Lynx
- Stack: React 18 · TypeScript · Vite 5 · hash routing · service worker · no UI framework, no paid services.

## Quick start
```bash
npm install        # also creates package-lock.json — commit it
npm run dev        # http://localhost:5173/Lynx/
npm run build      # type-checks, then builds to dist/
```
Push to `main` and the workflow in `.github/workflows/deploy.yml` publishes to GitHub Pages
(Repo → Settings → Pages → Source: **GitHub Actions**).

## What you must do on the PC (one-time)
PC LYNX works with this app only after two things — details in `docs/PAIRING.md`:
1. Add a 3-line CORS allowance to `dashboard/server.py` (not modified here; patch provided).
2. Expose the PC's dashboard over **HTTPS** (Tailscale or Cloudflare Tunnel). A GitHub Pages app cannot call `http://192.168.x.x`.

Until then the app runs in clearly-labelled **Demo mode** and never claims a connection.

## What works / what doesn't
| Works (when paired) | Not possible in a browser PWA |
|---|---|
| Pair with the PC's 6-char code or QR (`/api/native-pair`) | Tap/swipe other apps, screenshots, read notifications, open apps (needs the native Android app) |
| Reconnect with a device token (`/api/device-login`) | Background connection while the app is closed |
| Send encrypted commands (`/api/command`), live replies (`/ws`), wake PC (`/api/wake`) | AI that works without the PC |
| Speech input / voice output (Web Speech, Chrome) | Token-by-token streaming (the PC sends whole turns) |
| Battery, vibration, clipboard, notifications where Chrome allows | |
| Offline app shell, installable | |

Not built yet: phone-mic streaming to the PC (`/ws/phone-audio`), file upload (`/api/upload`), shared long-term memory (the PC exposes no memory API).

Docs: `docs/SETUP.md` · `docs/ARCHITECTURE.md` · `docs/PAIRING.md` · `docs/DEPLOYMENT.md`
