# Architecture
```
UI (pages/, components/)  →  hooks/useLynx (state, one provider)  →  services/  →  PC LYNX dashboard
```
| Layer | Files |
|---|---|
| Services | `lynxApi` (fetch, timeout, error classification, scheme guard) · `authService` (pair/login) · `pairingService` (QR parse/scan) · `chatService` (WebSocket + command send) · `deviceService` (capabilities, optional `/ws/native` bridge) · `voiceService` |
| Lib | `crypto` (AES-256-CBC, same scheme as `dashboard/server.py`) · `store` (localStorage) · `errors` (human-readable messages) · `format` |
| State | `useLynx` holds link state (`demo/connecting/online/offline/unauthorized`), PC state (`active/sleeping`), messages, prefs. UI never calls `fetch` directly. |

**Identity model.** PC LYNX *is* the assistant (Gemini Live session in `main.py`). The phone injects commands into that session and
receives its `log` broadcasts, so there is one personality and one conversation. Replies spoken by the PC are also shown here.

**Known gaps vs "shared memory".** `memory/memory_manager.py` is not exposed over HTTP. The phone sees the PC's last ~50 broadcasts
(in-memory, replayed on connect) plus a local 200-message cache. A real shared-memory API would be a new PC endpoint (not invented here).

**Offline.** `public/sw.js` caches the app shell only; API and cross-origin traffic is never cached. AI needs the PC.
