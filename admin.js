// ===== CONFIGURACIÓN =====
const PASSWORD = 'admin123'; // cambia esta contraseña
const STORAGE_KEY = 'portfolio_proyectos';

// ===== LOGIN =====
const loginScreen = document.getElementById('loginScreen');
const panel       = document.getElementById('panel');
const loginForm   = document.getElementById('loginForm');
const loginPass   = document.getElementById('loginPass');
const loginError  = document.getElementById('loginError');

// Verificar si ya hay sesión activa
if (sessionStorage.getItem('admin_auth') === 'true') {
  loginScreen.style.display = 'none';
  panel.style.display = 'grid';
  renderProyectos();
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  if (loginPass.value === PASSWORD) {
    sessionStorage.setItem('admin_auth', 'true');
    loginScreen.style.display = 'none';
    panel.style.display = 'grid';
    loginError.classList.remove('show');
    renderProyectos();
  } else {
    loginError.classList.add('show');
    loginPass.value = '';
    loginPass.focus();
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('admin_auth');
  panel.style.display = 'none';
  loginScreen.style.display = 'flex';
  loginPass.value = '';
});

// ===== NAVEGACIÓN ENTRE VISTAS =====
const views = {
  proyectos: document.getElementById('viewProyectos'),
  nuevo:     document.getElementById('viewNuevo'),
  github:    document.getElementById('viewGithub'),
};

function showView(name) {
  Object.values(views).forEach(v => v.style.display = 'none');
  views[name].style.display = 'block';

  // Actualizar sidebar activo
  document.querySelectorAll('.sidebar-nav a[data-view]').forEach(a => {
    a.classList.toggle('active', a.dataset.view === name);
  });

  if (name === 'proyectos') renderProyectos();
  if (name === 'nuevo') resetForm();
}

// Botones con data-view
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-view]');
  if (btn) showView(btn.dataset.view);
});

// ===== STORAGE: leer y guardar =====
function getProyectos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveProyectos(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ===== RENDER LISTA =====
function renderProyectos() {
  const lista = document.getElementById('proyectosLista');
  const proyectos = getProyectos();

  if (proyectos.length === 0) {
    lista.innerHTML = '<p class="empty-state">No hay proyectos todavía. Agrega el primero.</p>';
    return;
  }

  lista.innerHTML = proyectos.map((p, i) => `
    <div class="proyecto-row">
      <div class="proyecto-color" style="background:${p.color}"></div>
      <div>
        <div class="proyecto-nombre">${p.nombre}</div>
        <div class="proyecto-cat">${p.categoria}</div>
      </div>
      <div class="proyecto-estado ${p.estado === 'Completado' ? 'estado-completado' : 'estado-progreso'}">
        ${p.estado}
      </div>
      <div class="proyecto-actions">
        <button class="btn-edit" data-index="${i}">Editar</button>
        <button class="btn-delete" data-index="${i}">Eliminar</button>
      </div>
    </div>
  `).join('');

  // Eventos de editar / eliminar
  lista.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editarProyecto(+btn.dataset.index));
  });

  lista.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => eliminarProyecto(+btn.dataset.index));
  });
}

// ===== FORMULARIO =====
const proyectoForm = document.getElementById('proyectoForm');
const formTitle    = document.getElementById('formTitle');

function resetForm() {
  proyectoForm.reset();
  document.getElementById('proyectoId').value = '';
  document.getElementById('pColor').value = 'linear-gradient(145deg,#1a1a2e,#4a3f6b)';
  formTitle.textContent = 'Nuevo Proyecto';
  // resetear selección de color
  document.querySelectorAll('.color-opt').forEach((o, i) => {
    o.classList.toggle('active', i === 0);
  });
}

function editarProyecto(index) {
  const p = getProyectos()[index];
  formTitle.textContent = 'Editar Proyecto';
  document.getElementById('proyectoId').value  = index;
  document.getElementById('pNombre').value     = p.nombre;
  document.getElementById('pDesc').value       = p.descripcion;
  document.getElementById('pCategoria').value  = p.categoria;
  document.getElementById('pEstado').value     = p.estado;
  document.getElementById('pTags').value       = p.tags.join(', ');
  document.getElementById('pUrl').value        = p.url || '';
  document.getElementById('pColor').value      = p.color;

  document.querySelectorAll('.color-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.color === p.color);
  });

  showView('nuevo');
}

function eliminarProyecto(index) {
  if (!confirm('¿Eliminar este proyecto?')) return;
  const list = getProyectos();
  list.splice(index, 1);
  saveProyectos(list);
  renderProyectos();
  showToast('Proyecto eliminado');
}

// Selector de color
document.querySelectorAll('.color-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    document.getElementById('pColor').value = opt.dataset.color;
  });
});

// Submit del formulario
proyectoForm.addEventListener('submit', e => {
  e.preventDefault();

  const id    = document.getElementById('proyectoId').value;
  const nuevo = {
    nombre:     document.getElementById('pNombre').value.trim(),
    descripcion:document.getElementById('pDesc').value.trim(),
    categoria:  document.getElementById('pCategoria').value,
    estado:     document.getElementById('pEstado').value,
    tags:       document.getElementById('pTags').value.split(',').map(t => t.trim()).filter(Boolean),
    url:        document.getElementById('pUrl').value.trim(),
    color:      document.getElementById('pColor').value,
    id:         Date.now(),
  };

  const list = getProyectos();

  if (id !== '') {
    list[+id] = { ...list[+id], ...nuevo };
    showToast('Proyecto actualizado');
  } else {
    list.push(nuevo);
    showToast('Proyecto guardado');
  }

  saveProyectos(list);
  showView('proyectos');
});

// ===== TOAST =====
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== GITHUB IMPORT =====
const LANG_COLORS = {
  JavaScript: 'linear-gradient(145deg,#1a1a0a,#2a2a10)',
  TypeScript: 'linear-gradient(145deg,#0a1628,#1a3a4a)',
  Python:     'linear-gradient(145deg,#0a1a0a,#1a3a2a)',
  HTML:       'linear-gradient(145deg,#2a1a0a,#3a2a10)',
  CSS:        'linear-gradient(145deg,#0a0a2a,#1a1a4a)',
  Vue:        'linear-gradient(145deg,#0a2a1a,#1a4a3a)',
  React:      'linear-gradient(145deg,#0a1a2a,#1a2a4a)',
  Dart:       'linear-gradient(145deg,#0a1a28,#1a3a48)',
  PHP:        'linear-gradient(145deg,#1a0a2a,#2a1a3a)',
  default:    'linear-gradient(145deg,#1a1a2e,#4a3f6b)',
};

const LANG_CATEGORY = {
  JavaScript: 'web', TypeScript: 'web', HTML: 'web', CSS: 'web',
  Vue: 'web', React: 'web', PHP: 'web',
  Python: 'app', Dart: 'app', Swift: 'app', Kotlin: 'app',
  Figma: 'diseño',
};

let ghReposData = [];
let selectedRepos = new Set();

document.getElementById('btnFetchRepos').addEventListener('click', fetchGithubRepos);
document.getElementById('ghUser').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); fetchGithubRepos(); }
});

async function fetchGithubRepos() {
  const user  = document.getElementById('ghUser').value.trim();
  const token = document.getElementById('ghToken').value.trim();
  const status = document.getElementById('ghStatus');
  const reposEl = document.getElementById('ghRepos');
  const footer  = document.getElementById('ghFooter');
  const btn     = document.getElementById('btnFetchRepos');

  if (!user) {
    status.textContent = 'Ingresa un usuario de GitHub.';
    status.className = 'gh-status error';
    return;
  }

  status.textContent = 'Buscando repositorios';
  status.className = 'gh-status loading';
  reposEl.innerHTML = '';
  footer.style.display = 'none';
  btn.disabled = true;
  selectedRepos.clear();
  ghReposData = [];

  const headers = { 'Accept': 'application/vnd.github+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated`,
      { headers }
    );

    if (res.status === 404) throw new Error('Usuario no encontrado.');
    if (res.status === 403) throw new Error('Rate limit alcanzado. Agrega un token personal.');
    if (!res.ok) throw new Error(`Error ${res.status} de la API de GitHub.`);

    const repos = await res.json();

    // Filtrar forks si se desea (puedes quitar el filtro)
    ghReposData = repos.filter(r => !r.fork);

    if (ghReposData.length === 0) {
      status.textContent = 'No se encontraron repositorios propios.';
      status.className = 'gh-status';
      btn.disabled = false;
      return;
    }

    status.textContent = `${ghReposData.length} repositorios encontrados`;
    status.className = 'gh-status';

    renderGhRepos();
    footer.style.display = 'flex';

  } catch (err) {
    status.textContent = err.message;
    status.className = 'gh-status error';
  } finally {
    btn.disabled = false;
  }
}

function renderGhRepos() {
  const reposEl = document.getElementById('ghRepos');

  reposEl.innerHTML = ghReposData.map((repo, i) => {
    const lang  = repo.language || '—';
    const desc  = repo.description || 'Sin descripción';
    const stars = repo.stargazers_count;

    return `
      <div class="gh-repo-row" data-index="${i}">
        <div class="gh-check">✓</div>
        <div class="gh-repo-info">
          <div class="gh-repo-name">${repo.name}</div>
          <div class="gh-repo-desc">${desc}</div>
        </div>
        <div class="gh-repo-lang">${lang}</div>
        <div class="gh-repo-stars">★ ${stars}</div>
      </div>
    `;
  }).join('');

  reposEl.querySelectorAll('.gh-repo-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = +row.dataset.index;
      if (selectedRepos.has(idx)) {
        selectedRepos.delete(idx);
        row.classList.remove('selected');
      } else {
        selectedRepos.add(idx);
        row.classList.add('selected');
      }
      document.getElementById('ghSelected').textContent =
        `${selectedRepos.size} seleccionado${selectedRepos.size !== 1 ? 's' : ''}`;
    });
  });
}

document.getElementById('btnImport').addEventListener('click', () => {
  if (selectedRepos.size === 0) return;

  const list = getProyectos();
  let importados = 0;

  selectedRepos.forEach(idx => {
    const repo = ghReposData[idx];
    const lang = repo.language || '';
    const tags = [lang, ...( repo.topics || [])].filter(Boolean).slice(0, 4);

    // Evitar duplicados por URL
    const yaExiste = list.some(p => p.url === repo.html_url);
    if (yaExiste) return;

    list.push({
      id:          Date.now() + idx,
      nombre:      repo.name,
      descripcion: repo.description || 'Repositorio de GitHub.',
      categoria:   LANG_CATEGORY[lang] || 'web',
      estado:      repo.archived ? 'Completado' : 'En Progreso',
      tags:        tags.length ? tags : [lang || 'Código'],
      color:       LANG_COLORS[lang] || LANG_COLORS.default,
      url:         repo.html_url,
      github:      true,
    });
    importados++;
  });

  saveProyectos(list);
  showToast(`${importados} proyecto${importados !== 1 ? 's' : ''} importado${importados !== 1 ? 's' : ''}`);

  // Resetear selección
  selectedRepos.clear();
  document.querySelectorAll('.gh-repo-row.selected').forEach(r => r.classList.remove('selected'));
  document.getElementById('ghSelected').textContent = '0 seleccionados';

  showView('proyectos');
});
