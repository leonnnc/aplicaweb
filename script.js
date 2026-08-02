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

// Globales
let currentProyectos = [];
let currentSiteConfig = {};

// ===== OBTENER DATOS DEL SERVIDOR API =====
async function fetchProyectos() {
  try {
    const res = await fetch('/api/proyectos');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('Servidor offline o sin proyectos, usando localStorage/fallback');
  }
  const stored = localStorage.getItem('portfolio_proyectos');
  return stored ? JSON.parse(stored) : [];
}

async function fetchSiteConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Config offline');
  }
  const stored = localStorage.getItem('portfolio_site_config');
  return stored ? JSON.parse(stored) : {};
}

// ===== RENDERIZAR PROYECTOS EN EL PORTFOLIO =====
function renderTrabajosPortfolio(proyectos) {
  const container = document.getElementById('trabajosContainer');
  if (!container) return;

  if (!proyectos || proyectos.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding:48px;text-align:center;color:var(--text-soft)">No hay proyectos creados aún.</p>';
    return;
  }

  container.innerHTML = proyectos.map((p, i) => {
    const esInverso = i % 2 !== 0 ? 'inverso' : '';
    const pNombre   = escapeHtml(p.nombre);
    const pDesc     = escapeHtml(p.descripcion);
    const tags      = Array.isArray(p.tags) ? p.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('') : '';
    const num       = String(i + 1).padStart(2, '0');
    const urlWeb    = p.url ? escapeHtml(p.url) : '';
    const urlGh     = (p.githubUrl || p.url) ? escapeHtml(p.githubUrl || p.url) : '';

    const btnWeb = urlWeb
      ? `<a href="${urlWeb}" class="btn-outline" target="_blank" rel="noopener">Ver proyecto →</a>`
      : '';

    const btnGh = urlGh
      ? `<a href="${urlGh}" class="btn-outline btn-github" target="_blank" rel="noopener">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:5px"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
           GitHub
         </a>`
      : '';

    const imgStyle = `background:${p.color}`;

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
  trabajos.forEach(t => { t.classList.remove('visible'); });

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

function buildCarousel(proyectos) {
  totalSlides = proyectos ? proyectos.length : 0;

  if (totalSlides === 0) {
    track.innerHTML = `
      <div class="slide slide-proyecto" style="background:#111">
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

  track.innerHTML = proyectos.map(p => {
    const pNombre = escapeHtml(p.nombre);
    const pDesc   = escapeHtml(p.descripcion);

    // Usar <img> real en lugar de CSS background-image
    // Esto soporta base64 grandes que los navegadores no renderizan como CSS background
    const bgImgTag = p.imagen
      ? `<img class="slide-bg-img" src="${p.imagen}" alt="" aria-hidden="true" />`
      : '';

    const palabras = pNombre.split(' ');
    const mitad    = Math.ceil(palabras.length / 2);
    const titulo1  = palabras.slice(0, mitad).join(' ');
    const titulo2  = palabras.slice(mitad).join(' ');

    return `
      <div class="slide slide-proyecto" style="background:${p.color}">
        ${bgImgTag}
        <div class="slide-overlay"></div>
        <div class="slide-content">
          <h1>${titulo1} <span>${titulo2}</span></h1>
          <p>${pDesc.slice(0, 80)}${pDesc.length > 80 ? '…' : ''}</p>
          <a href="#trabajos" class="link-arrow">Ver proyectos ↓</a>
        </div>
      </div>
    `;
  }).join('');

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

// ===== FORMULARIO CONTACTO =====
document.getElementById('contactoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button');
  const cfg  = currentSiteConfig || {};
  const formspreeId = cfg.formspree || '';

  if (!formspreeId) {
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

  btn.textContent = 'Enviando...';
  btn.disabled = true;

  const data = new FormData(form);
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

// ===== INICIALIZACIÓN ASÍNCRONA DESDE EL SERVIDOR =====
async function initApp() {
  currentProyectos = await fetchProyectos();
  currentSiteConfig = await fetchSiteConfig();

  renderTrabajosPortfolio(currentProyectos);
  buildCarousel(currentProyectos);
  autoTimer();

  // Aplicar configuración visual
  if (currentSiteConfig.title) {
    document.title = currentSiteConfig.title;
    const logo = document.querySelector('.nav-logo');
    if (logo) logo.textContent = currentSiteConfig.title;
    const footerSpan = document.querySelector('.footer span');
    if (footerSpan) footerSpan.textContent = currentSiteConfig.title + ' ' + new Date().getFullYear();
  }

  const footerLinks = document.querySelectorAll('.footer-links a');
  if (footerLinks.length >= 1 && currentSiteConfig.github) {
    footerLinks[0].href = currentSiteConfig.github;
  }
  if (footerLinks.length >= 2 && currentSiteConfig.linkedin) {
    footerLinks[1].href = currentSiteConfig.linkedin;
  }
}

initApp();
