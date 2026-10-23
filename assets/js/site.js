// Chattanooga & Wiener Stadtbräu – Prototyp
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const plate = $('#plate');
  const floors = $('.floors');

  // ---------- Wiener Zeit ----------
  function viennaNow() {
    const parts = new Intl.DateTimeFormat('de-AT', {
      timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false
    }).formatToParts(new Date());
    const get = (t) => (parts.find((p) => p.type === t) || {}).value;
    const h = parseInt(get('hour'), 10) % 24, m = parseInt(get('minute'), 10);
    const wd = (get('weekday') || '').replace('.', '').slice(0, 2);
    return { mins: h * 60 + m, h, wd };
  }
  // Öffnungszeiten (Stadtbräu: Platzhalter, bitte bestätigen)
  const HOURS = { eg: [8 * 60, 24 * 60], ug: [16 * 60, 23 * 60] };
  const fmt = (mins) => (mins >= 1440 ? '24' : String(Math.floor(mins / 60))) + (mins % 60 ? ':' + String(mins % 60).padStart(2, '0') : '') + ' Uhr';

  function updateStatus() {
    const now = viennaNow();
    for (const key of ['eg', 'ug']) {
      const el = $(`[data-status="${key}"]`);
      const [o, c] = HOURS[key];
      const open = now.mins >= o && now.mins < c;
      el.classList.toggle('open', open);
      el.textContent = open ? `Jetzt geöffnet · bis ${fmt(c)}` : (now.mins < o ? `Öffnet heute um ${fmt(o)}` : `Geschlossen · morgen ab ${fmt(o)}`);
      if (key === 'ug') plate.dataset.openUg = open ? '1' : '0';
    }
    const today = $$('.days li').find((li) => li.querySelector('b').textContent === now.wd);
    $$('.days li').forEach((li) => li.classList.toggle('today', li === today));
    return now;
  }

  // ---------- Etage wählen ----------
  let sticky = '';
  function setFloor(f) {
    plate.dataset.floor = f || '';
    floors.dataset.floor = f || '';
  }
  $$('.zone').forEach((z) => {
    z.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setFloor(z.dataset.floor); });
    z.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setFloor(sticky); });
    z.addEventListener('click', () => {
      sticky = sticky === z.dataset.floor ? '' : z.dataset.floor;
      setFloor(sticky);
      if (sticky && window.matchMedia('(max-width: 700px)').matches) {
        $(`.floor-card[data-floor="${sticky}"]`).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
  $$('.floor-card').forEach((c) => {
    c.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setFloor(c.dataset.floor); });
    c.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setFloor(sticky); });
  });

  // ---------- Tag / Abend ----------
  function setMood(m) {
    plate.dataset.mood = m;
    $$('.mood-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mood === m)));
  }
  $$('.mood-toggle button').forEach((b) => b.addEventListener('click', () => setMood(b.dataset.mood)));

  // ---------- Zapfhahn ----------
  const pour = $('#pour');
  let pourTimer;
  $('#tap').addEventListener('click', () => {
    clearTimeout(pourTimer);
    pour.hidden = false;
    pour.classList.remove('go'); void pour.offsetWidth; pour.classList.add('go');
    setFloor('ug');
    pourTimer = setTimeout(() => { pour.hidden = true; setFloor(sticky); }, 4200);
  });

  // ---------- Kartenstapel ----------
  const deck = $('#deck');
  const cards = $$('.card', deck);
  const count = $('#count');
  let idx = 0;
  function layout() {
    const narrow = window.innerWidth < 700;
    const step = narrow ? 30 : 58, step2 = narrow ? 52 : 100;
    cards.forEach((card, i) => {
      let d = i - idx;
      const n = cards.length;
      if (d > n / 2) d -= n; if (d < -n / 2) d += n;
      const a = Math.abs(d);
      const x = a === 0 ? 0 : Math.sign(d) * (a === 1 ? step : step2);
      const rot = d * (narrow ? 4 : 6);
      const sc = a === 0 ? 1 : a === 1 ? .9 : .8;
      card.style.transform = `translateX(${x}%) rotate(${rot}deg) scale(${sc})`;
      card.style.zIndex = String(10 - a);
      card.style.opacity = a > 2 ? '0' : a === 2 ? (narrow ? '0' : '.55') : '1';
      card.style.filter = a === 0 ? 'none' : 'saturate(.8) brightness(.97)';
      card.classList.toggle('is-front', a === 0);
      card.setAttribute('aria-hidden', String(a !== 0));
      $$('a', card).forEach((l) => (l.tabIndex = a === 0 ? 0 : -1));
    });
    count.textContent = `${idx + 1} / ${cards.length}`;
  }
  const go = (n) => { idx = (n + cards.length) % cards.length; layout(); };
  $('#prev').addEventListener('click', () => go(idx - 1));
  $('#next').addEventListener('click', () => go(idx + 1));
  cards.forEach((c, i) => c.addEventListener('click', (e) => { if (i !== idx) { e.preventDefault(); go(i); } }));
  deck.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
  });
  let sx = null;
  deck.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  deck.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
  });
  window.addEventListener('resize', layout);
  layout();

  // ---------- Lift ----------
  const liftBtns = $$('.lift-btn');
  function markLift(f) {
    liftBtns.forEach((b) => b.setAttribute('aria-current', String(b.dataset.go === f)));
  }
  liftBtns.forEach((b) => b.addEventListener('click', () => {
    const target = b.dataset.go === 'ug' ? '#stadtbraeu' : '#chattanooga';
    $(target).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  const ugSection = $('#stadtbraeu');
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) markLift(en.isIntersecting ? 'ug' : 'eg');
  }, { rootMargin: '-45% 0px -45% 0px' });
  io.observe(ugSection);
  markLift('eg');
  new IntersectionObserver(([en]) => document.body.classList.toggle('lift-on', !en.isIntersecting), { threshold: 0 }).observe($('.hero'));

  // ---------- Mobil: Haus zum Wischen, mittig starten ----------
  const scroller = $('#scroller');
  function centerPlate() {
    if (scroller.scrollWidth > scroller.clientWidth) scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  }
  centerPlate();
  $('.stage img').addEventListener('load', centerPlate);
  scroller.addEventListener('pointerdown', () => plate.classList.add('swiped'), { once: true, passive: true });

  // ---------- Einstieg je Domain ----------
  function enter(floor, scroll) {
    document.body.dataset.entry = floor;
    sticky = floor; setFloor(floor);
    if (floor === 'ug') setMood('abend');
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('.proto-links a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    enter(a.dataset.entry, true);
  }));

  // ---------- Telefonnummer kopieren ----------
  $$('.copy').forEach((btn) => btn.addEventListener('click', () => {
    const el = document.getElementById(btn.dataset.copy);
    const done = () => { btn.textContent = 'Kopiert'; setTimeout(() => (btn.textContent = 'Kopieren'), 1600); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(el.textContent.trim()).then(done, fallback); } catch { fallback(); }
  }));

  // ---------- Start ----------
  const now = updateStatus();
  setMood(now.h >= 18 || now.h < 7 ? 'abend' : 'tag');
  const host = location.hostname;
  if (/stadtbraeu/i.test(host) || location.hash === '#unten') enter('ug', false);
  setInterval(updateStatus, 60_000);
})();
