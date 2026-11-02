#!/bin/bash
# Stremio HTPC: stremio-linux-shell running the HTPC web UI.
#
# STREMIO_HTPC_URL=<url>  load another UI (e.g. a dev server) instead of the packaged one
# STREMIO_HTPC_PORT=<n>   port of the packaged UI (default 11480; the login is tied to it)

LIB=/usr/lib/stremio-htpc
WEB=/usr/share/stremio-htpc/web
PORT=${STREMIO_HTPC_PORT:-11480}

export SERVER_PATH=$LIB/server.js
# Video acceleration with Vulkan for Intel
export ANV_DEBUG=${ANV_DEBUG:-video-decode,video-encode}
# GSK OpenGL renderer for Nvidia cards
if [ -e /dev/nvidia0 ]; then
    export GSK_RENDERER=${GSK_RENDERER:-opengl}
fi

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

fail() {
    echo "stremio-htpc: $1" >&2
    command -v notify-send >/dev/null && notify-send -a "Stremio HTPC" "Stremio HTPC" "$1"
    exit 1
}

# The shell starts its own streaming server on 11470. Another one there
# (Stremio, Stremio Enhanced, stremio-service) refuses our UI's origin.
if ! pgrep -f "^$LIB/stremio( |$)" >/dev/null && port_open 11470; then
    fail "Port 11470 is used by another streaming server (Stremio, Stremio Enhanced or stremio-service). Close it and try again."
fi

if [ -n "$STREMIO_HTPC_URL" ]; then
    exec "$LIB/stremio" --url "$STREMIO_HTPC_URL" "$@"
fi

node "$LIB/stremio-htpc-web.js" "$WEB" "$PORT" &
web=$!
trap 'kill $web 2>/dev/null' EXIT
trap 'exit 130' INT TERM HUP

for _ in $(seq 50); do
    port_open "$PORT" && break
    sleep 0.05
done

"$LIB/stremio" --url "http://127.0.0.1:$PORT/" "$@"
