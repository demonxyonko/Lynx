# Setup
Requirements: Node 20+, npm 10+.
```bash
npm install && npm run dev      # open http://localhost:5173/Lynx/
npm run build && npm run preview
```
`npm install` generates `package-lock.json`; commit it so CI uses `npm ci` (the workflow falls back to `npm install` if it is missing).

**Install on Android:** open https://demonxyonko.github.io/Lynx/ in Chrome → ⋮ → *Install app* (or *Add to Home screen*).
It then launches full-screen. Camera/mic prompts appear only when you tap scan/mic.

**Local testing against your PC:** `http://localhost` is allowed to call `http://localhost:<port>`, so on the PC itself you can pair to
`http://localhost:8002` (or 8000 if TLS is off) once the CORS patch is applied. From a phone you need an HTTPS address (see PAIRING.md).
