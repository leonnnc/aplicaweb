const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5720;
const BASE_DIR = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Sanitizar la URL: quitar query string y decodificar
  const rawUrl = req.url.split('?')[0];
  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch {
    res.writeHead(400);
    res.end('URL inválida');
    return;
  }

  const requestedPath = rawUrl === '/' ? 'index.html' : decodedUrl.replace(/^\/+/, '');
  let filePath = path.join(BASE_DIR, requestedPath);

  // Protección path traversal: el archivo debe estar dentro de BASE_DIR
  if (!filePath.startsWith(BASE_DIR + path.sep) && filePath !== BASE_DIR) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acceso denegado');
    return;
  }

  fs.stat(filePath, (statErr, stats) => {
    if (statErr) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Archivo no encontrado');
      return;
    }

    // Si es un directorio, servir index.html si existe dentro del mismo
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Archivo no encontrado');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
