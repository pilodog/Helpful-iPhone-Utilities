// "Sfoglia l'estratto" — vertical 1080×1920 promo: the pages of the free PDF extract flip (top-hinged, like a notepad)
// while the book's selling points appear below. Logo band on top, end card at the close.
export const W = 1080, H = 1920;
const BAND = 384, TEAL = '#00D5CD', WHITE = '#F5F4F0', BG = '#2A2D31';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t, seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - clamp(t), 3), eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };

// shots: the page shown, the voice line, the caption (two lines; the second in teal). extra = pages flipped quickly inside the shot.
const SHOTS = [
  { page: 1, line: 'L1', cap: ['Prepari il concorso?', 'Sfoglia il Modulo 1'], lead: .5, tail: .8 },
  { page: 3, line: 'L2', cap: ['12 moduli', 'un solo metodo'], tail: 1.4 },
  { page: 6, line: 'L3', cap: ['Teoria chiara', 'aggiornata al profilo 2025'], tail: .5 },
  { page: 7, extra: [8], line: 'L4', cap: ['«Da ricordare»', 'e i trabocchetti da evitare'], tail: 1.6 },
  { page: 11, line: 'L5', cap: ['Test da 10 domande', 'come al concorso'], tail: 1.4 },
  { page: 13, line: 'L6', cap: ['Ogni risposta spiegata', 'perché è giusta, perché le altre no'], tail: 1.7 },
  { page: 16, line: 'L7', cap: ['180 domande · 180 spiegazioni', '+ simulazione finale'], tail: .5 },
  { page: 16, line: 'L8', cap: ['Il Modulo 1 è gratuito.', 'Il libro completo ti aspetta.'], tail: 1.6 },
  { page: 16, line: null, cap: ['Segui la pagina o scrivi a', 'unadomandaalgiornotoglie@gmail.com'], dur: 5.6, small: true },
];
const SUB = { L1: 'Prepari il concorso per operatore socio sanitario? Sfoglia con me.', L2: '12 moduli, con lo stesso metodo.', L3: 'Prima la teoria: chiara, e aggiornata al nuovo profilo 2025.',
  L4: 'Con i riquadri da ricordare, e i trabocchetti da evitare.', L5: 'Poi il test: 10 domande, come al concorso.', L6: 'E ogni risposta è spiegata: perché è giusta, e perché le altre no.',
  L7: 'In tutto: 180 domande, 180 spiegazioni, e una simulazione finale.', L8: 'Il Modulo 1 è gratuito. Il libro completo ti aspetta.' };
const FLIP = .5;
export let DUR = 40, END = 37, VO = {}; let T0 = [], FL = [], DURS = {};
export function init(dur) {
  DURS = dur; let t = 0; T0 = []; FL = []; VO = {};
  SHOTS.forEach((s, i) => {
    T0.push(t); const prev = i ? (SHOTS[i - 1].extra ? SHOTS[i - 1].extra.at(-1) : SHOTS[i - 1].page) : null;
    if (i && prev !== s.page) FL.push({ t, from: prev, to: s.page });
    const lead = s.lead ?? .45, d = s.line ? lead + dur[s.line] + (s.tail ?? .6) : s.dur;
    if (s.line) VO[s.line] = +(t + lead).toFixed(2);
    if (s.extra) s.extra.forEach((p, k) => FL.push({ t: t + d * (k + 1) / (s.extra.length + 1) + .2, from: k ? s.extra[k - 1] : s.page, to: p }));
    t += d;
  });
  END = +t.toFixed(2); DUR = +(END + 3).toFixed(2);
}
export const subtitleCues = () => Object.keys(VO).map(id => ({ t0: VO[id], t1: +(VO[id] + DURS[id] + .5).toFixed(2), text: SUB[id] }));
let IMG = {};
export async function loadImages() {
  const ld = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
  IMG.logo = await ld('logo.png'); IMG.fin = await ld('finale.png'); IMG.p = {};
  for (const n of [1, 3, 6, 7, 8, 11, 13, 16]) IMG.p[n] = await ld(`pages/p-${String(n).padStart(2, '0')}.png`);
}
let TXT = [];
const note = (id, t, x0, y0, x1, y1, pass) => TXT.push({ id, text: t, x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1), ...(pass ? { pass: true } : {}) });

// ---------- the page ----------
const PW = 760, PH = Math.round(760 * 1287 / 910), PX = (W - PW) / 2, PY = 432;
function flat(g, img, s = 1) { const w = PW * s, h = PH * s; g.drawImage(img, W / 2 - w / 2, PY + (PH - h) / 2, w, h); }
function stack(g) { // the paper thickness under the top page + a soft shadow
  g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 50; g.shadowOffsetY = 24; g.fillStyle = '#D9D6CF'; g.fillRect(PX + 6, PY + 8, PW, PH + 6); g.restore();
  for (let i = 3; i >= 1; i--) { g.fillStyle = ['#E9E6DF', '#DDD9D1', '#CFCBC2'][i - 1]; g.fillRect(PX + i * 2, PY + i * 3, PW, PH); }
}
function flipping(g, img, u) { // top-hinged page rotating toward the viewer and up: u 0 → 1
  const a = eio(u) * Math.PI / 2 * 1.02, c = Math.max(0, Math.cos(a)), sn = Math.sin(a), n = 90;
  if (c <= .005) return;
  // the shadow it casts on the page below
  const sh = g.createLinearGradient(0, PY, 0, PY + PH * c + 160 * sn); sh.addColorStop(0, `rgba(0,0,0,${.35 * sn})`); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(PX, PY + PH * c, PW, 160 * sn);
  for (let i = 0; i < n; i++) {
    const v0 = i / n, v1 = (i + 1) / n, s = 1 + v0 * sn * .28, y0 = PY + v0 * PH * c, y1 = PY + v1 * PH * c, w = PW * s;
    g.drawImage(img, 0, v0 * img.height, img.width, img.height / n + 1, W / 2 - w / 2, y0, w, y1 - y0 + 1);
  }
  const wB = PW * (1 + sn * .28); g.beginPath(); g.moveTo(PX, PY); g.lineTo(PX + PW, PY); g.lineTo(W / 2 + wB / 2, PY + PH * c); g.lineTo(W / 2 - wB / 2, PY + PH * c); g.closePath();
  const dk = g.createLinearGradient(0, PY, 0, PY + PH * c); dk.addColorStop(0, `rgba(0,0,0,${.05 * sn})`); dk.addColorStop(1, `rgba(0,0,0,${.5 * sn})`); g.fillStyle = dk; g.fill();
}
function background(g, t) {
  const r = g.createRadialGradient(W / 2, 700, 0, W / 2, 1000, 1300); r.addColorStop(0, '#3D4146'); r.addColorStop(.5, '#2E3135'); r.addColorStop(1, '#1F2124'); g.fillStyle = r; g.fillRect(0, 0, W, H);
}
function logoBand(g) {
  g.fillStyle = '#24272A'; g.fillRect(0, 0, W, BAND); const lw = Math.round(W * .83), lh = Math.round(lw * IMG.logo.height / IMG.logo.width);
  g.drawImage(IMG.logo, (W - lw) / 2, (BAND - lh) / 2, lw, lh); g.fillStyle = TEAL; g.fillRect(0, BAND - 6, W, 6);
}
function fitFont(g, s, w, px, wt, max) { let p = px; do { g.font = `${wt} ${p}px Jost`; if (g.measureText(s).width <= max) break; p -= 2; } while (p > 24); return p; }
function caption(g, t) {
  const i = Math.max(0, T0.findLastIndex(x => t >= x)), s = SHOTS[i], t0 = T0[i], t1 = i + 1 < T0.length ? T0[i + 1] : END;
  const a = seg(t, t0 + .15, t0 + .45) * (1 - seg(t, t1 - .2, t1 - .02) * (i + 1 < SHOTS.length ? 1 : 0));
  if (a <= 0) return; const y = 1640;
  g.save(); g.globalAlpha = clamp(a * 1.5); g.translate(0, (1 - eo(a)) * 24); g.textAlign = 'center';
  const p1 = fitFont(g, s.cap[0], 0, s.small ? 48 : 68, 700, W - 100); g.fillStyle = WHITE; g.fillText(s.cap[0], W / 2, y);
  const p2 = fitFont(g, s.cap[1], 0, s.small ? 50 : 56, 600, W - 90); g.fillStyle = TEAL; g.fillText(s.cap[1], W / 2, y + 80);
  g.restore();
  if (a > .9) note('cap' + i, s.cap.join(' '), 40, y - 70, W - 40, y + 100);
}
export function render(g, t) {
  TXT = []; g.setTransform(1, 0, 0, 1, 0, 0);
  if (t >= END) { g.drawImage(IMG.fin, 0, 0, W, H); return; }
  background(g, t);
  // which page is on top, and whether a flip is running
  let cur = 1; for (const f of FL) if (t >= f.t) cur = f.to;
  const f = FL.find(f => t >= f.t && t < f.t + FLIP);
  const intro = eo(seg(t, 0, .7));
  g.save(); g.translate(0, (1 - intro) * 500); g.globalAlpha = clamp(intro * 2);
  stack(g);
  // a slow push on the held page
  const i = Math.max(0, T0.findLastIndex(x => t >= x)), hold = seg(t, T0[i], (T0[i + 1] ?? END));
  g.save(); g.beginPath(); g.rect(PX, PY, PW, PH); g.clip(); flat(g, IMG.p[cur], f ? 1 : 1 + hold * .025); g.restore();
  if (f) flipping(g, IMG.p[f.from], (t - f.t) / FLIP);
  g.restore();
  // the "free extract" badge on the first shot
  const b = seg(t, 1.0, 1.3) * (1 - seg(t, T0[1] - .3, T0[1]));
  if (b > 0) { g.save(); g.translate(880, 520); g.rotate(.2); g.scale(back(b, 2.2), back(b, 2.2)); g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fillStyle = TEAL; g.fill(); g.fillStyle = '#15171A'; g.textAlign = 'center'; g.font = '700 46px Jost'; g.fillText('GRATIS', 0, -2); g.font = '600 26px Jost'; g.fillText('16 pagine', 0, 36); g.restore(); if (b > .9) note('badge', 'GRATIS 16 pagine', 760, 400, 1000, 640); }
  caption(g, t); logoBand(g);
  const fo = seg(t, END - .4, END); if (fo > 0) { g.globalAlpha = fo; g.drawImage(IMG.fin, 0, 0, W, H); g.globalAlpha = 1; }
}
export function texts(g, t) { render(g, t); return TXT; }
export function events() {
  const E = [], ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  ev(0.05, 'whoosh'); ev(1.0, 'pop'); FL.forEach((f, i) => { ev(f.t, 'flip'); ev(f.t + FLIP, 'chord', { i }); });
  T0.slice(1).forEach(t => ev(t + .15, 'tick')); ev(END - .4, 'endcard');
  Object.entries(VO).forEach(([id, t]) => ev(t, 'vo', { id }));
  E.push({ t: 0, type: 'meta', end: END });
  return E.sort((a, b) => a.t - b.t);
}
