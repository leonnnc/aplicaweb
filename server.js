const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5720;
const BASE_DIR = __dirname;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminWeb26';
const DATA_DIR = path.join(BASE_DIR, 'data');
const PROYECTOS_FILE = path.join(DATA_DIR, 'proyectos.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Asegurar que exista la carpeta data
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Almacén de tokens activos en memoria
const validTokens = new Set();

function generateToken() {
  const token = crypto.randomBytes(24).toString('hex');
  validTokens.add(token);
  return token;
}

function verifyAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  return Boolean(token && validTokens.has(token));
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  // Sanitizar la URL: quitar query string y decodificar
  const rawUrl = req.url.split('?')[0];
  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('URL inválida');
    return;
  }

  // ===== RUTAS API =====
  if (rawUrl.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // POST /api/login
    if (req.method === 'POST' && rawUrl === '/api/login') {
      getRequestBody(req).then(data => {
        if (data.password === ADMIN_PASSWORD) {
          const token = generateToken();
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, token }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ success: false, error: 'Contraseña incorrecta' }));
        }
      }).catch(() => {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
      });
      return;
    }

    // GET /api/proyectos
    if (req.method === 'GET' && rawUrl === '/api/proyectos') {
      fs.readFile(PROYECTOS_FILE, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(200);
          res.end('[]');
          return;
        }
        res.writeHead(200);
        res.end(data || '[]');
      });
      return;
    }

    // POST /api/proyectos (Protegido)
    if (req.method === 'POST' && rawUrl === '/api/proyectos') {
      if (!verifyAuth(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, error: 'No autorizado' }));
        return;
      }
      getRequestBody(req).then(data => {
        fs.writeFile(PROYECTOS_FILE, JSON.stringify(data, null, 2), err => {
          if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: 'Error al escribir archivo' }));
            return;
          }
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        });
      }).catch(() => {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
      });
      return;
    }

    // GET /api/config
    if (req.method === 'GET' && rawUrl === '/api/config') {
      fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(200);
          res.end('{}');
          return;
        }
        res.writeHead(200);
        res.end(data || '{}');
      });
      return;
    }

    // POST /api/config (Protegido)
    if (req.method === 'POST' && rawUrl === '/api/config') {
      if (!verifyAuth(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, error: 'No autorizado' }));
        return;
      }
      getRequestBody(req).then(data => {
        fs.writeFile(CONFIG_FILE, JSON.stringify(data, null, 2), err => {
          if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: 'Error al escribir archivo' }));
            return;
          }
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        });
      }).catch(() => {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
      });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
    return;
  }

  // ===== SERVIR ARCHIVOS ESTÁTICOS =====
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
