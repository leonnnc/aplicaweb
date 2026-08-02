// ===== HELPER SANITIZAR HTML =====
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== CONFIGURACIÓN Y ESTADO =====
const GH_CONFIG_KEY = 'portfolio_gh_config';
let proyectosCache = [];

function getToken() {
  return sessionStorage.getItem('admin_token') || '';
}

function setToken(token) {
  sessionStorage.setItem('admin_token', token);
}

function clearToken() {
  sessionStorage.removeItem('admin_token');
}

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

if (getToken()) {
  loginScreen.style.display = 'none';
  panel.style.display = 'grid';
  loadProyectosAPI();
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const password = loginPass.value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setToken(data.token);
      loginScreen.style.display = 'none';
      panel.style.display = 'grid';
      loginError.classList.remove('show');
      loadProyectosAPI();
    } else {
      loginError.textContent = data.error || 'Contraseña incorrecta';
      loginError.classList.add('show');
      loginPass.value = '';
      loginPass.focus();
    }
  } catch (err) {
    loginError.textContent = 'Error de conexión con el servidor';
    loginError.classList.add('show');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearToken();
  panel.style.display = 'none';
  loginScreen.style.display = 'flex';
  loginPass.value = '';
});

// ===== PROTECCIÓN DE INTERFAZ DE ADMINISTRACIÓN =====
// Bloquear menú contextual de clic derecho en la interfaz para mayor seguridad
document.addEventListener('contextmenu', e => {
  if (getToken()) {
    e.preventDefault();
  }
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
  if (name === 'proyectos') loadProyectosAPI();
  if (name === 'nuevo')     resetForm();
  if (name === 'ajustes')   loadAjustesAPI();
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-view]');
  if (!btn || btn.classList.contains('btn-edit') || btn.classList.contains('btn-delete')) return;
  showView(btn.dataset.view);
});

// ===== API SERVER PERSISTENCE =====
async function loadProyectosAPI() {
  try {
    const res = await fetch('/api/proyectos');
    if (res.ok) {
      proyectosCache = await res.json();
      renderProyectos();
    }
  } catch (err) {
    showToast('Error al cargar proyectos del servidor');
  }
}

async function saveProyectosAPI(list) {
  const token = getToken();
  if (!token) {
    showToast('Sesión expirada, vuelve a iniciar sesión');
    return false;
  }

  try {
    const res = await fetch('/api/proyectos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(list),
    });

    if (res.status === 401) {
      showToast('Sesión no autorizada');
      clearToken();
      location.reload();
      return false;
    }

    const data = await res.json();
    if (res.ok && data.success) {
      proyectosCache = list;
      return true;
    } else {
      showToast(data.error || 'Error al guardar en servidor');
      return false;
    }
  } catch (err) {
    showToast('Error de conexión al guardar');
    return false;
  }
}

function getGhConfig() {
  return JSON.parse(localStorage.getItem(GH_CONFIG_KEY) || '{}');
}
function saveGhConfig(cfg) {
  localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
}

// ===== AJUSTES =====
async function loadAjustesAPI() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const cfg = await res.json();
      document.getElementById('aTitle').value     = cfg.title     || '';
      document.getElementById('aGithub').value    = cfg.github    || '';
      document.getElementById('aLinkedin').value  = cfg.linkedin  || '';
      document.getElementById('aEmail').value     = cfg.email     || '';
      document.getElementById('aFormspree').value = cfg.formspree || '';
    }
  } catch (err) {
    showToast('Error al cargar ajustes');
  }
}

document.getElementById('ajustesForm').addEventListener('submit', async e => {
  e.preventDefault();
  const token = getToken();
  const newConfig = {
    title:     document.getElementById('aTitle').value.trim(),
    github:    document.getElementById('aGithub').value.trim(),
    linkedin:  document.getElementById('aLinkedin').value.trim(),
    email:     document.getElementById('aEmail').value.trim(),
    formspree: document.getElementById('aFormspree').value.trim(),
  };

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(newConfig),
    });

    if (res.ok) {
      showToast('Ajustes guardados en el servidor');
    } else {
      showToast('Error al guardar ajustes');
    }
  } catch (err) {
    showToast('Error de conexión');
  }
});

// ===== RENDER LISTA =====
function renderProyectos() {
  const lista = document.getElementById('proyectosLista');

  if (!proyectosCache || proyectosCache.length === 0) {
    lista.innerHTML = '<p class="empty-state">No hay proyectos todavía. Agrega el primero.</p>';
    return;
  }

  lista.innerHTML = proyectosCache.map((p, i) => `
    <div class="proyecto-row">
      <div class="proyecto-color" style="background:${p.color}"></div>
      <div>
        <div class="proyecto-nombre">${escapeHtml(p.nombre)}</div>
        <div class="proyecto-cat">${escapeHtml(p.categoria)}</div>
      </div>
      <div class="proyecto-estado ${p.estado === 'Completado' ? 'estado-completado' : 'estado-progreso'}">
        ${escapeHtml(p.estado)}
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

  const cfg = getGhConfig();
  if (cfg.user)  document.getElementById('ghUser').value  = cfg.user;
  if (cfg.token) document.getElementById('ghToken').value = cfg.token;
}

function editarProyecto(index) {
  const p = proyectosCache[index];
  formTitle.textContent = 'Editar Proyecto';
  document.getElementById('proyectoId').value  = index;
  document.getElementById('pNombre').value     = p.nombre;
  document.getElementById('pDesc').value       = p.descripcion;
  document.getElementById('pCategoria').value  = p.categoria;
  document.getElementById('pEstado').value     = p.estado;
  document.getElementById('pTags').value       = Array.isArray(p.tags) ? p.tags.join(', ') : '';
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

  Object.values(views).forEach(v => v.style.display = 'none');
  views.nuevo.style.display = 'block';
  document.querySelectorAll('.sidebar-nav a[data-view]').forEach(a => {
    a.classList.toggle('active', a.dataset.view === 'nuevo');
  });
}

async function eliminarProyecto(index) {
  if (!confirm('¿Eliminar este proyecto?')) return;
  const list = [...proyectosCache];
  list.splice(index, 1);
  const success = await saveProyectosAPI(list);
  if (success) {
    renderProyectos();
    showToast('Proyecto eliminado');
  }
}

// ===== IMAGEN UPLOAD =====
const imgUploadArea = document.getElementById('imgUploadArea');
const imgInput      = document.getElementById('pImagen');
const imgPreview    = document.getElementById('imgPreview');
const imgPlaceholder= document.getElementById('imgPlaceholder');
const imgRemoveBtn  = document.getElementById('imgRemoveBtn');
let currentImagen   = null;

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
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1000;
        const maxHeight = 1000;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

document.querySelectorAll('.color-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    document.getElementById('pColor').value = opt.dataset.color;
  });
});

proyectoForm.addEventListener('submit', async e => {
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

  const list = [...proyectosCache];
  if (id !== '') {
    list[+id] = { ...list[+id], ...nuevo };
  } else {
    list.push(nuevo);
  }

  const success = await saveProyectosAPI(list);
  if (success) {
    showToast(id !== '' ? 'Proyecto actualizado' : 'Proyecto guardado');
    showView('proyectos');
  }
});

// ===== GITHUB CONFIG COLAPSABLE =====
document.getElementById('ghSettingsToggle').addEventListener('click', () => {
  const body = document.getElementById('ghSettingsBody');
  body.style.display = body.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('btnSaveGhConfig').addEventListener('click', () => {
  const user  = document.getElementById('ghUser').value.trim();
  const token = document.getElementById('ghToken').value.trim();
  saveGhConfig({ user, token });
  document.getElementById('ghSettingsBody').style.display = 'none';
  showToast('Configuración guardada');
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
    document.getElementById('ghSettingsBody').style.display = 'flex';
    document.getElementById('ghUser').focus();
    showToast('Primero configura tu usuario de GitHub ⚙');
    return;
  }

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

  const headers = { 'Accept': 'application/vnd.github+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const userRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}`,
      { headers }
    );

    if (userRes.status === 404) throw new Error(`Usuario "${user}" no encontrado en GitHub.`);
    if (userRes.status === 401) throw new Error('Token inválido. Revisa tu token personal.');
    if (userRes.status === 403) throw new Error('Límite de API alcanzado o acceso denegado.');
    if (!userRes.ok) throw new Error(`Error al verificar usuario: ${userRes.status}`);

    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated&type=owner`,
      { headers }
    );

    if (!reposRes.ok) throw new Error(`Error al obtener repositorios: ${reposRes.status}`);

    const repos = await reposRes.json();
    ghReposCache = repos;

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
    ghDropdownStatus.textContent = err.message || 'Error de conexión';
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
        <div class="gh-repo-item-name">${escapeHtml(r.name)}</div>
        <div class="gh-repo-item-desc">${escapeHtml(r.description || 'Sin descripción')}</div>
      </div>
      <div class="gh-repo-item-lang">${escapeHtml(r.language || '—')}</div>
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

ghDropdownSearch.addEventListener('input', () => {
  const q = ghDropdownSearch.value.toLowerCase();
  const filtered = ghReposCache.filter(r =>
    r.name.toLowerCase().includes(q) ||
    (r.description || '').toLowerCase().includes(q)
  );
  renderDropdownRepos(filtered);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#ghDropdown') && !e.target.closest('#btnGhSearch')) {
    closeGhDropdown();
  }
});

function closeGhDropdown() {
  ghDropdown.style.display = 'none';
}

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
  document.getElementById('pUrl').value       = repo.homepage || '';
  document.getElementById('pGithubUrl').value = repo.html_url;
  document.getElementById('pColor').value     = color;

  let matched = false;
  document.querySelectorAll('.color-opt').forEach(o => {
    const match = o.dataset.color === color;
    o.classList.toggle('active', match);
    if (match) matched = true;
  });
  if (!matched) {
    document.querySelectorAll('.color-opt')[0].classList.add('active');
  }

  setGhLinked(repo.name);
  showToast(`Datos de "${repo.name}" cargados`);
}

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
