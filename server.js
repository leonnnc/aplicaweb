const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5720;
const BASE_DIR = __dirname;

// La contraseña del panel se lee SIEMPRE del entorno: no hay ningún valor por
// defecto en el código, para que el repositorio no contenga una clave utilizable.
// Si no se define ADMIN_PASSWORD se genera una aleatoria en cada arranque.
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = crypto.randomBytes(15).toString('base64url');
  console.warn('AVISO: no se ha definido la variable de entorno ADMIN_PASSWORD.');
  console.warn('Se ha generado una contraseña temporal para este arranque:');
  console.warn(`  ${ADMIN_PASSWORD}`);
  console.warn('Defínela para tener una contraseña estable entre reinicios.');
}

const DATA_DIR = path.join(BASE_DIR, 'data');
const PROYECTOS_FILE = path.join(DATA_DIR, 'proyectos.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Asegurar que exista la carpeta data
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ===== ARCHIVOS DEL SITIO =====
// Los archivos estáticos se resuelven a partir de la URL de cada petición, así
// que el análisis estático que Vercel aplica al empaquetar la función (Node File
// Trace) no puede deducir cuáles son y los deja fuera del despliegue. Eso hacía
// que el sitio respondiera 404 en todas sus páginas mientras la API funcionaba.
//
// Las comprobaciones de abajo usan rutas literales: sirven para declarar los
// archivos al empaquetador y, de paso, avisan en el log si un despliegue llega
// incompleto.
const archivosFaltantes = [];
try { fs.statSync(path.join(BASE_DIR, 'index.html')); } catch (e) { archivosFaltantes.push('index.html'); }
try { fs.statSync(path.join(BASE_DIR, 'styles.css')); } catch (e) { archivosFaltantes.push('styles.css'); }
try { fs.statSync(path.join(BASE_DIR, 'script.js')); } catch (e) { archivosFaltantes.push('script.js'); }
try { fs.statSync(path.join(BASE_DIR, 'admin.html')); } catch (e) { archivosFaltantes.push('admin.html'); }
try { fs.statSync(path.join(BASE_DIR, 'admin.css')); } catch (e) { archivosFaltantes.push('admin.css'); }
try { fs.statSync(path.join(BASE_DIR, 'admin.js')); } catch (e) { archivosFaltantes.push('admin.js'); }

if (archivosFaltantes.length > 0) {
  console.warn('AVISO: faltan archivos del sitio en este despliegue: ' + archivosFaltantes.join(', '));
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

// ===== CONTROL DE ARCHIVOS PÚBLICOS =====
// El servidor solo sirve archivos del sitio. Todo lo demás (repositorio Git,
// datos del portfolio, código del servidor y de configuración) queda fuera.

const PUBLIC_EXTENSIONS = new Set([
  '.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.webp',
  '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.txt',
]);

// Directorios internos que nunca deben servirse.
const BLOCKED_DIRS = new Set(['data', 'node_modules', '.git', '.vercel', '.vscode']);

// Archivos internos que nunca deben servirse.
const BLOCKED_FILES = new Set(['server.js', 'package.json', 'package-lock.json']);

function isPublicFile(requestedPath) {
  if (!requestedPath) return false;

  const segments = requestedPath.split('/').filter(Boolean);
  if (segments.length === 0) return true; // raíz -> index.html

  // Nada que empiece por punto (.git, .htaccess, .env, .vercel...)
  if (segments.some(s => s.startsWith('.'))) return false;

  // Directorios internos
  if (BLOCKED_DIRS.has(segments[0].toLowerCase())) return false;

  const last = segments[segments.length - 1];

  // Archivos internos concretos
  if (BLOCKED_FILES.has(last.toLowerCase())) return false;

  // Lista blanca de extensiones. También se permite una ruta sin extensión
  // para poder servir el index.html de un subdirectorio.
  const ext = path.extname(last).toLowerCase();
  return ext === '' || PUBLIC_EXTENSIONS.has(ext);
}

function sendNotFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Archivo no encontrado');
}

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

  // Solo se sirven archivos del sitio. Las rutas internas (repositorio Git,
  // datos, código del servidor) responden 404, igual que una ruta inexistente.
  if (!isPublicFile(requestedPath)) {
    sendNotFound(res);
    return;
  }

  let filePath = path.join(BASE_DIR, requestedPath);

  // Protección path traversal: el archivo debe estar dentro de BASE_DIR
  if (!filePath.startsWith(BASE_DIR + path.sep) && filePath !== BASE_DIR) {
    sendNotFound(res);
    return;
  }

  fs.stat(filePath, (statErr, stats) => {
    if (statErr) {
      sendNotFound(res);
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
        sendNotFound(res);
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
