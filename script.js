// ===== STORAGE KEY (debe coincidir con admin.js) =====
const STORAGE_KEY = 'portfolio_proyectos';

// ===== PROYECTOS POR DEFECTO (se usan si no hay nada en localStorage) =====
const defaultProyectos = [
  {
    id: 1,
    nombre: 'Proyecto Web',
    descripcion: 'Aplicación web moderna construida con React y Node.js. Autenticación, dashboard y API REST completa.',
    categoria: 'web',
    estado: 'En Progreso',
    tags: ['React', 'Node.js', 'MongoDB'],
    color: 'linear-gradient(145deg,#1a1a2e,#4a3f6b)',
    url: '#',
  },
  {
    id: 2,
    nombre: 'Diseño UI/UX',
    descripcion: 'Diseño de interfaz para aplicación móvil. Flujo completo desde wireframe hasta prototipo interactivo.',
    categoria: 'diseño',
    estado: 'Completado',
    tags: ['Figma', 'UI/UX', 'Prototipo'],
    color: 'linear-gradient(145deg,#1c1c1c,#3a2a2a)',
    url: '#',
  },
  {
    id: 3,
    nombre: 'App Mobile',
    descripcion: 'Aplicación de gestión de tareas para Android e iOS con sincronización en tiempo real.',
    categoria: 'app',
    estado: 'En Progreso',
    tags: ['Flutter', 'Dart', 'Firebase'],
    color: 'linear-gradient(145deg,#0a1628,#1a3a4a)',
    url: '#',
  },
  {
    id: 4,
    nombre: 'E-commerce',
    descripcion: 'Tienda online completa con carrito de compras, pasarela de pagos y panel de administración.',
    categoria: 'web',
    estado: 'En Progreso',
    tags: ['HTML', 'CSS', 'JavaScript'],
    color: 'linear-gradient(145deg,#1a1a0a,#2a3a1a)',
    url: '#',
  },
];

// ===== RENDERIZAR PROYECTOS EN EL PORTFOLIO =====
function getProyectos() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.length > 0) return parsed;
  }
  return defaultProyectos;
}

function renderTrabajosPortfolio() {
  const container = document.getElementById('trabajosContainer');
  if (!container) return;

  const proyectos = getProyectos();

  container.innerHTML = proyectos.map((p, i) => {
    const esInverso = i % 2 !== 0 ? 'inverso' : '';
    const tags = p.tags.map(t => `<span>${t}</span>`).join('');
    const url  = p.url || '#';
    const num  = String(i + 1).padStart(2, '0');

    return `
      <div class="trabajo ${esInverso}">
        <div class="trabajo-imagen" style="background:${p.color}"></div>
        <div class="trabajo-info">
          <span class="trabajo-num">${num}</span>
          <h2>${p.nombre}</h2>
          <p>${p.descripcion}</p>
          <div class="trabajo-tags">${tags}</div>
          <a href="${url}" class="btn-outline" ${url !== '#' ? 'target="_blank"' : ''}>Ver proyecto →</a>
        </div>
      </div>
    `;
  }).join('');

  // Re-aplicar animación scroll a los nuevos elementos
  initScrollAnimation();
}

// ===== ANIMACIÓN SCROLL =====
function initScrollAnimation() {
  const trabajos = document.querySelectorAll('.trabajo');
  trabajos.forEach(t => {
    t.classList.remove('visible');
    // resetear para que el observer los detecte de nuevo
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  trabajos.forEach(t => observer.observe(t));
}

// ===== CARRUSEL =====
const track = document.getElementById('carouselTrack');
const dots  = document.querySelectorAll('.dot');
const prev  = document.getElementById('prevBtn');
const next  = document.getElementById('nextBtn');
const total = dots.length;
let current = 0;
let timer;

function goTo(i) {
  current = (i + total) % total;
  track.style.transform = `translateX(-${current * 100}%)`;
  dots.forEach(d => d.classList.remove('active'));
  dots[current].classList.add('active');
}

function auto() { timer = setInterval(() => goTo(current + 1), 4000); }
function reset() { clearInterval(timer); auto(); }

next.addEventListener('click', () => { goTo(current + 1); reset(); });
prev.addEventListener('click', () => { goTo(current - 1); reset(); });
dots.forEach(d => d.addEventListener('click', () => { goTo(+d.dataset.index); reset(); }));

// Swipe móvil
let tx = 0;
track.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
track.addEventListener('touchend', e => {
  const d = tx - e.changedTouches[0].clientX;
  if (Math.abs(d) > 40) { d > 0 ? goTo(current + 1) : goTo(current - 1); reset(); }
});

auto();

// ===== FORMULARIO CONTACTO =====
document.getElementById('contactoForm').addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Enviado ✓';
  btn.style.background = 'var(--text)';
  btn.style.color = 'var(--bg)';
  setTimeout(() => {
    btn.textContent = 'Enviar';
    btn.style.background = '';
    btn.style.color = '';
    e.target.reset();
  }, 3000);
});

// ===== NAVBAR ACTIVA POR SCROLL =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-menu a');

window.addEventListener('scroll', () => {
  let id = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 80) id = s.id; });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--text)' : '';
  });
});

// ===== INIT =====
renderTrabajosPortfolio();
