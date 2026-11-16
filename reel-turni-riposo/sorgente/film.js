// Reel "Turni e riposo", dark cartoon version — 1080×1920. Texts exactly as supplied by the author; voice reads every scene.
import { setClock, shape, ink, plane, star, sparkle, paperFinish, spline, ellipse, rect, rrect, xform, twos } from './engine/toon.js';
export const W = 1080, H = 1920;
const TEAL = '#00D5CD', TEALD = '#00908A', WHITE = '#FFFFFF', AMBER = '#F0B43C', INK = '#15171A', BGL = '#33373C', SKIN = '#E9C3A2', NAVY = '#3D4E6E', NAVYD = '#2C3A54', FN = 'DVC';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t, seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - clamp(t), 3), back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
// scenes: voice lines with the text block each one reveals
const PLAN = [
  { lines: ['L1a', 'L1b'], tail: 1.8 }, { lines: ['L2a', 'L2b'], tail: 1.9 }, { lines: ['L3a', 'L3b'], tail: 1.0 },
  { lines: ['L4a'], tail: 2.5 }, { lines: ['L5a', 'L5b'], tail: 1.7 }, { lines: ['L6a', 'L6b', 'L6c', 'L6d'], tail: 2.2, gap: .45 },
];
export let VO = {}, T0 = [], SC = [], DUR = 50; const XF = .35; let DURS = {};
export function init(dur) {
  DURS = dur; let t = 0; VO = {}; T0 = []; SC = [];
  for (const s of PLAN) { T0.push(t); let tl = t + .55; for (const id of s.lines) { VO[id] = +tl.toFixed(2); tl += dur[id] + (s.gap ?? .3); } const end = tl - (s.gap ?? .3) + s.tail; SC.push(end - t); t = end; }
  DUR = +t.toFixed(2);
}
const SUB = { L1a: 'Hai finito la notte alle 7.', L1b: 'Alle 18 sei di nuovo in turno?', L2a: 'Segui la pagina.', L2b: 'Ogni giorno una domanda. E i tuoi diritti, spiegati.', L3a: "11 ore di riposo consecutive tra un turno e l'altro.", L3b: 'D.Lgs. 66/2003, art. 7',
  L4a: 'Le deroghe esistono, ma solo se previste dal contratto, con riposo compensativo subito dopo.', L5a: 'Se ti chiamano in reperibilità, il riposo non si azzera: si recupera quello mancante.', L5b: 'Interpretazione ministeriale',
  L6a: 'Commenta: ti è mai successo? Scrivi SÌ', L6b: 'Condividi con un collega', L6c: 'Segui la pagina', L6d: 'Controlla il tuo CCNL.' };
export const subtitleCues = () => Object.keys(VO).map(id => ({ t0: VO[id], t1: +(VO[id] + DURS[id] + .4).toFixed(2), text: SUB[id] }));
let LOGO; export async function loadImages() { LOGO = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'logo.png'; }); }
let TXT = []; const note = (id, text, x0, y0, x1, y1) => TXT.push({ id, text, x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1) });

// ---------- centred text with a shadow ----------
function wrap(g, s, max) { const out = []; let cur = ''; for (const w of s.split(' ')) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > max && cur) { out.push(cur); cur = w; } else cur = n; } if (cur) out.push(cur); return out; }
function drawBlocks(g, blocks, t, id, cy = 800) { // blocks: {text, px, color, bold, gap, at}
  let h = 0; const L = blocks.map(b => { g.font = `${b.bold === false ? 400 : 700} ${b.px}px ${FN}`; const lines = wrap(g, b.text, 950), lh = b.px * 1.18, o = { ...b, lines, lh, y: h + (b.gap || 0) }; h = o.y + lines.length * lh; return o; });
  const y0 = cy - h / 2; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  L.forEach((b, i) => {
    const a = seg(t, b.at - .15, b.at + .25); if (a <= 0) return;
    g.save(); g.globalAlpha = clamp(a * 1.5); g.translate(0, (1 - eo(a)) * 30); g.font = `${b.bold === false ? 400 : 700} ${b.px}px ${FN}`;
    g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 18; g.shadowOffsetY = 5; g.fillStyle = b.color || WHITE;
    b.lines.forEach((l, k) => g.fillText(l, W / 2, y0 + b.y + b.lh * (k + .82))); g.restore();
    if (a >= 1) note(id + i, b.text, 50, y0 + b.y, W - 50, y0 + b.y + b.lines.length * b.lh);
  });
}

// ---------- cartoon pieces (off-register fills, breathing ink line) ----------
const LINE = '#0E1013';
function ground(g, y = 1500, col = '#2A2D31', fl = '#202327') { plane(g, rect(0, 0, W, H), col); plane(g, rect(0, y, W, H - y), fl); ink(g, [[0, y], [W * .4, y], [W * .46, y], [W, y]], 3, { breaks: .35, seed: 7, color: '#4A4F55' }); }
function wallClock(g, cx, cy, R, hour) {
  shape(g, ellipse(cx, cy, R, R, 40), { fill: '#F5F4F0', line: 6, lineColor: LINE, seed: 20, shade: [{ pts: ellipse(cx + R * .3, cy + R * .3, R, R, 30), color: '#C9CCCF', alpha: .5 }] });
  for (let k = 0; k < 12; k++) { const q = k / 12 * Math.PI * 2; ink(g, [[cx + Math.cos(q) * R * .78, cy + Math.sin(q) * R * .78], [cx + Math.cos(q) * R * .9, cy + Math.sin(q) * R * .9]], k % 3 ? 4 : 8, { color: LINE, seed: 21 + k, taper: false }); }
  const ah = (hour % 12) / 12 * Math.PI * 2 - Math.PI / 2, am = (hour % 1) * Math.PI * 2 - Math.PI / 2;
  ink(g, [[cx, cy], [cx + Math.cos(ah) * R * .5, cy + Math.sin(ah) * R * .5]], 14, { color: LINE, seed: 40, taper: false });
  ink(g, [[cx, cy], [cx + Math.cos(am) * R * .72, cy + Math.sin(am) * R * .72]], 8, { color: TEALD, seed: 41, taper: false });
  shape(g, ellipse(cx, cy, 12, 12, 12), { fill: LINE, line: 0, seed: 42 });
}
function worker(g, x, y, s, o = {}) { // seated worker in navy scrubs, seen from the side, no face; slump 0..1
  const sl = o.slump || 0; g.save(); g.translate(x, y); g.scale(s, s);
  shape(g, rrect(-210, -20, 300, 50, 18), { fill: '#6A523F', line: 5, lineColor: LINE, seed: 50 });                       // bench
  ink(g, [[-180, 30], [-190, 190]], 10, { color: '#4A382B', seed: 51 }); ink(g, [[60, 30], [70, 190]], 10, { color: '#4A382B', seed: 52 });
  shape(g, [[-150, -50], [70, -60], [80, -5], [-140, 5]], { fill: NAVYD, line: 5, lineColor: LINE, seed: 53 });            // thighs
  shape(g, [[40, -40], [90, -30], [78, 170], [36, 170]], { fill: NAVYD, line: 5, lineColor: LINE, seed: 54 });             // shin
  shape(g, rrect(26, 160, 100, 34, 16), { fill: '#F5F4F0', line: 4, lineColor: LINE, seed: 55 });                         // clog
  g.save(); g.translate(-90, -40); g.rotate(sl * .32);
  shape(g, [[-70, 0], [-56, -260], [50, -280], [90, -250], [100, 0]], { fill: NAVY, line: 5, lineColor: LINE, seed: 56, shade: [{ pts: [[-70, 0], [-56, -260], [-16, -268], [-26, 0]], color: NAVYD, alpha: .7 }] });
  shape(g, [[-6, -276], [42, -280], [40, -312], [-2, -310]], { fill: SKIN, line: 4, lineColor: LINE, seed: 57 });          // neck
  g.save(); g.translate(22, -370); g.rotate(sl * .35); shape(g, ellipse(0, 0, 66, 72, 30), { fill: SKIN, line: 5, lineColor: LINE, seed: 58 });
  shape(g, spline([[-66, -10], [-50, -66], [0, -84], [50, -62], [40, -40], [0, -50], [-34, -30], [-48, 10]], true, 8), { fill: '#4A3328', line: 4, lineColor: LINE, seed: 59 });
  shape(g, ellipse(-58, -30, 26, 24, 16), { fill: '#4A3328', line: 4, lineColor: LINE, seed: 60 }); g.restore();
  ink(g, [[20, -240], [60, -130], [130 - sl * 30, -60]], 34, { color: LINE, taper: false, wob: .1, seed: 61 }); ink(g, [[20, -240], [60, -130], [130 - sl * 30, -60]], 24, { color: NAVY, taper: false, wob: .1, seed: 62 });
  shape(g, ellipse(136 - sl * 30, -56, 22, 20, 14), { fill: SKIN, line: 4, lineColor: LINE, seed: 63 });
  g.restore(); g.restore();
}
function bed(g, x, y, s, o = {}) { // side view: mattress, pillow, sleeper under a teal blanket
  g.save(); g.translate(x, y); g.scale(s, s);
  ink(g, [[-380, 0], [-380, 150]], 14, { color: '#8C96A3', seed: 70 }); ink(g, [[380, 0], [380, 150]], 14, { color: '#8C96A3', seed: 71 });
  shape(g, rrect(-420, -170, 40, 250, 12), { fill: '#8C96A3', line: 5, lineColor: LINE, seed: 72 });
  shape(g, rrect(-390, -40, 800, 90, 26), { fill: '#F5F4F0', line: 5, lineColor: LINE, seed: 73 });
  shape(g, rrect(-360, -110, 190, 80, 34), { fill: '#FFFFFF', line: 5, lineColor: LINE, seed: 74 });
  shape(g, ellipse(-250, -150, 56, 54, 24), { fill: SKIN, line: 5, lineColor: LINE, seed: 75 });
  shape(g, spline([[-306, -150], [-290, -200], [-240, -206], [-200, -180], [-230, -176], [-280, -160]], true, 8), { fill: '#4A3328', line: 4, lineColor: LINE, seed: 76 });
  const br = Math.sin(twos(o.t || 0) * 1.6) * 8;
  shape(g, spline([[-190, -40], [-180, -130 - br], [0, -150 - br], [200, -120], [400, -70], [410, -40]], true, 10), { fill: TEALD, line: 5, lineColor: LINE, seed: 77, shade: [{ pts: rect(-190, -80, 620, 60), color: '#006B66', alpha: .6 }] });
  g.restore();
}
function zzz(g, x, y, t, a = 1) { g.save(); g.textAlign = 'center'; for (let k = 0; k < 3; k++) { const u = ((twos(t) * .35 + k / 3) % 1); g.globalAlpha = a * (1 - u) * .9; g.font = `700 ${50 + u * 60}px ${FN}`; g.fillStyle = WHITE; g.fillText('Z', x + u * 120 + Math.sin(u * 6) * 14, y - u * 220); } g.restore(); }
function phone(g, x, y, s, t, ring = 1) {
  g.save(); g.translate(x, y); g.rotate(Math.sin(twos(t) * 40) * .07 * ring); g.scale(s, s);
  shape(g, rrect(-110, -200, 220, 400, 34), { fill: '#1B1E22', line: 6, lineColor: LINE, seed: 80 });
  shape(g, rrect(-92, -170, 184, 320, 14), { fill: TEALD, line: 0, seed: 81 });
  shape(g, ellipse(0, -30, 54, 54, 24), { fill: TEAL, line: 4, lineColor: LINE, seed: 82 });
  ink(g, spline([[-22, -48], [-26, -22], [-6, -6], [20, -10], [26, -28]], false, 6), 9, { color: LINE, seed: 83 });
  g.restore();
  for (const sd of [-1, 1]) for (let k = 1; k <= 3; k++) { const u = ((twos(t) * .9 + k / 3) % 1); ink(g, ellipse(x + sd * 130 * s, y, (40 + k * 46) * s, (70 + k * 60) * s, 16, sd > 0 ? -.7 : Math.PI - .7, sd > 0 ? .7 : Math.PI + .7), 7, { color: AMBER, alpha: ring * (1 - u), seed: 84 + k }); }
}
function contract(g, x, y, s, t, a) {
  g.save(); g.translate(x, y); g.rotate(-.05); g.scale(s, s);
  shape(g, rrect(-230, -300, 460, 600, 18), { fill: '#F5F4F0', line: 6, lineColor: LINE, seed: 90, shade: [{ pts: rect(60, -300, 170, 600), color: '#C9CCCF', alpha: .35 }] });
  for (let k = 0; k < 6; k++) ink(g, [[-170, -220 + k * 72], [-170 + (k % 3 === 2 ? 200 : 340) * eo(seg(a, k * .1, .4 + k * .1)), -220 + k * 72]], 9, { color: '#8C96A3', seed: 91 + k, taper: false });
  const st = seg(a, .7, .9); if (st > 0) { g.save(); g.translate(90, 190); g.rotate(-.2); g.scale(back(st, 2.4), back(st, 2.4)); shape(g, ellipse(0, 0, 86, 86, 30), { fill: null, line: 9, lineColor: TEALD, seed: 98 }); ink(g, [[-36, 0], [-10, 28], [40, -30]], 14, { color: TEALD, seed: 99, taper: false }); g.restore(); }
  g.restore();
}
// ---------- scenes ----------
const SCENE = [
  (g, t, v) => { ground(g, 1560); wallClock(g, 800, 1250, 170, lerp(7, 18, eo(seg(t, v.L1a + 1.0, v.L1b + 1.6)))); worker(g, 360, 1600, 1.0, { slump: eo(seg(t, v.L1b, v.L1b + 1.2)) });
    drawBlocks(g, [{ text: 'Hai finito la notte alle 7.', px: 88, color: TEAL, at: v.L1a }, { text: 'Alle 18 sei di nuovo in turno?', px: 88, gap: 36, at: v.L1b }], t, 's1', 740); },
  (g, t, v) => { ground(g, 1560, '#123E40', '#0E2E30'); phone(g, W / 2, 1420, 1.05, t, 0); for (let k = 0; k < 6; k++) sparkle(g, 200 + k * 140, 1180 + Math.sin(k * 2.3) * 60, 30 * seg(t, .4 + k * .15, .7 + k * .15), { fill: AMBER, rot: twos(t) * .3 });
    drawBlocks(g, [{ text: 'SEGUI LA PAGINA', px: 118, color: TEAL, at: v.L2a }, { text: 'Ogni giorno una domanda. E i tuoi diritti, spiegati.', px: 62, gap: 44, bold: false, at: v.L2b }], t, 's2', 740); },
  (g, t, v) => { ground(g, 1640); bed(g, W / 2, 1520, 1.05, { t }); zzz(g, 360, 1300, t, seg(t, .6, 1));
    drawBlocks(g, [{ text: '11 ORE', px: 210, color: TEAL, at: v.L3a }, { text: "di riposo consecutive tra un turno e l'altro", px: 72, gap: 16, at: v.L3a + .5 }, { text: 'D.Lgs. 66/2003, art. 7', px: 44, gap: 50, bold: false, at: v.L3b }], t, 's3', 760); },
  (g, t, v) => { ground(g, 1640); contract(g, W / 2, 1420, .78, t, seg(t, .4, 4.5));
    drawBlocks(g, [{ text: 'Le deroghe esistono,', px: 84, color: TEAL, at: v.L4a }, { text: 'ma solo se previste dal contratto, con riposo compensativo subito dopo.', px: 70, gap: 36, at: v.L4a + 1.2 }], t, 's4', 740); },
  (g, t, v) => { ground(g, 1640, '#2B303A', '#1F232B'); bed(g, 420, 1560, .8, { t }); phone(g, 860, 1380, .62, t, 1 - seg(t, v.L5a + 3, v.L5a + 3.6));
    drawBlocks(g, [{ text: 'Se ti chiamano in reperibilità, il riposo non si azzera:', px: 74, at: v.L5a }, { text: 'si recupera quello mancante.', px: 78, color: TEAL, gap: 30, at: v.L5a + 2.6 }, { text: 'Interpretazione ministeriale', px: 44, gap: 50, bold: false, at: v.L5b }], t, 's5', 740); },
  (g, t, v) => { ground(g, 1700);
    const B = [['Commenta: ti è mai successo? Scrivi SÌ', v.L6a], ['Condividi con un collega', v.L6b], ['Segui la pagina', v.L6c]], y0 = 520, bh = 250, gap = 44; g.textAlign = 'center';
    B.forEach(([s, at], k) => { const a = seg(t, at - .15, at + .25); if (a <= 0) return; const y = y0 + k * (bh + gap);
      g.save(); g.globalAlpha = clamp(a * 1.5); g.translate(W / 2, y + bh / 2); g.scale(back(a, 1.6), back(a, 1.6));
      shape(g, rrect(-460, -bh / 2, 920, bh, 28), { fill: BGL, line: 6, lineColor: TEAL, seed: 110 + k, grain: .15 });
      g.font = `700 58px ${FN}`; g.fillStyle = WHITE; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 12; g.shadowOffsetY = 4; const L = wrap(g, s, 800); L.forEach((l, j) => g.fillText(l, 0, (j - (L.length - 1) / 2) * 70 + 20)); g.restore();
      if (a >= 1) note('s6' + k, s, 80, y, W - 80, y + bh); });
    const c = seg(t, v.L6d - .15, v.L6d + .25); if (c > 0) { g.save(); g.globalAlpha = c; g.font = `700 66px ${FN}`; g.fillStyle = TEAL; g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 18; g.shadowOffsetY = 5; g.fillText('Controlla il tuo CCNL.', W / 2, 1520); g.restore(); if (c >= 1) note('s6c', 'Controlla il tuo CCNL.', 150, 1450, 930, 1540); } },
];
function brand(g) {
  g.save(); g.translate(W / 2, H / 2); g.rotate(-Math.atan2(H, W) * .78); g.font = `700 150px ${FN}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,.07)'; g.fillText('Riccardo Pilocane', 0, 0); g.restore();
  const lw = 820, lh = Math.round(lw * LOGO.height / LOGO.width); g.drawImage(LOGO, (W - lw) / 2, 70, lw, lh);
  g.fillStyle = TEAL; g.fillRect(0, 0, W, 12); g.fillRect(0, H - 12, W, 12);
}
function scene(g, i, lt) { const v = {}; for (const id of PLAN[i].lines) v[id] = VO[id] - T0[i]; SCENE[i](g, lt, v); paperFinish(g, W, H, .3); }
let OFF;
export function render(g, t) {
  TXT = []; setClock(t); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  const i = Math.min(SC.length - 1, T0.findLastIndex(x => t >= x)), lt = t - T0[i];
  scene(g, i, lt);
  if (i + 1 < SC.length && lt > SC[i] - XF) { OFF = OFF || new OffscreenCanvas(W, H); const o = OFF.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; const keep = TXT; scene(o, i + 1, 0); TXT = keep; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = seg(lt, SC[i] - XF, SC[i]); g.drawImage(OFF, 0, 0); g.globalAlpha = 1; }
  brand(g);
}
export function texts(g, t) { render(g, t); return TXT; }
export function events() { const E = []; Object.entries(VO).forEach(([id, t]) => E.push({ t, type: 'vo', id })); T0.slice(1).forEach(t => E.push({ t: +t.toFixed(2), type: 'cut' })); E.push({ t: 0, type: 'meta', dur: DUR }); return E.sort((a, b) => a.t - b.t); }
