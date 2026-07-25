# aplicaweb — Portfolio Personal

Página web de portfolio personal para presentar y compartir trabajos de forma profesional. Diseño minimalista, limpio y enfocado en mostrar cada proyecto con impacto visual.

---

## Vista general

- **Carrusel hero** en la página principal con frases de presentación
- **Sección de trabajos** donde cada proyecto ocupa el ancho completo de la pantalla
- **Panel de control (admin)** para agregar, editar y eliminar proyectos sin tocar el código
- **Formulario de contacto** para que quien visite el portfolio pueda escribirte
- Diseño **responsivo** para móvil, tablet y escritorio

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Servidor local | Node.js (http nativo) |
| Almacenamiento | localStorage del navegador |
| Control de versiones | Git + GitHub |

---

## Estructura del proyecto

```
aplicaweb/
├── index.html      # Página principal del portfolio
├── styles.css      # Estilos del portfolio
├── script.js       # Lógica del portfolio (carrusel, proyectos dinámicos)
├── admin.html      # Panel de control
├── admin.css       # Estilos del panel
├── admin.js        # Lógica del panel (login, CRUD de proyectos)
├── server.js       # Servidor local Node.js
└── README.md
```

---

## Cómo usar

### 1. Clonar el repositorio

```bash
git clone https://github.com/leonnnc/aplicaweb.git
cd aplicaweb
```

### 2. Levantar el servidor local

```bash
node server.js
```

Abre tu navegador en **http://localhost:3000**

### 3. Acceder al panel de control

Navega a **http://localhost:3000/admin.html**

- Contraseña por defecto: `admin123`
- Puedes cambiarla en la primera línea de `admin.js`

---

## Panel de control

Desde el admin puedes gestionar todos tus proyectos sin editar código:

- **Agregar** un nuevo proyecto con nombre, descripción, categoría, estado, tags, color y URL
- **Editar** cualquier proyecto existente
- **Eliminar** proyectos
- Los cambios se reflejan **automáticamente** en el portfolio

### Estados disponibles
- `En Progreso` — proyecto activo
- `Completado` — proyecto terminado
- `Próximamente` — proyecto planeado

---

## Personalización

### Cambiar la contraseña del admin
En `admin.js`, línea 2:
```js
const PASSWORD = 'tu-nueva-contraseña';
```

### Cambiar textos del carrusel
En `index.html`, dentro de cada `.slide`:
```html
<h1>Tu título aquí</h1>
<p>Tu descripción aquí</p>
```

### Cambiar colores del tema
En `styles.css`, sección `:root`:
```css
:root {
  --bg: #0d0d0d;       /* fondo principal */
  --text: #f0f0f0;     /* color de texto */
  --border: rgba(255,255,255,0.08);
}
```

---

## Despliegue

### GitHub Pages (gratis)
1. Sube el repositorio a GitHub
2. Ve a **Settings → Pages**
3. Selecciona la rama `main` y carpeta `/root`
4. Tu portfolio estará en `https://leonnnc.github.io/aplicaweb`

> **Nota:** GitHub Pages sirve archivos estáticos. El `server.js` no es necesario en producción.

### cPanel / Hosting tradicional
1. Comprime los archivos: `index.html`, `styles.css`, `script.js`, `admin.html`, `admin.css`, `admin.js`
2. Sube el `.zip` al **Administrador de archivos** en `public_html`
3. Extrae y listo

---

## Licencia

MIT — libre para usar, modificar y compartir.

---

*Hecho con HTML, CSS y JavaScript puro.*
