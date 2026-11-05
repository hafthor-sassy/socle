#!/usr/bin/env node
// Serveur local sans dépendance, qui imite GitHub Pages : site servi sous /socle/
// avec l'en-tête Access-Control-Allow-Origin: * (nécessaire aux démos en iframe sandbox).
// Usage : node scripts/serve.mjs [port]  →  http://localhost:4000/socle/
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2]) || 4000;
const BASE = '/socle/';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.jsx': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/' || url.pathname === '/socle') { res.writeHead(302, { Location: BASE }); return res.end(); }
  if (!url.pathname.startsWith(BASE)) { res.writeHead(404); return res.end('Introuvable'); }
  let file = path.normalize(path.join(root, decodeURIComponent(url.pathname.slice(BASE.length))));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
    res.end('Introuvable');
  }
}).listen(port, () => console.log(`Socle : http://localhost:${port}${BASE}`));
