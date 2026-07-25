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
track.addEventListener('touchend',   e => {
  const d = tx - e.changedTouches[0].clientX;
  if (Math.abs(d) > 40) { d > 0 ? goTo(current + 1) : goTo(current - 1); reset(); }
});

auto();

// ===== ANIMACIÓN SCROLL EN TRABAJOS =====
const trabajos = document.querySelectorAll('.trabajo');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

trabajos.forEach(t => observer.observe(t));

// ===== FORMULARIO =====
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
