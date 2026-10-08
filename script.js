(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  root.classList.add('js');
  window.addEventListener('load', () => document.body.classList.add('loaded'));
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Skill sticker marquees ---------- */
  document.querySelectorAll('[data-skills]').forEach(track => {
    const items = track.dataset.skills.split('|');
    const addSet = hidden => items.forEach(text => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = text;
      tag.dataset.cursor = 'pill';
      if (hidden) tag.setAttribute('aria-hidden', 'true');
      track.appendChild(tag);
    });
    addSet(false);
    const setWidth = track.getBoundingClientRect().width || 1;
    const copies = Math.max(1, Math.ceil(Math.max(innerWidth, screen.width) / setWidth));
    for (let i = 0; i < copies * 2 - 1; i++) addSet(true);
  });

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    const ring = document.querySelector('.cursor-ring');
    const label = ring.querySelector('span');
    const dot = document.querySelector('.cursor-dot');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    document.body.classList.add('has-cursor');

    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
    });
    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();

    const states = ['is-cta', 'is-card', 'is-img', 'is-pill'];
    const setState = (cls, text = '') => {
      ring.classList.remove(...states);
      if (cls) ring.classList.add(cls);
      label.textContent = text;
    };
    document.querySelectorAll('[data-cursor]').forEach(el => {
      const t = el.dataset.cursor;
      el.addEventListener('mouseenter', () => setState('is-' + t, el.dataset.label || ''));
      el.addEventListener('mouseleave', () => setState(''));
    });
    document.querySelectorAll('a:not([data-cursor]), input, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => setState('is-cta'));
      el.addEventListener('mouseleave', () => setState(''));
    });
    addEventListener('mousedown', () => ring.classList.add('is-down'));
    addEventListener('mouseup', () => ring.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => (ring.style.opacity = 0));
    document.addEventListener('mouseenter', () => (ring.style.opacity = 1));
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const siblings = [...en.target.parentElement.children].filter(c => c.classList.contains('reveal'));
      en.target.style.transitionDelay = reduce ? '0s' : `${siblings.indexOf(en.target) * 0.1}s`;
      en.target.classList.add('in');
      en.target.addEventListener('transitionend', () => { en.target.style.transitionDelay = ''; }, { once: true });
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  reveals.forEach(el => io.observe(el));

  /* ---------- Count-up numbers ---------- */
  const fmt = (n, prefix) => {
    if (prefix && n >= 1e6) return prefix + (n / 1e6).toFixed(1) + 'M';
    return (prefix || '') + Math.round(n).toLocaleString('en-US');
  };
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count, prefix = el.dataset.prefix || '';
      cio.unobserve(el);
      if (reduce || end === 0) { el.textContent = fmt(end, prefix); return; }
      const dur = 1800, start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = fmt(end * (1 - Math.pow(1 - p, 4)), prefix);
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => cio.observe(el));

  /* ---------- Card tilt + tap to open ---------- */
  document.querySelectorAll('[data-tilt]').forEach(card => {
    if (finePointer && !reduce) {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--gx', (x + 0.5) * 100 + '%');
        card.style.setProperty('--gy', (y + 0.5) * 100 + '%');
        card.style.transition = 'transform .1s linear, box-shadow .3s';
        card.style.transform = `perspective(800px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1), box-shadow .3s';
        card.style.transform = '';
      });
    }
    card.addEventListener('click', () => {
      if (!finePointer) card.classList.toggle('open');
    });
  });

  /* ---------- Contact form ---------- */
  const form = document.querySelector('.form');
  const msg = form.querySelector('.form-msg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => {
      const valid = f.type === 'email' ? /^\S+@\S+\.\S+$/.test(f.value) : f.value.trim().length > 0;
      f.classList.remove('invalid');
      if (!valid) {
        void f.offsetWidth; // restart shake animation
        f.classList.add('invalid');
        ok = false;
      }
    });
    if (!ok) { msg.textContent = 'Almost! Fill in the highlighted fields.'; return; }
    const name = form.elements['name'].value.trim().split(' ')[0];
    msg.textContent = `Got it, ${name}! I'll reply within 24 hours. 🎉`;
    form.reset();
  });
})();
