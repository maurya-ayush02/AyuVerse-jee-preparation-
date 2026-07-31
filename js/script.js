/* ==========================================================
   AyuVerse — Interactions
========================================================== */

// ===== Anti-cloning domain check (deterrent) =====
(function () {
  const allowed = 'maurya-ayush02.github.io';
  if (location.hostname !== allowed && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    document.documentElement.innerHTML = '<body style="background:#060814;color:#f3f4fb;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;"><div><h1>Unauthorized</h1><p>This content is only licensed to be served from <a href="https://' + allowed + '" style="color:#00c3fa">AyuVerse</a>.</p></div></body>';
  }
})();

// ===== Cookie Consent Banner =====
(function () {
  const banner = document.getElementById('cookieBanner');
  const allowBtn = document.getElementById('cookieAllow');
  const denyBtn = document.getElementById('cookieDeny');
  const toast = document.getElementById('toast');

  if (!banner || !allowBtn || !denyBtn) return;

  // Already decided — don't show banner again
  if (localStorage.getItem('ayuverse_cookies')) return;

  setTimeout(() => { banner.hidden = false; }, 800);

  function hideBanner() {
    banner.style.transition = 'opacity .25s, transform .3s';
    banner.style.opacity = '0';
    banner.style.transform = window.innerWidth <= 540
      ? 'translateY(110%)'
      : 'translateX(-50%) translateY(110%)';
    setTimeout(() => { banner.hidden = true; }, 320);
  }

  function showToast() {
    if (!toast) return;
    toast.hidden = false;
    setTimeout(() => {
      toast.classList.add('toast--out');
      toast.addEventListener('animationend', () => { toast.hidden = true; }, { once: true });
    }, 4000);
  }

  allowBtn.addEventListener('click', () => {
    localStorage.setItem('ayuverse_cookies', 'allowed');
    hideBanner();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') showToast();
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      showToast();
    }
  });

  denyBtn.addEventListener('click', () => {
    localStorage.setItem('ayuverse_cookies', 'denied');
    hideBanner();
  });
})();


(function () {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  const scrim = document.getElementById('navScrim');
  const subjectsToggle = document.getElementById('subjectsToggle');
  const subjectsPanel = document.getElementById('subjectsPanel');

  if (!toggle || !menu) return;

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    scrim.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');
    scrim.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  toggle.addEventListener('click', () => {
    menu.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  scrim.addEventListener('click', closeMenu);

  menu.querySelectorAll('.nav__links > li > a, .nav__cta').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  function closeDropdown() {
    if (!subjectsToggle) return;
    subjectsToggle.setAttribute('aria-expanded', 'false');
    subjectsPanel.classList.remove('is-open');
  }
  function openDropdown() {
    subjectsToggle.setAttribute('aria-expanded', 'true');
    subjectsPanel.classList.add('is-open');
  }
  if (subjectsToggle) {
    subjectsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      subjectsPanel.classList.contains('is-open') ? closeDropdown() : openDropdown();
    });
    subjectsPanel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('click', (e) => {
      if (!subjectsToggle.contains(e.target) && !subjectsPanel.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) closeMenu();
  });
})();

// ===== Header shadow once page scrolls =====
(function () {
  const header = document.querySelector('.header');
  if (!header) return;
  const onScroll = () => {
    header.style.boxShadow = window.scrollY > 8 ? '0 8px 30px rgba(0,0,0,.25)' : 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ===== Constellation hero background =====
// A lightweight node/line canvas that echoes the connecting-line motif
// already present in the AyuVerse logo and subject artwork.
(function () {
  const canvas = document.getElementById('constellation');
  if (!canvas) return;
  const hero = canvas.closest('.hero');
  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#00c3fa', '#0d7cf5', '#6b28f0'];

  let particles = [];
  let width = 0, height = 0, dpr = 1;
  let rafId = null;

  function initParticles() {
    const count = Math.min(70, Math.floor((width * height) / 16000));
    particles = Array.from({ length: Math.max(count, 20) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);
    const linkDist = 140;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist) {
          ctx.strokeStyle = `rgba(124, 140, 255, ${0.16 * (1 - dist / linkDist)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function step() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    }
    drawFrame();
    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (prefersReducedMotion) {
      drawFrame(); // single static frame, no loop
      return;
    }
    step();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!document.hidden && !prefersReducedMotion && !rafId) {
      step();
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      start();
    }, 200);
  });

  resize();
  start();
})();
