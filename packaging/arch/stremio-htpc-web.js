#!/usr/bin/env node

// Serves the web UI build to stremio-linux-shell on the loopback interface.
// Usage: stremio-htpc-web.js <build dir> <port>

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 11480);

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.map': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.wasm': 'application/wasm',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.txt': 'text/plain; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
};

const send = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(body);
};

const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

    let pathname;
    try {
        pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
        return send(res, 400, 'Bad request');
    }

    let file = path.join(root, pathname);
    if (file !== root && !file.startsWith(root + path.sep)) return send(res, 403, 'Forbidden');

    fs.stat(file, (err, stat) => {
        if (!err && stat.isDirectory()) {
            file = path.join(file, 'index.html');
            stat = fs.existsSync(file) ? fs.statSync(file) : null;
        }
        if (err || !stat || !stat.isFile()) return send(res, 404, 'Not found');

        res.writeHead(200, {
            'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
            'content-length': stat.size,
            'cache-control': 'no-cache',
        });
        if (req.method === 'HEAD') return res.end();
        fs.createReadStream(file).pipe(res);
    });
});

server.on('error', (err) => {
    // Another instance already serves the UI.
    if (err.code === 'EADDRINUSE') process.exit(0);
    console.error(err);
    process.exit(1);
});

server.listen(port, '127.0.0.1');

// Quit with the launcher, even if it gets killed.
const parent = process.ppid;
setInterval(() => {
    if (process.ppid !== parent) process.exit(0);
}, 2000).unref();
