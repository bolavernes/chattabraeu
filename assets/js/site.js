// Chattanooga & Wiener Stadtbräu: das Haus zeigt, wie es gerade am Graben ist.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Einstellungen (kommen später aus dem Editor) ----------
  const CONFIG = {
    lat: 48.2087, lon: 16.3695,
    places: {
      chatta: { name: 'Chattanooga', open: 8 * 60, close: 24 * 60 },
      garten: { name: 'Schanigarten', open: 8 * 60, close: 23 * 60, season: true, closeInBadWeather: true },
      braeu: { name: 'Wiener Stadtbräu', open: 16 * 60, close: 23 * 60 } // bitte bestätigen
    }
  };

  // ---------- Zustand ----------
  const sim = { minutes: null, wx: null, season: true, entry: null }; // null = live
  let liveWx = null; // { kind, word, temp }

  // ---------- Wiener Zeit ----------
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  function vienna(date = new Date()) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(date).map((x) => [x.type, x.value]));
    const y = +p.year, mo = +p.month, d = +p.day, h = +p.hour % 24, mi = +p.minute;
    const offset = Math.round((Date.UTC(y, mo - 1, d, h, mi) - date.getTime()) / 60000);
    const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
    return { y, mo, d, mins: h * 60 + mi, offset, wd };
  }

  // Sonnenauf- und -untergang (NOAA-Näherung), Ergebnis in Wiener Minuten
  function sunTimes(v) {
    const rad = Math.PI / 180;
    const day = Math.floor((Date.UTC(v.y, v.mo - 1, v.d) - Date.UTC(v.y, 0, 0)) / 864e5);
    const g = 2 * Math.PI / 365 * (day - 1);
    const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const lat = CONFIG.lat * rad;
    const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl)) / rad;
    const noonUtc = 720 - 4 * CONFIG.lon - eqt;
    return { rise: noonUtc - 4 * ha + v.offset, set: noonUtc + 4 * ha + v.offset };
  }
  function phaseAt(mins, sun) {
    const near = (t) => Math.abs(mins - t) <= 40;
    if (near(sun.rise) || near(sun.set)) return 'daemmerung';
    return mins > sun.rise && mins < sun.set ? 'tag' : 'nacht';
  }

  const hm = (m) => { m = ((m % 1440) + 1440) % 1440; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
  const uhr = (m) => (m >= 1440 ? '24' : (m % 60 ? hm(m) : String(Math.floor(m / 60)))) + ' Uhr';

  // ---------- Wetter (Open-Meteo, ohne Schlüssel) ----------
  function wmo(code) {
    if (code === 0 || code === 1) return { kind: 'clear', word: code ? 'überwiegend klar' : 'klar' };
    if (code === 2) return { kind: 'cloud', word: 'teils bewölkt' };
    if (code === 3) return { kind: 'cloud', word: 'bedeckt' };
    if (code === 45 || code === 48) return { kind: 'fog', word: 'Nebel' };
    if (code >= 51 && code <= 57) return { kind: 'rain', word: 'Nieselregen' };
    if (code === 61 || code === 80) return { kind: 'rain', word: 'leichter Regen' };
    if (code === 63 || code === 81) return { kind: 'rain', word: 'Regen' };
    if (code === 65 || code === 82 || code === 66 || code === 67) return { kind: 'rain', word: 'starker Regen' };
    if (code === 71 || code === 85) return { kind: 'snow', word: 'leichter Schneefall' };
    if (code === 73 || code === 75 || code === 77 || code === 86) return { kind: 'snow', word: 'Schneefall' };
    if (code >= 95) return { kind: 'storm', word: 'Gewitter' };
    return { kind: 'cloud', word: '' };
  }
  async function loadWeather() {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&current=temperature_2m,weather_code&timezone=Europe%2FVienna`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      liveWx = { ...wmo(j.current.weather_code), temp: Math.round(j.current.temperature_2m) };
    } catch { liveWx = null; }
    render();
  }
  const SIM_WX = {
    clear: { kind: 'clear', word: 'klar', temp: 14 },
    rain: { kind: 'rain', word: 'Regen', temp: 9 },
    snow: { kind: 'snow', word: 'Schneefall', temp: -1 },
    fog: { kind: 'fog', word: 'Nebel', temp: 4 }
  };

  // ---------- Status ----------
  const bad = (wx) => wx && ['rain', 'snow', 'storm'].includes(wx.kind);
  function stateOf(key, mins, wx) {
    const p = CONFIG.places[key];
    if (key === 'garten') {
      if (!sim.season) return { state: 'zu', text: 'Winterpause, drinnen ist offen' };
      if (mins >= p.open && mins < p.close && p.closeInBadWeather && bad(wx)) {
        return { state: 'zu', text: wx.kind === 'snow' ? 'Heute drinnen, es schneit' : 'Heute drinnen, es regnet' };
      }
    }
    if (mins >= p.open && mins < p.close) {
      const left = p.close - mins;
      return left <= 30 ? { state: 'bald', text: `Schließt um ${uhr(p.close)}` } : { state: 'offen', text: `Offen bis ${uhr(p.close)}` };
    }
    if (mins < p.open) {
      return p.open - mins <= 60 ? { state: 'bald', text: `Öffnet um ${uhr(p.open)}` } : { state: 'zu', text: `Öffnet heute um ${uhr(p.open)}` };
    }
    return { state: 'zu', text: `Geschlossen, morgen ab ${uhr(p.open)}` };
  }

  // ---------- Wetter-Animation ----------
  const canvas = $('#wx');
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let drops = [], kind = 'clear', raf = 0;
  function sizeCanvas() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }
  function seed() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const n = kind === 'rain' || kind === 'storm' ? Math.round(w / 5) : kind === 'snow' ? Math.round(w / 9) : 0;
    drops = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      v: kind === 'snow' ? 0.4 + Math.random() * 0.9 : 9 + Math.random() * 7,
      l: kind === 'snow' ? 1 + Math.random() * 2.4 : 10 + Math.random() * 16,
      s: Math.random() * Math.PI * 2
    }));
  }
  function frame() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (kind === 'rain' || kind === 'storm') {
      ctx.strokeStyle = 'rgba(220,230,240,.42)'; ctx.lineWidth = 1.1; ctx.beginPath();
      for (const d of drops) {
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.18, d.y + d.l);
        if (!reduce) { d.y += d.v; d.x -= d.v * 0.18; if (d.y > h) { d.y = -20; d.x = Math.random() * w * 1.1; } }
      }
      ctx.stroke();
    } else if (kind === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (const d of drops) {
        ctx.beginPath(); ctx.arc(d.x, d.y, d.l, 0, Math.PI * 2); ctx.fill();
        if (!reduce) { d.s += 0.02; d.y += d.v; d.x += Math.sin(d.s) * 0.5; if (d.y > h + 4) { d.y = -4; d.x = Math.random() * w; } }
      }
    }
    if (!reduce && drops.length) raf = requestAnimationFrame(frame);
  }
  function setWeatherFx(k) {
    if (k === kind && drops.length) return;
    kind = k; cancelAnimationFrame(raf); seed(); frame();
  }
  window.addEventListener('resize', sizeCanvas);

  // ---------- Darstellung ----------
  const photo = $('#photo');
  function render() {
    const v = vienna();
    const mins = sim.minutes ?? v.mins;
    const wx = sim.wx ? SIM_WX[sim.wx] : liveWx;
    const sun = sunTimes(v);
    photo.dataset.phase = phaseAt(mins, sun);
    photo.dataset.wx = wx ? wx.kind : 'clear';
    setWeatherFx(wx ? wx.kind : 'clear');

    const wxText = wx ? ` ${wx.temp} Grad${wx.word ? ', ' + wx.word : ''}.` : '';
    $('#now').textContent = `${WD_LONG[v.wd]}, ${hm(mins)} am Graben.${wxText}`;

    for (const key of Object.keys(CONFIG.places)) {
      const s = stateOf(key, mins, wx);
      $$(`[data-place="${key}"]`).forEach((el) => { el.dataset.state = s.state; });
      $$(`.state[data-place="${key}"] .st`).forEach((el) => { el.textContent = s.text; });
      $$(`.hours tr[data-place="${key}"] .live`).forEach((el) => { el.textContent = s.state === 'offen' ? 'jetzt offen' : s.state === 'bald' ? s.text.toLowerCase() : 'jetzt zu'; });
    }
    $$('.days li').forEach((li) => li.classList.toggle('today', li.dataset.wd === WD[v.wd]));
  }

  // ---------- Speisekarte: Tabs ----------
  const tabs = $$('[role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        selectTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true);
      }
    });
  });
  $$('[data-tab]').forEach((a) => a.addEventListener('click', () => selectTab($(`#tab-${a.dataset.tab}`))));

  // ---------- Einstieg je Domain ----------
  function setEntry(braeu) {
    document.body.dataset.entry = braeu ? 'braeu' : 'chatta';
    selectTab($(braeu ? '#tab-braeu' : '#tab-chatta'));
  }
  setEntry(/stadtbraeu/i.test(location.hostname) || location.hash === '#unten');

  // ---------- Nummer kopieren ----------
  $$('.copy').forEach((btn) => btn.addEventListener('click', () => {
    const el = document.getElementById(btn.dataset.copy);
    const label = btn.textContent;
    const done = () => { btn.textContent = 'Kopiert'; setTimeout(() => (btn.textContent = label), 1600); };
    const select = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(el.textContent.trim()).then(done, select); } catch { select(); }
  }));

  // ---------- Vorschau-Regler (nur Prototyp) ----------
  const lab = $('#lab'), open = $('#proto-open');
  open.addEventListener('click', () => { lab.hidden = !lab.hidden; open.setAttribute('aria-expanded', String(!lab.hidden)); });
  const range = $('#lab-time'), out = $('#lab-time-out'), liveBtn = $('#lab-time-live');
  range.addEventListener('input', () => {
    sim.minutes = +range.value; out.textContent = hm(sim.minutes); liveBtn.setAttribute('aria-pressed', 'false'); render();
  });
  liveBtn.addEventListener('click', () => { sim.minutes = null; out.textContent = 'live'; liveBtn.setAttribute('aria-pressed', 'true'); render(); });
  $$('.lab [data-wx]').forEach((b) => b.addEventListener('click', () => {
    sim.wx = b.dataset.wx === 'live' ? null : b.dataset.wx;
    $$('.lab [data-wx]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  $('#lab-season').addEventListener('change', (e) => { sim.season = e.target.checked; render(); });
  const entryBox = $('#lab-entry');
  entryBox.checked = document.body.dataset.entry === 'braeu';
  entryBox.addEventListener('change', () => setEntry(entryBox.checked));

  // ---------- Start ----------
  range.value = String(vienna().mins - (vienna().mins % 15));
  sizeCanvas();
  render();
  loadWeather();
  setInterval(render, 60_000);
  setInterval(loadWeather, 15 * 60_000);
})();
