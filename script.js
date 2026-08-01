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

// ===== STORAGE KEY (debe coincidir con admin.js) =====
const STORAGE_KEY     = 'portfolio_proyectos';
const SITE_CONFIG_KEY = 'portfolio_site_config';

function getSiteConfig() {
  return JSON.parse(localStorage.getItem(SITE_CONFIG_KEY) || '{}');
}

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
    const pNombre   = escapeHtml(p.nombre);
    const pDesc     = escapeHtml(p.descripcion);
    const tags      = Array.isArray(p.tags) ? p.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('') : '';
    const num       = String(i + 1).padStart(2, '0');
    const urlWeb    = p.url ? escapeHtml(p.url) : '';
    const urlGh     = (p.githubUrl || p.url) ? escapeHtml(p.githubUrl || p.url) : '';

    // Botón "Ver proyecto" → solo si hay URL de la web
    const btnWeb = urlWeb
      ? `<a href="${urlWeb}" class="btn-outline" target="_blank" rel="noopener">Ver proyecto →</a>`
      : '';

    // Botón GitHub → solo si hay URL de GitHub
    const btnGh = urlGh
      ? `<a href="${urlGh}" class="btn-outline btn-github" target="_blank" rel="noopener">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:5px"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
           GitHub
         </a>`
      : '';

    const imgStyle = `background:${p.color}`;

    // Imagen subida por el usuario, o gradiente + icono de fallback
    const imgContent = p.imagen
      ? `<img class="trabajo-screenshot" src="${escapeHtml(p.imagen)}" alt="Preview de ${pNombre}" loading="lazy" />`
      : `<svg class="trabajo-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
           <rect x="3" y="3" width="18" height="18" rx="2"/>
           <path d="M3 9h18"/>
           <circle cx="7" cy="6" r="1" fill="currentColor" stroke="none"/>
           <circle cx="10" cy="6" r="1" fill="currentColor" stroke="none"/>
         </svg>`;

    return `
      <div class="trabajo ${esInverso}">
        <div class="trabajo-imagen" style="${imgStyle}">
          ${imgContent}
        </div>
        <div class="trabajo-info">
          <span class="trabajo-num">${num}</span>
          <h2>${pNombre}</h2>
          <p>${pDesc}</p>
          <div class="trabajo-tags">${tags}</div>
          <div class="trabajo-btns">
            ${btnWeb}
            ${btnGh}
          </div>
        </div>
      </div>
    `;
  }).join('');

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
const track    = document.getElementById('carouselTrack');
const dotsWrap = document.getElementById('carouselDots');
const prev     = document.getElementById('prevBtn');
const next     = document.getElementById('nextBtn');
let current = 0;
let timer = null;
let totalSlides = 0;

function buildCarousel() {
  const proyectos = getProyectos();
  totalSlides = proyectos.length;

  if (totalSlides === 0) {
    track.innerHTML = `
      <div class="slide slide-proyecto">
        <div class="slide-overlay"></div>
        <div class="slide-content">
          <h1>Sin <span>proyectos</span></h1>
          <p>Agrega proyectos desde el panel de administración.</p>
        </div>
      </div>
    `;
    dotsWrap.innerHTML = '';
    return;
  }

  // Generar slides con imagen o gradiente
  track.innerHTML = proyectos.map(p => {
    const pNombre = escapeHtml(p.nombre);
    const pDesc   = escapeHtml(p.descripcion);

    const bg = p.imagen
      ? `background: ${p.color} url('${escapeHtml(p.imagen)}') center/cover no-repeat`
      : `background: ${p.color}`;

    const palabras = pNombre.split(' ');
    const mitad    = Math.ceil(palabras.length / 2);
    const titulo1  = palabras.slice(0, mitad).join(' ');
    const titulo2  = palabras.slice(mitad).join(' ');

    return `
      <div class="slide slide-proyecto" style="${bg}">
        <div class="slide-overlay"></div>
        <div class="slide-content">
          <h1>${titulo1} <span>${titulo2}</span></h1>
          <p>${pDesc.slice(0, 80)}${pDesc.length > 80 ? '…' : ''}</p>
          <a href="#trabajos" class="link-arrow">Ver proyectos ↓</a>
        </div>
      </div>
    `;
  }).join('');

  // Generar dots
  dotsWrap.innerHTML = proyectos.map((_, i) =>
    `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
  ).join('');

  dotsWrap.querySelectorAll('.dot').forEach(d => {
    d.addEventListener('click', () => { goTo(+d.dataset.index); resetTimer(); });
  });
}

function getDots() { return dotsWrap.querySelectorAll('.dot'); }

function goTo(i) {
  if (totalSlides <= 0) return;
  current = (i + totalSlides) % totalSlides;
  track.style.transform = `translateX(-${current * 100}%)`;
  getDots().forEach(d => d.classList.toggle('active', +d.dataset.index === current));
}

function autoTimer() {
  clearInterval(timer);
  if (totalSlides <= 1) return;
  timer = setInterval(() => goTo(current + 1), 4000);
}
function resetTimer() { autoTimer(); }

next.addEventListener('click', () => { goTo(current + 1); resetTimer(); });
prev.addEventListener('click', () => { goTo(current - 1); resetTimer(); });

// Swipe móvil
let tx = 0;
track.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
track.addEventListener('touchend', e => {
  const d = tx - e.changedTouches[0].clientX;
  if (Math.abs(d) > 40) { d > 0 ? goTo(current + 1) : goTo(current - 1); resetTimer(); }
});

buildCarousel();
autoTimer();

next.addEventListener('click', () => { goTo(current + 1); resetTimer(); });
prev.addEventListener('click', () => { goTo(current - 1); resetTimer(); });

// Swipe móvil
let tx = 0;
track.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
track.addEventListener('touchend', e => {
  const d = tx - e.changedTouches[0].clientX;
  if (Math.abs(d) > 40) { d > 0 ? goTo(current + 1) : goTo(current - 1); resetTimer(); }
});

buildCarousel();
autoTimer();

// ===== FORMULARIO CONTACTO =====
document.getElementById('contactoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button');
  const cfg  = getSiteConfig();
  const formspreeId = cfg.formspree || '';

  if (!formspreeId) {
    // Sin Formspree configurado: modo demo (sin envío real)
    btn.textContent = 'Enviado ✓';
    btn.style.background = 'var(--text)';
    btn.style.color = 'var(--bg)';
    setTimeout(() => {
      btn.textContent = 'Enviar';
      btn.style.background = '';
      btn.style.color = '';
      form.reset();
    }, 3000);
    return;
  }

  // Con Formspree: envío real
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  const data = new FormData(form);
  // Añadir el email de destino si está configurado
  if (cfg.email) data.set('_replyto', cfg.email);

  try {
    const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      btn.textContent = 'Enviado ✓';
      btn.style.background = 'var(--text)';
      btn.style.color = 'var(--bg)';
      form.reset();
      setTimeout(() => {
        btn.textContent = 'Enviar';
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 3000);
    } else {
      const json = await res.json().catch(() => ({}));
      const msg  = json.errors ? json.errors.map(err => err.message).join(', ') : 'Error al enviar';
      btn.textContent = msg;
      btn.style.color = '#e55';
      setTimeout(() => {
        btn.textContent = 'Enviar';
        btn.style.color = '';
        btn.disabled = false;
      }, 4000);
    }
  } catch {
    btn.textContent = 'Sin conexión';
    btn.style.color = '#e55';
    setTimeout(() => {
      btn.textContent = 'Enviar';
      btn.style.color = '';
      btn.disabled = false;
    }, 4000);
  }
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

// Actualizar footer y título desde la config guardada
(function applyConfig() {
  const cfg = getSiteConfig();

  // Título de la página
  if (cfg.title) {
    document.title = cfg.title;
    const logo = document.querySelector('.nav-logo');
    if (logo) logo.textContent = cfg.title;
    const footerSpan = document.querySelector('.footer span');
    if (footerSpan) footerSpan.textContent = cfg.title + ' ' + new Date().getFullYear();
  }

  // Links del footer
  const footerLinks = document.querySelectorAll('.footer-links a');
  if (footerLinks.length >= 1 && cfg.github) {
    footerLinks[0].href = cfg.github;
  }
  if (footerLinks.length >= 2 && cfg.linkedin) {
    footerLinks[1].href = cfg.linkedin;
  }
})();
