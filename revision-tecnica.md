# Revisión técnica — aplicaweb

**Fecha:** 17 sep 2026
**Versión revisada:** 0.10.0
**Alcance:** código, datos, repositorio Git y servidor en ejecución

---

## 1. Estado general

El proyecto está **coherente y funcional**: los tres archivos JS pasan `node --check` sin errores, el servidor Node arranca correctamente en el puerto 5720 y responde tanto estáticos como API, el árbol de Git está limpio y sincronizado con `origin/main`, y la versión `0.10` está consistente en `package.json`, `index.html`, `admin.html` y los query strings de cache busting.

La arquitectura es clara: frontend vanilla + API REST en Node nativo + persistencia en archivos JSON, con panel de administración autenticado por token.

### Estructura

| Archivo | Tamaño | Rol |
|---|---|---|
| `index.html` | 1.9 KB | Portfolio público (carrusel + trabajos + contacto) |
| `styles.css` | 9.3 KB | Estilos del portfolio |
| `script.js` | 10.8 KB | Carrusel dinámico, render de proyectos, formulario |
| `admin.html` | 12.0 KB | Panel de control (login, CRUD, ajustes, import GitHub) |
| `admin.css` | 19.4 KB | Estilos del panel |
| `admin.js` | 21.8 KB | Login, CRUD vía API, subida de imagen, integración GitHub |
| `server.js` | 6.2 KB | Servidor HTTP + API REST + estáticos |
| `data/proyectos.json` | 1.3 KB | 4 proyectos |
| `data/config.json` | 0.1 KB | Config del sitio (todos los campos vacíos) |
| `.htaccess` | 0.1 KB | Rewrite para Apache (sin uso en Node) |
| `package.json` | 0.3 KB | Metadatos, script `start` |
| `README.md` | 3.3 KB | Documentación |

---

## 2. Hallazgos críticos

### 2.1 El servidor expone el código fuente y el repositorio Git

`server.js` sirve **cualquier** archivo dentro de `BASE_DIR` (líneas 175-183). La única validación es que la ruta no salga del directorio, lo que no impide leer archivos internos.

Verificado en ejecución real (servidor levantado y sondeado):

```
/                      -> 200 (1930 bytes)   index.html
/api/proyectos         -> 200 (1363 bytes)   OK
/data/config.json      -> 200 (95 bytes)     config interna expuesta
/server.js             -> 200 (6390 bytes)   código fuente expuesto
/.git/config           -> 200 (373 bytes)    configuración de Git expuesta
/package.json          -> 200 (345 bytes)
```

El caso más grave es `/.git/`: con acceso a `.git/config`, `.git/HEAD` y los objetos, cualquiera puede **reconstruir el repositorio completo e íntegro** (incluido cualquier secreto que haya pasado por el historial). El `.htaccess` bloquea directorios en Apache, pero **Node lo ignora por completo**, así que la protección no aplica al servidor real.

**Corrección sugerida:** lista blanca de extensiones servibles (`.html .css .js .png .jpg .webp .svg .ico`) y denegar explícitamente rutas que empiecen por `.git` o `data/`; o mover los archivos públicos a una carpeta `public/` separada.

### 2.2 Contraseña de administración codificada y versionada

`server.js:8`:

```js
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminWeb26';
```

La contraseña está en texto plano **en el repositorio público de GitHub** (`https://github.com/leonnnc/aplicaweb`). Cualquiera que lea el repo obtiene acceso total al panel: puede borrar proyectos y reescribir la configuración del sitio. La variable de entorno existe pero es un *fallback*: si no se define, la clave por defecto sigue activa.

**Corrección sugerida:** eliminar el valor por defecto, exigir `ADMIN_PASSWORD` al arrancar y rotar la contraseña actual (la del historial ya debe considerarse comprometida).

### 2.3 Sin `.gitignore` y con datos de usuario versionados

No existe `.gitignore`, y `data/config.json` y `data/proyectos.json` están **trackeados**. Consecuencias:

- Las imágenes subidas desde el panel se guardan como base64 dentro de `proyectos.json`; cada cambio de imagen entra al historial de Git y el repositorio crece de forma irreversible.
- Los datos reales (email de contacto, ID de Formspree, URLs personales) se publican en GitHub.
- Es el mismo motivo por el que el punto 2.1 es tan grave: los datos sensibles ya están en `.git`.

---

## 3. Hallazgos medios

### 3.1 El README describe una versión que ya no existe

El README corresponde al proyecto anterior a la API REST. Contradicciones concretas:

| Dice el README | Realidad |
|---|---|
| Almacenamiento en `localStorage` del navegador | Archivos JSON en `data/` vía API REST |
| Puerto `http://localhost:3000` | Puerto 5720 |
| Contraseña por defecto `admin123` | `AdminWeb26`, configurable por `ADMIN_PASSWORD` |
| "Puedes cambiarla en la primera línea de `admin.js`" | Está en `server.js:8`, no en `admin.js` |
| Estructura sin `data/` ni `.htaccess` | Ambos existen |
| Sin mención de importación desde GitHub | `admin.js` incluye buscador de repos completo |

### 3.2 El despliegue documentado dejaría el portfolio vacío

El README propone GitHub Pages y cPanel como opciones de publicación. En ambos casos **solo se suben archivos estáticos**, por lo que `/api/proyectos` y `/api/config` devuelven 404. `script.js` entonces cae al fallback de `localStorage`… que **nunca se rellena**: nada en el código escribe las claves `portfolio_proyectos` ni `portfolio_site_config` (verificado por búsqueda global: solo hay `getItem`, ningún `setItem`).

Resultado: el portfolio publicado mostraría *"No hay proyectos creados aún"* de forma permanente. El sitio **solo funciona con `node server.js` en marcha**.

### 3.3 Fallback que trata una lista vacía legítima como error

`script.js:22`:

```js
if (Array.isArray(data) && data.length > 0) return data;
```

Si el servidor responde con `[]` (caso válido: se borraron todos los proyectos), se descarta la respuesta y se recurre al almacenamiento local. Hoy es inocuo porque ese almacenamiento está siempre vacío, pero es una condición incorrecta que ocultaría datos si algún día se implementa caché local.

### 3.4 Autenticación sin caducidad ni límite de intentos

- Los tokens se guardan en un `Set` en memoria (línea 19) y **nunca expiran** ni se invalidan hasta reiniciar el servidor. Un token filtrado sirve indefinidamente.
- `/api/login` no tiene *rate limiting* ni retardo progresivo: se puede probar contraseñas por fuerza bruta sin fricción.
- Los tokens no se limpian nunca, así que la memoria crece con cada login.

### 3.5 Deuda de mantenimiento del cache busting

La versión `?v=0.10` está escrita a mano en 4 puntos (`index.html` ×2, `admin.html` ×2) más el logo del nav y el footer como `v0.10`, además de `package.json`. Cada release exige editar 7 lugares a mano; un olvido deja a los usuarios con CSS/JS cacheados y comportamiento inconsistente.

---

## 4. Observaciones menores

- **`escapeHtml` duplicado** en `script.js` y `admin.js` (11 líneas idénticas en ambos).
- **Compresión de imagen a JPEG fijo** (`admin.js:413`, `toDataURL('image/jpeg', 0.82)`): una imagen PNG con transparencia pierde el canal alfa y el fondo se vuelve negro.
- **Tamaño de imágenes**: se reescalan a máx. 1000×1000 pero sin límite de peso; como base64 infla ~33 %, varias imágenes pueden hacer que `proyectos.json` supere varios MB y ralentizar la carga del portfolio.
- **El `id` del proyecto se regenera** en cada edición (`Date.now()`), por lo que el ID mostrado no es estable. No rompe nada porque el panel trabaja por índice, pero es frágil: si dos pestañas están abiertas, el índice guardado puede apuntar a un proyecto distinto (condición de carrera en `list[+id]`).
- **Bloqueo del clic derecho** (`admin.js:99`) es puramente cosmético; no aporta seguridad real.
- **`.htaccess`** con `RewriteRule ^$ index.html` no tiene efecto bajo Node.
- **`mimeTypes`** no cubre `.webp`, `.woff`, `.woff2` ni `.json` con `charset` (este último sí está, pero sin charset).
- **Sin `Content-Length`** en las respuestas estáticas; el servidor tampoco soporta *range requests* ni compresión.
- **`ADMIN_PASSWORD` se compara con `===`**: una comparación no constante en tiempo no es un problema práctico aquí, pero es un detalle si el proyecto crece.
- **Sin tests, sin linter y sin `.editorconfig`**.

---

## 5. Prioridades sugeridas

| # | Acción | Motivo |
|---|---|---|
| 1 | Cerrar la exposición de `.git`, `data/` y código fuente en `server.js` | Cualquiera puede descargar el repo completo |
| 2 | Rotar la contraseña y exigir `ADMIN_PASSWORD` por entorno, sin valor por defecto | La clave actual está publicada en GitHub |
| 3 | Crear `.gitignore` y sacar `data/` del control de versiones | Datos personales e imágenes en el historial |
| 4 | Reescribir el README y corregir la sección de despliegue | Induce a un deploy que se ve roto |
| 5 | Caducidad de tokens + límite de intentos en login | Endurecer la autenticación |
| 6 | Centralizar la versión (una sola fuente) | Eliminar el error manual del cache busting |
| 7 | Extraer `escapeHtml` a un módulo compartido | Eliminar duplicación |

---

## 6. Lo que está bien

- Separación limpia entre sitio público y panel de administración.
- Sanitización XSS (`escapeHtml`) aplicada de forma sistemática al renderizar datos.
- Protección contra *path traversal* en el servidor de estáticos (correcta, aunque insuficiente por el punto 2.1).
- Resiliencia del carrusel: si no hay proyectos, muestra un estado vacío en lugar de romperse.
- Compresión de imágenes en el cliente antes de subirlas.
- Sin dependencias externas: cero `npm install`, cero superficie de ataque por paquetes de terceros.
- Historial de commits claro y con mensajes descriptivos en español.
