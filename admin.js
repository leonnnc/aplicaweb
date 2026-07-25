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
