# Pairing & PC integration

## Endpoints used (all exist in `dashboard/server.py`)
| Endpoint | Use |
|---|---|
| `POST /api/native-pair` `{key}` → `{ok, token, key, device_token}` | First pairing with the one-time 6-char code |
| `POST /api/device-login` `{device_token}` → `{ok, token, key}` | Silent reconnect |
| `POST /api/command` `{enc}` (Bearer) | Send a command. `enc` = base64(IV‖AES-256-CBC), key = SHA-256(sessionKey+`LYNX-DASHBOARD-v1`) |
| `POST /api/wake` (Bearer) | Wake PC LYNX |
| `WS /ws?token=` | `log` / `status` / `sys` broadcasts |
| `WS /ws/native?token=` | Optional: lets PC `mobile_control` reach the phone; PWA answers only `status`, `device_info`, `toast` |

## Pairing flow
1. PC LYNX → **Remote Control** shows a code/QR (`lynx://pair?host=…&port=…&key=ABC234`, valid 10 min, single use).
2. Phone: scan the QR (Chrome `BarcodeDetector`) or type the code, and enter your **HTTPS PC link**.
3. The QR is validated (scheme `lynx:`, host chars, port range, key alphabet). Only the **key** is used; the QR's host is never
   contacted automatically, because it is a LAN `http://` address that an HTTPS page cannot call.
4. Stored: server address + device token + prefs + last 200 messages in `localStorage`. The session token and AES key stay in memory.
   Limitation: any script on this origin can read `localStorage`; the device token is revocable (`/api/revoke-devices`).

## Required PC change #1 — CORS (not applied; apply yourself)
`dashboard/server.py` has no CORS middleware, so browsers block calls from github.io. In `_build_app`, right after `app = FastAPI(...)`:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["https://demonxyonko.github.io"],
                   allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])
```
## Required PC change #2 — HTTPS reachability
Pages is HTTPS → mixed-content rules forbid `http://` hosts, and the PC's self-signed certificate is not trusted by background fetches.
Put a trusted HTTPS front in front of the plain-HTTP native port (8002 when TLS is on, else 8000):
- **Tailscale** (preferred): `tailscale serve` the local port, install Tailscale on the phone; traffic stays on your tailnet.
- **Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:8002`. The URL is public — add Cloudflare Access.
WebSockets must be passed through (both do).

## Security notes
- The server's pairing key has no attempt rate-limit and device tokens live in PC memory (lost on restart → re-pair). Don't expose it publicly without an access layer.
- `config/certs/lynx.key` and `config/api_keys.json` in the desktop ZIP are secrets: they were not read into or copied to this project. Rotate the Gemini key if that ZIP was shared.
- No API keys exist in this app; the Gemini key stays on the PC.
