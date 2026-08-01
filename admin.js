// ===== CONFIGURACIÓN =====
const PASSWORD   = 'admin123';
const STORAGE_KEY = 'portfolio_proyectos';
const GH_CONFIG_KEY = 'portfolio_gh_config';

// ===== MAPAS GITHUB =====
const LANG_COLORS = {
  JavaScript: 'linear-gradient(145deg,#1a1a0a,#2a2a10)',
  TypeScript: 'linear-gradient(145deg,#0a1628,#1a3a4a)',
  Python:     'linear-gradient(145deg,#0a1a0a,#1a3a2a)',
  HTML:       'linear-gradient(145deg,#2a1a0a,#3a2a10)',
  CSS:        'linear-gradient(145deg,#0a0a2a,#1a1a4a)',
  Vue:        'linear-gradient(145deg,#0a2a1a,#1a4a3a)',
  Dart:       'linear-gradient(145deg,#0a1a28,#1a3a48)',
  PHP:        'linear-gradient(145deg,#1a0a2a,#2a1a3a)',
  default:    'linear-gradient(145deg,#1a1a2e,#4a3f6b)',
};

const LANG_CATEGORY = {
  JavaScript:'web', TypeScript:'web', HTML:'web', CSS:'web',
  Vue:'web', PHP:'web', Python:'app', Dart:'app',
  Swift:'app', Kotlin:'app',
};

// ===== LOGIN =====
const loginScreen = document.getElementById('loginScreen');
const panel       = document.getElementById('panel');
const loginForm   = document.getElementById('loginForm');
const loginPass   = document.getElementById('loginPass');
const loginError  = document.getElementById('loginError');

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

// ===== HAMBURGUESA MOBILE =====
const hamburgerBtn    = document.getElementById('hamburgerBtn');
const sidebarEl       = document.getElementById('sidebar');
const sidebarOverlay  = document.getElementById('sidebarOverlay');

function openSidebar() {
  sidebarEl.classList.add('open');
  sidebarOverlay.classList.add('visible');
  hamburgerBtn.classList.add('open');
}

function closeSidebar() {
  sidebarEl.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
  hamburgerBtn.classList.remove('open');
}

hamburgerBtn.addEventListener('click', () => {
  sidebarEl.classList.contains('open') ? closeSidebar() : openSidebar();
});

sidebarOverlay.addEventListener('click', closeSidebar);

// Cerrar sidebar al navegar (mobile)
document.querySelectorAll('.sidebar-nav a[data-view]').forEach(a => {
  a.addEventListener('click', () => { if (window.innerWidth <= 768) closeSidebar(); });
});

// ===== VISTAS =====
const views = {
  proyectos: document.getElementById('viewProyectos'),
  nuevo:     document.getElementById('viewNuevo'),
  ajustes:   document.getElementById('viewAjustes'),
};

function showView(name) {
  Object.values(views).forEach(v => v.style.display = 'none');
  views[name].style.display = 'block';
  document.querySelectorAll('.sidebar-nav a[data-view]').forEach(a => {
    a.classList.toggle('active', a.dataset.view === name);
  });
  if (name === 'proyectos') renderProyectos();
  if (name === 'nuevo')     resetForm();
  if (name === 'ajustes')   loadAjustes();
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-view]');
  // Ignorar si el click viene de btn-edit o btn-delete (tienen su propio handler)
  if (!btn || btn.classList.contains('btn-edit') || btn.classList.contains('btn-delete')) return;
  showView(btn.dataset.view);
});

// ===== STORAGE =====
function getProyectos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function saveProyectos(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function getGhConfig() {
  return JSON.parse(localStorage.getItem(GH_CONFIG_KEY) || '{}');
}
function saveGhConfig(cfg) {
  localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
}
function getSiteConfig() {
  return JSON.parse(localStorage.getItem('portfolio_site_config') || '{}');
}
function saveSiteConfig(cfg) {
  localStorage.setItem('portfolio_site_config', JSON.stringify(cfg));
}

// ===== AJUSTES =====
function loadAjustes() {
  const cfg = getSiteConfig();
  document.getElementById('aTitle').value     = cfg.title     || '';
  document.getElementById('aGithub').value    = cfg.github    || '';
  document.getElementById('aLinkedin').value  = cfg.linkedin  || '';
  document.getElementById('aEmail').value     = cfg.email     || '';
  document.getElementById('aFormspree').value = cfg.formspree || '';
}

document.getElementById('ajustesForm').addEventListener('submit', e => {
  e.preventDefault();
  saveSiteConfig({
    title:     document.getElementById('aTitle').value.trim(),
    github:    document.getElementById('aGithub').value.trim(),
    linkedin:  document.getElementById('aLinkedin').value.trim(),
    email:     document.getElementById('aEmail').value.trim(),
    formspree: document.getElementById('aFormspree').value.trim(),
  });
  showToast('Ajustes guardados');
});

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

  lista.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editarProyecto(+btn.dataset.index));
  });
  lista.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => eliminarProyecto(+btn.dataset.index));
  });
}

// ===== FORMULARIO =====
const proyectoForm  = document.getElementById('proyectoForm');
const formTitle     = document.getElementById('formTitle');

function resetForm() {
  proyectoForm.reset();
  document.getElementById('proyectoId').value = '';
  document.getElementById('pColor').value = 'linear-gradient(145deg,#1a1a2e,#4a3f6b)';
  formTitle.textContent = 'Nuevo Proyecto';
  document.querySelectorAll('.color-opt').forEach((o, i) => o.classList.toggle('active', i === 0));
  closeGhDropdown();
  setGhLinked(null);
  clearImagePreview();

  // cargar config guardada
  const cfg = getGhConfig();
  if (cfg.user)  document.getElementById('ghUser').value  = cfg.user;
  if (cfg.token) document.getElementById('ghToken').value = cfg.token;
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
  document.getElementById('pGithubUrl').value  = p.githubUrl || '';
  document.getElementById('pColor').value      = p.color;
  document.querySelectorAll('.color-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.color === p.color);
  });
  if (p.imagen) setImagePreview(p.imagen);
  else clearImagePreview();
  if (p.githubRepo) setGhLinked(p.githubRepo);
  else setGhLinked(null);

  // Mostrar vista sin llamar resetForm
  Object.values(views).forEach(v => v.style.display = 'none');
  views.nuevo.style.display = 'block';
  document.querySelectorAll('.sidebar-nav a[data-view]').forEach(a => {
    a.classList.toggle('active', a.dataset.view === 'nuevo');
  });
}

function eliminarProyecto(index) {
  if (!confirm('¿Eliminar este proyecto?')) return;
  const list = getProyectos();
  list.splice(index, 1);
  saveProyectos(list);
  renderProyectos();
  showToast('Proyecto eliminado');
}

// ===== IMAGEN UPLOAD =====
const imgUploadArea = document.getElementById('imgUploadArea');
const imgInput      = document.getElementById('pImagen');
const imgPreview    = document.getElementById('imgPreview');
const imgPlaceholder= document.getElementById('imgPlaceholder');
const imgRemoveBtn  = document.getElementById('imgRemoveBtn');
let currentImagen   = null; // base64 de la imagen actual

function setImagePreview(base64) {
  currentImagen = base64;
  imgPreview.src = base64;
  imgPreview.style.display = 'block';
  imgPlaceholder.style.display = 'none';
  imgRemoveBtn.style.display = 'inline-flex';
}

function clearImagePreview() {
  currentImagen = null;
  imgPreview.src = '';
  imgPreview.style.display = 'none';
  imgPlaceholder.style.display = 'flex';
  imgRemoveBtn.style.display = 'none';
  imgInput.value = '';
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Click en el área abre el selector de archivos
imgUploadArea.addEventListener('click', e => {
  if (e.target === imgRemoveBtn || imgRemoveBtn.contains(e.target)) return;
  imgInput.click();
});

imgInput.addEventListener('change', async () => {
  const file = imgInput.files[0];
  if (!file) return;
  const base64 = await readFileAsBase64(file);
  setImagePreview(base64);
});

imgRemoveBtn.addEventListener('click', e => {
  e.stopPropagation();
  clearImagePreview();
});

// Drag & drop
imgUploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  imgUploadArea.classList.add('drag-over');
});
imgUploadArea.addEventListener('dragleave', () => {
  imgUploadArea.classList.remove('drag-over');
});
imgUploadArea.addEventListener('drop', async e => {
  e.preventDefault();
  imgUploadArea.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const base64 = await readFileAsBase64(file);
  setImagePreview(base64);
});

// Color picker
document.querySelectorAll('.color-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    document.getElementById('pColor').value = opt.dataset.color;
  });
});

// Submit
proyectoForm.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('proyectoId').value;
  const nuevo = {
    nombre:      document.getElementById('pNombre').value.trim(),
    descripcion: document.getElementById('pDesc').value.trim(),
    categoria:   document.getElementById('pCategoria').value,
    estado:      document.getElementById('pEstado').value,
    tags:        document.getElementById('pTags').value.split(',').map(t => t.trim()).filter(Boolean),
    url:         document.getElementById('pUrl').value.trim(),
    githubUrl:   document.getElementById('pGithubUrl').value.trim(),
    color:       document.getElementById('pColor').value,
    imagen:      currentImagen || null,
    id:          Date.now(),
    githubRepo:  currentLinkedRepo || null,
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

// ===== GITHUB CONFIG COLAPSABLE =====
document.getElementById('ghSettingsToggle').addEventListener('click', () => {
  const body = document.getElementById('ghSettingsBody');
  body.style.display = body.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('btnSaveGhConfig').addEventListener('click', () => {
  const user  = document.getElementById('ghUser').value.trim();
  const token = document.getElementById('ghToken').value.trim();
  // AVISO: el token se guarda en localStorage (texto plano).
  // Úsalo solo en tu máquina local o en redes de confianza.
  // Para producción, usa un proxy backend o un token con permisos mínimos (solo lectura pública).
  saveGhConfig({ user, token });
  document.getElementById('ghSettingsBody').style.display = 'none';
  showToast('Configuración guardada');
  // precarga repos si hay usuario
  if (user) loadGhRepos(user, token);
});

// ===== BUSCADOR GITHUB INLINE =====
let ghReposCache  = [];
let currentLinkedRepo = null;

const btnGhSearch       = document.getElementById('btnGhSearch');
const ghDropdown        = document.getElementById('ghDropdown');
const ghDropdownList    = document.getElementById('ghDropdownList');
const ghDropdownStatus  = document.getElementById('ghDropdownStatus');
const ghDropdownSearch  = document.getElementById('ghDropdownSearch');

btnGhSearch.addEventListener('click', async () => {
  const cfg  = getGhConfig();
  const user = cfg.user || document.getElementById('ghUser').value.trim();

  if (!user) {
    // Abrir config si no hay usuario guardado
    document.getElementById('ghSettingsBody').style.display = 'flex';
    document.getElementById('ghUser').focus();
    showToast('Primero configura tu usuario de GitHub ⚙');
    return;
  }

  // Si el dropdown ya está abierto con datos, solo mostrarlo
  if (ghReposCache.length > 0) {
    ghDropdown.style.display = 'flex';
    ghDropdownSearch.value = '';
    renderDropdownRepos(ghReposCache);
    return;
  }

  ghDropdown.style.display = 'flex';
  await loadGhRepos(user, cfg.token || '');
});

async function loadGhRepos(user, token) {
  ghDropdownStatus.textContent = 'Cargando';
  ghDropdownStatus.className = 'loading';
  ghDropdownList.innerHTML = '';
  ghDropdown.style.display = 'flex';
  btnGhSearch.classList.add('loading');

  // Primero verificar que el usuario existe
  const headers = { 'Accept': 'application/vnd.github+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    // Paso 1: verificar usuario
    const userRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}`,
      { headers }
    );

    if (userRes.status === 404) {
      throw new Error(`Usuario "${user}" no encontrado en GitHub. Verifica el nombre exacto.`);
    }
    if (userRes.status === 401) {
      throw new Error('Token inválido. Revisa tu token personal de GitHub.');
    }
    if (userRes.status === 403) {
      const remaining = userRes.headers.get('X-RateLimit-Remaining');
      if (remaining === '0') {
        throw new Error('Límite de la API alcanzado. Agrega un token personal en ⚙ Configuración.');
      }
      throw new Error('Acceso denegado (403). Agrega un token personal.');
    }
    if (!userRes.ok) {
      throw new Error(`Error al verificar usuario: ${userRes.status}`);
    }

    // Paso 2: traer repos
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated&type=owner`,
      { headers }
    );

    if (!reposRes.ok) {
      throw new Error(`Error al obtener repositorios: ${reposRes.status}`);
    }

    const repos = await reposRes.json();
    ghReposCache = repos; // incluir forks también por si acaso

    if (ghReposCache.length === 0) {
      ghDropdownStatus.className = '';
      ghDropdownStatus.textContent = 'Este usuario no tiene repositorios públicos';
      return;
    }

    ghDropdownStatus.className = '';
    ghDropdownStatus.textContent = `${ghReposCache.length} repositorios encontrados`;
    renderDropdownRepos(ghReposCache);

  } catch (err) {
    ghDropdownStatus.className = 'error';
    // Distinguir errores de red de errores de la API
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      ghDropdownStatus.textContent = 'Sin conexión a internet. Verifica tu red.';
    } else {
      ghDropdownStatus.textContent = err.message;
    }
    console.error('GitHub API error:', err);
  } finally {
    btnGhSearch.classList.remove('loading');
  }
}

function renderDropdownRepos(repos) {
  if (repos.length === 0) {
    ghDropdownList.innerHTML = '<p style="padding:16px;color:var(--soft);font-size:.82rem;">Sin resultados</p>';
    return;
  }

  ghDropdownList.innerHTML = repos.map((r, i) => `
    <div class="gh-repo-item" data-index="${i}">
      <div>
        <div class="gh-repo-item-name">${r.name}</div>
        <div class="gh-repo-item-desc">${r.description || 'Sin descripción'}</div>
      </div>
      <div class="gh-repo-item-lang">${r.language || '—'}</div>
      <div class="gh-repo-item-stars">★ ${r.stargazers_count}</div>
    </div>
  `).join('');

  ghDropdownList.querySelectorAll('.gh-repo-item').forEach(item => {
    item.addEventListener('click', () => {
      const repo = repos[+item.dataset.index];
      fillFormFromRepo(repo);
      closeGhDropdown();
    });
  });
}

// Filtro de búsqueda en dropdown
ghDropdownSearch.addEventListener('input', () => {
  const q = ghDropdownSearch.value.toLowerCase();
  const filtered = ghReposCache.filter(r =>
    r.name.toLowerCase().includes(q) ||
    (r.description || '').toLowerCase().includes(q)
  );
  renderDropdownRepos(filtered);
});

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', e => {
  if (!e.target.closest('#ghDropdown') && !e.target.closest('#btnGhSearch')) {
    closeGhDropdown();
  }
});

function closeGhDropdown() {
  ghDropdown.style.display = 'none';
}

// ===== RELLENAR FORMULARIO DESDE REPO =====
function fillFormFromRepo(repo) {
  const lang  = repo.language || '';
  const tags  = [lang, ...(repo.topics || [])].filter(Boolean).slice(0, 5);
  const color = LANG_COLORS[lang] || LANG_COLORS.default;
  const cat   = LANG_CATEGORY[lang] || 'web';

  document.getElementById('pNombre').value    = repo.name;
  document.getElementById('pDesc').value      = repo.description || '';
  document.getElementById('pCategoria').value = cat;
  document.getElementById('pEstado').value    = repo.archived ? 'Completado' : 'En Progreso';
  document.getElementById('pTags').value      = tags.join(', ');
  document.getElementById('pUrl').value       = repo.homepage || ''; // URL de la web del proyecto
  document.getElementById('pGithubUrl').value = repo.html_url;       // URL del repo GitHub
  document.getElementById('pColor').value     = color;

  // seleccionar color visualmente si coincide
  let matched = false;
  document.querySelectorAll('.color-opt').forEach(o => {
    const match = o.dataset.color === color;
    o.classList.toggle('active', match);
    if (match) matched = true;
  });
  // si el color no está en los swatches, marcar el primero como fallback
  if (!matched) {
    document.querySelectorAll('.color-opt')[0].classList.add('active');
  }

  setGhLinked(repo.name);
  showToast(`Datos de "${repo.name}" cargados`);
}

// ===== BADGE REPO VINCULADO =====
function setGhLinked(repoName) {
  const el = document.getElementById('ghLinked');
  currentLinkedRepo = repoName;
  if (repoName) {
    document.getElementById('ghLinkedName').textContent = repoName;
    el.style.display = 'flex';
  } else {
    el.style.display = 'none';
  }
}

document.getElementById('btnUnlink').addEventListener('click', () => {
  setGhLinked(null);
  showToast('Repo desvinculado');
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
