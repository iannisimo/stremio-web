# Arch package: stremio-htpc-git

stremio-linux-shell (GTK4, WebKitGTK, libmpv playback, its own streaming
server) running this fork's UI.

```sh
cd packaging/arch
makepkg -si                                          # htpc branch from GitHub
STREMIO_HTPC_WEB_REPO=$PWD/../.. makepkg -si         # local clone, committed state only
```

Run `stremio-htpc` or "Stremio HTPC" from the launcher. Extra arguments go to
the shell (`stremio-htpc --dev` opens the WebKit inspector).

## How it fits together

| Path | What |
|---|---|
| `/usr/bin/stremio-htpc` | Launcher (`stremio-htpc.sh`) |
| `/usr/lib/stremio-htpc/stremio` | Shell binary, built from a pinned upstream commit |
| `/usr/lib/stremio-htpc/server.js` | Streaming server, started by the shell on 11470 |
| `/usr/lib/stremio-htpc/stremio-htpc-web.js` | Static server for the UI on `127.0.0.1:11480` |
| `/usr/share/stremio-htpc/web/` | UI build (service worker disabled, pacman updates it) |

- The UI has its own origin (`http://127.0.0.1:11480`), so the first start
  asks for a login. Changing `STREMIO_HTPC_PORT` changes the origin and logs out.
- The shell's `/proxy/d=` route can't serve it: newer server.js sandboxes any
  HTML that isn't from web.stremio.com, and the proxy only fetches https.
- CORS works because the shell starts server.js with `NO_CORS="0"`, which the
  server reads as truthy. Recheck this when bumping `_shellcommit`.
- Stremio, Stremio Enhanced and stremio-service also use port 11470; the
  launcher refuses to start while one of them runs.
- `STREMIO_HTPC_URL=<url> stremio-htpc` loads another UI instead of the
  packaged one (WebKit rejects the dev server's self-signed certificate).
- mpv reads `~/.config/mpv/mpv.conf` (shell setting `mpv-config-location`).
- Conflicts with `stremio-linux-shell` (same gschema, icon, desktop file id);
  coexists with the Qt `stremio` package.
