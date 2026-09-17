# aplicaweb — Portfolio Personal

Portfolio web dinámico con panel de administración propio. Los proyectos se gestionan desde el navegador y se guardan en el servidor, sin tocar código.

---

## Vista general

- **Carrusel hero** generado automáticamente a partir de los proyectos: cada proyecto aporta su propio slide con título, descripción, color o imagen de fondo
- **Sección de trabajos** donde cada proyecto ocupa el ancho completo de la pantalla, alternando el lado de la imagen
- **Panel de control** para agregar, editar y eliminar proyectos sin editar ningún archivo
- **Importación desde GitHub**: busca tus repositorios y rellena el formulario automáticamente
- **Formulario de contacto** configurable con Formspree
- Diseño **responsivo** para móvil, tablet y escritorio

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Servidor | Node.js (módulo `http` nativo, sin dependencias) |
| Persistencia | Archivos JSON en `data/` a través de una API REST |
| Autenticación | Contraseña por variable de entorno + token Bearer en memoria |
| Control de versiones | Git + GitHub |

No hay dependencias externas: no hace falta `npm install`.

---

## Estructura del proyecto

```
aplicaweb/
├── index.html            # Sitio público (carrusel, trabajos, contacto)
├── styles.css            # Estilos del sitio público
├── script.js             # Carrusel, render de proyectos y formulario
├── admin.html            # Panel de control
├── admin.css             # Estilos del panel
├── admin.js              # Login, CRUD, subida de imágenes, importación de GitHub
├── server.js             # Servidor HTTP + API REST + archivos estáticos
├── data/
│   ├── proyectos.json    # Los proyectos del portfolio
│   └── config.json       # Ajustes del sitio (título, enlaces, email, Formspree)
├── .htaccess             # Rewrite para hosting Apache (no lo usa Node)
├── .gitignore
└── README.md
```

---

## Requisitos

- Node.js 18 o superior (probado con Node 22)
- Puerto 5720 libre — o el que definas con la variable `PORT`

---

## Cómo usar

### 1. Clonar el repositorio

```bash
git clone https://github.com/leonnnc/aplicaweb.git
cd aplicaweb
```

### 2. Definir la contraseña del panel

La contraseña **ya no está en el código**: se lee de la variable de entorno `ADMIN_PASSWORD`.

```bash
# Linux / macOS
export ADMIN_PASSWORD="tu-contraseña"

# Windows (PowerShell)
$env:ADMIN_PASSWORD="tu-contraseña"
```

> Si no la defines, el servidor genera una contraseña aleatoria en cada arranque y la imprime en la consola. Sirve para probar, pero cambia cada vez que reinicias.

### 3. Levantar el servidor

```bash
node server.js
```

Abre tu navegador en **http://localhost:5720**

### 4. Acceder al panel de control

Navega a **http://localhost:5720/admin.html** e introduce la contraseña que definiste.

---

## Panel de control

### Proyectos

Cada proyecto tiene: nombre, descripción, categoría, estado, tags, imagen o color de fondo, URL de la web y URL de GitHub.

- **Agregar** un proyecto nuevo
- **Editar** cualquier proyecto existente
- **Eliminar** proyectos
- Los cambios se escriben en `data/proyectos.json` y se reflejan al recargar el sitio

**Estados disponibles:** `En Progreso`, `Completado`, `Próximamente`
**Categorías disponibles:** `Web`, `Diseño`, `App`, `Otro`

### Imágenes

Puedes arrastrar una imagen o seleccionarla desde el explorador. Se redimensiona a un máximo de 1000×1000 píxeles y se comprime en el navegador antes de subirse, y se guarda como base64 dentro de `data/proyectos.json`.

**Ojo con esto:** al ir en base64 dentro del JSON, cada imagen engorda el archivo y, si el proyecto está en Git, engorda también el historial de forma irreversible. Conviene subir imágenes ya ligeras.

### Importación desde GitHub

En la vista de proyecto, el botón **Buscar en GitHub** lista los repositorios de un usuario y rellena el formulario con los datos del repo elegido (nombre, descripción, lenguaje, URL, temas). El usuario y el token personal se guardan en el `localStorage` del navegador — úsalos solo desde tu equipo personal.

### Ajustes

Título del portfolio, URL de GitHub, URL de LinkedIn, email de contacto y Formspree Form ID.

---

## API REST

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/login` | No | Devuelve un token a cambio de la contraseña |
| GET | `/api/proyectos` | No | Lista de proyectos |
| POST | `/api/proyectos` | Token Bearer | Reemplaza la lista completa de proyectos |
| GET | `/api/config` | No | Ajustes del sitio |
| POST | `/api/config` | Token Bearer | Reemplaza los ajustes del sitio |

Ejemplo de login:

```bash
curl -X POST http://localhost:5720/api/login \
  -H "Content-Type: application/json" \
  -d '{"password":"tu-contraseña"}'
```

Los tokens se guardan en memoria del servidor: se pierden al reiniciar y no caducan mientras el proceso siga vivo.

---

## Personalización

### Cambiar los colores del tema

En `styles.css`, sección `:root`:

```css
:root {
  --bg: #0d0d0d;       /* fondo principal */
  --text: #f0f0f0;     /* color de texto */
  --border: rgba(255,255,255,0.08);
}
```

### Cambiar el puerto

```bash
PORT=8080 node server.js
```

---

## Despliegue

### Hosting con Node.js (recomendado)

Es la única forma de que el panel de administración funcione de verdad. Sube el proyecto a un hosting que ejecute Node y:

1. Define la variable de entorno `ADMIN_PASSWORD`
2. Ejecuta `node server.js` (o `npm start`)
3. El proceso debe tener permiso de escritura sobre `data/`

### Vercel

El proyecto está desplegado como función serverless. Ten en cuenta tres cosas:

1. **Define `ADMIN_PASSWORD`** en *Settings → Environment Variables*. Si no lo haces, el panel usará una contraseña aleatoria distinta en cada arranque y no podrás entrar.
2. **El sistema de archivos es de solo lectura.** Los cambios que hagas desde el panel no se guardan: `data/proyectos.json` se lee del repositorio, así que la única forma de actualizar el contenido es hacer commit y push.
3. **Debe incluirse el proyecto entero**, no solo `server.js`. Si el despliegue incluye únicamente el servidor y `data/`, todas las páginas devolverán *"Archivo no encontrado"*, porque `server.js` sirve el HTML y el CSS desde el mismo directorio.

### GitHub Pages y hosting estático

**No funcionan con esta versión.** El sitio obtiene los proyectos de `/api/*`, y en un hosting estático esas rutas no existen: el portfolio se quedaría permanentemente vacío. Para usarlos habría que volver a un esquema sin API.

---

## Seguridad

- La contraseña del panel se lee siempre de `ADMIN_PASSWORD`. No hay ninguna clave por defecto en el código.
- El servidor solo sirve archivos del sitio. El repositorio Git, la carpeta `data/`, `server.js`, `package.json` y los archivos ocultos responden 404, de modo que no se puede descargar el código fuente ni los datos.
- Los `POST` de la API exigen token Bearer.
- El endpoint de login no tiene límite de intentos ni retardo progresivo: conviene protegerlo con un proxy o un WAF si el sitio va a estar expuesto en internet.
- Los tokens no caducan mientras el servidor siga en marcha.

---

## Licencia

MIT — libre para usar, modificar y compartir.

---

*Hecho con HTML, CSS y JavaScript puro, y un servidor Node sin dependencias.*
