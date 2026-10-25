/**
 * Zero-Dependency Local Static HTTP Server for TECHTIS (techtis.in)
 * High-performance, cross-platform static server supporting clean directory URLs.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.wasm': 'application/wasm',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

function createServer(port) {
    const server = http.createServer((req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Parse requested path
        const parsedUrl = new URL(req.url, `http://localhost:${port}`);
        let pathname = decodeURIComponent(parsedUrl.pathname);

        if (pathname === '/' || pathname === '') {
            pathname = '/index.html';
        }

        let filePath = path.join(ROOT_DIR, pathname);

        // Directory index support (/merge-pdf/ -> /merge-pdf/index.html)
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            const stat = fs.statSync(filePath);

            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stat.size,
                'Cache-Control': 'no-cache'
            });

            if (req.method === 'HEAD') {
                res.end();
                return;
            }

            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`404 Not Found: ${req.url}`);
        }
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, trying ${port + 1}...`);
            createServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });

    server.listen(port, () => {
        console.log('==========================================================');
        console.log(' TECHTIS - Serverless Zero-Cost PDF Platform (techtis.in)');
        console.log('==========================================================');
        console.log(` Local server running at: http://localhost:${port}/`);
        console.log(` Root Directory: ${ROOT_DIR}`);
        console.log(' Press Ctrl+C in this console to stop the server.');
        console.log('==========================================================');
    });

    return server;
}

createServer(Number(process.env.PORT) || 8080);
