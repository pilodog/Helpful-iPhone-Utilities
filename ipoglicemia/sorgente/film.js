// Ipoglicemia: sudato, pallido, confuso — vertical 1080×1920, Mid-century Cartoon on a dark anthracite ground.
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, arrow, paperFinish, spline, ellipse, rect, rrect, xform, clamp, lerp, seg, ss, eo, back, twos, hash, TAU } from './engine/toon.js';

export const W = 1080, H = 1920;
const BAND = 384;
// ---------- palette (the user's) ----------
const C = { bg: '#2A2D31', bgL: '#33373C', floor: '#222528', white: '#F5F4F0', soft: '#C9CCCF', teal: '#00D5CD', tealD: '#00908A', red: '#EB573C', redD: '#B23C27', amber: '#F0B43C', amberD: '#B9831E',
  blue: '#3D7DD8', ink: '#15171A', skin: '#E9C3A2', skinPale: '#E8DCD2', skinD: '#C99D7C', hair: '#D8D4CC', hairD: '#B5AFA4', shirt: '#6C7FA0', shirtD: '#4F607E', chair: '#8A6E58', chairD: '#6A523F', drop: '#BFE9F5' };
const SANS = (w, px) => `${w} ${px}px Jost`, SLAB = px => `${px}px Slab`;

// ---------- schedule: computed from the measured voice lengths ----------
// sections in order; each lists its lines. Every line starts after the previous one ends (+gap) and after its section's lead.
const PLAN = [
  { id: 'hook', lines: ['L01'], lead: .45, min: 4.6, tail: .9 },
  { id: 'day', lines: ['L02'], lead: .45, tail: .7 },
  { id: 'what', lines: ['L03', 'L04'], lead: .35, gap: .3, tail: .6 },
  { id: 's0', lines: ['L06'], lead: .2, min: 2.8, tail: 1.0 }, { id: 's1', lines: ['L07'], lead: .15, min: 2.6, tail: .9 }, { id: 's2', lines: ['L08'], lead: .15, min: 2.6, tail: .9 },
  { id: 's3', lines: ['L09'], lead: .15, min: 2.7, tail: .9 }, { id: 's4', lines: ['L10'], lead: .15, min: 2.6, tail: .9 },
  { id: 'warn', lines: ['L11', 'L12'], lead: .35, gap: .3, tail: .6 },
  { id: 'oss', lines: ['L13', 'L14', 'L15', 'L16', 'L17'], lead: .35, gap: .25, tail: 1.9 },
  { id: 'not', lines: ['L18'], lead: .4, tail: 1.2 },
  { id: 'key', lines: ['L19'], lead: .55, tail: 2.3, silence: .5 },
  { id: 'cta', lines: ['L20'], lead: .35, tail: 1.6 },
];
export let VO = {}, SEC = {}, DUR = 75, END = 72;
let DURS = {};
export function init(dur) {
  DURS = dur; let t = 0; VO = {}; SEC = {};
  for (const s of PLAN) {
    const t0 = t; let tl = t0 + (s.silence || 0) + s.lead;
    for (const id of s.lines) { VO[id] = +tl.toFixed(2); tl += (dur[id] || 2) + (s.gap || .35); }
    const end = Math.max(t0 + (s.min || 0), tl - (s.gap || .35) + s.tail);
    SEC[s.id] = [+t0.toFixed(2), +end.toFixed(2)]; t = end;
  }
  END = +t.toFixed(2); DUR = +(END + 3).toFixed(2);
}
const SUBTEXT = {
  L01: 'Sudato, pallido, confuso. Potrebbe essere la glicemia.', L02: 'Oggi, 14 novembre, è la Giornata mondiale del diabete.', L03: "L'ipoglicemia è un abbassamento della glicemia.",
  L04: 'Nella persona con diabete si parla di ipoglicemia sotto i 70 mg/dl.', L06: 'Sudorazione.', L07: 'Tremori.', L08: 'Pallore.', L09: 'Fame improvvisa.', L10: 'Confusione.',
  L11: "Attenzione: nell'anziano i segnali possono essere sfumati.", L12: 'Una confusione improvvisa può essere scambiata per demenza o stanchezza.', L13: "Cosa fa l'OSS?", L14: 'Non lascia sola la persona.',
  L15: "Avvisa subito l'infermiere.", L16: "Riferisce l'orario, i segnali e se ha mangiato.", L17: "Cosa dare lo stabiliscono l'infermiere e il protocollo.",
  L18: 'E non dà mai da bere o da mangiare a chi non è cosciente: rischio di soffocamento.', L19: 'Prima di pensare alla stanchezza, pensa alla glicemia.', L20: 'Lo sapevi che la soglia è 70? Scrivi 70 nei commenti.',
};
// burned captions only where the words are not already big on screen (the .srt has every line)
const CAP = new Set(['L02', 'L03', 'L04', 'L11', 'L12', 'L18']);
export function subtitleCues() {
  const ids = Object.keys(VO);
  return ids.map((id, i) => { const t0 = VO[id], d = DURS[id] || 2, nx = i + 1 < ids.length ? VO[ids[i + 1]] : 1e9; return { id, t0, t1: Math.min(nx - .1, Math.max(t0 + 1.8, t0 + d + .6, t0 + SUBTEXT[id].length / 12 + 1)), text: SUBTEXT[id] }; });
}
let IMG = {};
export async function loadImages() { const ld = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; }); IMG.logo = await ld('logo.png'); IMG.fin = await ld('finale.png'); }
let TXT = [];
const note = (id, t, x0, y0, x1, y1, pass) => TXT.push({ id, text: t, x0: Math.round(Math.max(0, x0)), y0: Math.round(y0), x1: Math.round(Math.min(W, x1)), y1: Math.round(y1), ...(pass ? { pass: true } : {}) });

// ---------- helpers ----------
function bigText(g, lines, y, o = {}) {
  const px = o.px || 100, lh = o.lh || px * 1.1, a = o.a ?? 1; let yy = y;
  lines.forEach((l, i) => { const ai = o.stagger ? clamp(a * lines.length - i) : a; if (ai > 0) { const s = back(ai, 1.8); g.save(); g.translate(W / 2, yy); g.scale(s, s); text(g, l, 0, 0, { font: o.font || SLAB(px), fill: o.fill || C.white, plate: o.plate === undefined ? C.ink : o.plate, align: 'center', maxW: W - 110, alpha: clamp(ai * 3), seed: 40 + i }); g.restore(); } yy += lh; });
  return yy;
}
function card(g, x, y, w, h, fill, o = {}) { shape(g, rrect(x, y, w, h, o.r ?? 28), { fill, line: o.line ?? 4, grain: .15, seed: o.seed || 5, breaks: .1, lineColor: o.lineColor || C.ink }); }
function ground(g, horizon = 1460) {
  plane(g, rect(0, BAND, W, H - BAND), C.bg); plane(g, rect(0, horizon, W, H - horizon), C.floor);
  ink(g, [[0, horizon], [W * .42, horizon], [W * .47, horizon], [W, horizon]], 3, { breaks: .35, seed: 7, color: '#4A4F55' });
}
function head(g, x, y, s, o = {}) { // elderly man, profile facing right
  const skin = o.pale ? lerp01(C.skin, C.skinPale, o.pale) : C.skin;
  g.save(); g.translate(x + (o.jolt || 0) * 8 * s, y); g.scale(s, s); g.rotate((o.tilt || 0) * .1);
  const hd = spline([[-60, -40], [-50, -95], [0, -118], [48, -96], [66, -50], [84, -30], [70, -18], [64, 10], [50, 44], [10, 62], [-40, 50], [-66, 10]], true, 10);
  shape(g, hd, { fill: skin, line: 4, seed: 92, breaks: .15, shade: [{ pts: ellipse(-20, 20, 50, 40, 20), color: C.skinD, alpha: .3 }] });
  shape(g, spline([[-64, -30], [-60, -70], [-40, -84], [-30, -60], [-44, -20]], true, 8), { fill: C.hair, line: 3, seed: 93 });         // grey hair at the back
  ink(g, [[20, -64], [42, -60]], 3.5, { seed: 94 });                                                                                     // eyebrow
  if (o.eyesClosed) ink(g, [[24, -46], [34, -42], [44, -46]], 4, { seed: 95 }); else shape(g, ellipse(34, -46, 5, 6, 12), { fill: C.ink, line: 0, seed: 95 });
  if (o.mouth === 'open') shape(g, ellipse(58, 26, 10, 8, 14), { fill: '#7A3B33', line: 3, seed: 98 }); else ink(g, [[44, 28], [52, 24], [60, 28]], 3.5, { seed: 98 });
  shape(g, [[-22, 50], [26, 54], [24, 110], [-30, 110]], { fill: skin, line: 3.5, seed: 99 });
  if (o.sweat) for (let i = 0; i < 4; i++) { const u = ((twos(o.t || 0) * .5 + i / 4) % 1); const dx = [-30, 10, 44, -6][i], dy = [-90, -100, -70, -40][i] + u * 60; drop(g, dx, dy, 9 + i % 2 * 3, C.drop, o.sweat * (1 - u * .7)); }
  g.restore();
}
function lerp01(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); }
function drop(g, x, y, r, fill, a = 1) { if (a <= 0) return; shape(g, [...spline([[x, y - r * 1.7], [x + r * .9, y - r * .2], [x + r, y + r * .4], [x, y + r * 1.1], [x - r, y + r * .4], [x - r * .9, y - r * .2]], true, 6)], { fill, line: 2.5, seed: 11 + (x | 0), alpha: a, grain: 0 }); }
function man(g, x, y, t, o = {}) { // seated elderly man facing right
  shape(g, rrect(x - 230, y - 300, 70, 330, 26), { fill: C.chair, line: 4, seed: 101 }); shape(g, rrect(x - 240, y - 20, 300, 60, 22), { fill: C.chair, line: 4, seed: 102 });
  ink(g, [[x - 200, y + 40], [x - 210, y + 210]], 9, { seed: 103, color: C.chairD }); ink(g, [[x + 30, y + 40], [x + 44, y + 210]], 9, { seed: 104, color: C.chairD });
  shape(g, [[x - 160, y - 40], [x + 60, y - 50], [x + 70, y + 10], [x - 150, y + 20]], { fill: '#5A5E66', line: 4, seed: 105 });
  shape(g, [[x + 30, y - 30], [x + 80, y - 20], [x + 66, y + 190], [x + 26, y + 190]], { fill: '#5A5E66', line: 4, seed: 106 });
  shape(g, rrect(x + 16, y + 180, 96, 34, 16), { fill: C.ink, line: 0, seed: 107 });
  const sway = Math.sin(twos(t) * 3) * (o.sway || 0);
  g.save(); g.translate(sway * 10, 0); g.rotate(sway * .02);
  shape(g, [[x - 175, y - 30], [x - 150, y - 300], [x - 40, y - 320], [x + 10, y - 290], [x + 30, y - 40]], { fill: C.shirt, line: 4, seed: 108, shade: [{ pts: [[x - 175, y - 30], [x - 150, y - 300], [x - 110, y - 310], [x - 120, y - 30]], color: C.shirtD, alpha: .6 }] });
  head(g, x - 60, y - 400, 1.15, { t, sweat: o.sweat, pale: o.pale, tilt: sway * 2, mouth: o.mouth, eyesClosed: o.eyesClosed });
  // arm resting on the knee, hand trembling
  const tr = (o.tremor || 0) * Math.sin(twos(t) * 60) * 4;
  ink(g, [[x - 60, y - 280], [x - 10, y - 150], [x + 70 + tr, y - 70]], 30, { color: C.shirtD, taper: false, wob: .1, seed: 120 }); ink(g, [[x - 60, y - 280], [x - 10, y - 150], [x + 70 + tr, y - 70]], 22, { color: C.shirt, taper: false, wob: .1, seed: 121 });
  shape(g, ellipse(x + 76 + tr, y - 66, 22, 20, 16), { fill: o.pale ? lerp01(C.skin, C.skinPale, o.pale) : C.skin, line: 3.5, seed: 122 });
  if (o.tremor) for (const k of [-1, 1]) ink(g, [[x + 76 + k * 40, y - 90], [x + 76 + k * 50, y - 66], [x + 76 + k * 40, y - 42]], 3.5, { seed: 123 + k, color: C.white, alpha: o.tremor });
  if (o.confused) confusion(g, x - 40, y - 590, t, o.confused);
  g.restore();
}
function confusion(g, x, y, t, a) { // a spiral and question marks orbiting
  if (a <= 0) return; const pts = []; for (let i = 0; i < 60; i++) { const r = 4 + i * .9, an = i * .35 + twos(t) * 3; pts.push([x + Math.cos(an) * r, y + Math.sin(an) * r * .6]); }
  ink(g, pts, 4, { color: C.amber, alpha: a, upto: a, seed: 140 });
  for (let i = 0; i < 2; i++) { const an = twos(t) * 2 + i * Math.PI; text(g, '?', x + Math.cos(an) * 90, y + Math.sin(an) * 34 + 20, { font: SLAB(64), fill: C.white, plate: C.ink, align: 'center', alpha: a, seed: 141 + i }); }
}
function check(g, x, y, s, a) { card(g, x - 46 * s, y - 46 * s, 92 * s, 92 * s, C.bgL, { r: 18 * s, line: 3.5, seed: 180, lineColor: C.soft }); if (a > 0) ink(g, [[x - 26 * s, y], [x - 6 * s, y + 22 * s], [x + 34 * s, y - 30 * s]], 16 * s, { color: C.teal, upto: eo(a), taper: false, seed: 181 }); }
function bigX(g, cx, cy, r, a) { if (a <= 0) return; const k = back(a, 2.5), w = r * .3; g.save(); g.translate(cx, cy); g.scale(k, k); g.rotate(-.06); for (const an of [Math.PI / 4, -Math.PI / 4]) shape(g, xform(rect(-r, -w / 2, 2 * r, w), 0, 0, an), { fill: C.red, line: 5, seed: 160 + an, grain: .2, shade: [{ pts: xform(rect(-r, 0, 2 * r, w / 2), 0, 0, an), color: C.redD, alpha: .4 }] }); g.restore(); }
function medallion(g, cx, cy, r, n, a) { if (a <= 0) return; const k = back(a, 2.4); g.save(); g.translate(cx, cy); g.scale(k, k); star(g, 0, 0, r * 1.35, { fill: C.tealD, n: 14, inner: .78, line: 0, seed: 170 }); shape(g, ellipse(0, 0, r, r, 32), { fill: C.teal, line: 0, seed: 171 }); text(g, String(n), 0, r * .36, { font: SLAB(Math.round(r * 1.05)), fill: C.ink, align: 'center' }); g.restore(); }
function glassIcon(g, x, y, s) { const w0 = 50 * s, w1 = 66 * s, h = 140 * s; shape(g, [[x - w0, y], [x + w0, y], [x + w1, y - h], [x - w1, y - h]], { fill: '#9CC3DE', line: 4, seed: 190 }); }
function plateIcon(g, x, y, s) { shape(g, ellipse(x, y, 110 * s, 34 * s, 30), { fill: C.white, line: 4, seed: 191 }); shape(g, ellipse(x, y - 4 * s, 70 * s, 20 * s, 24), { fill: C.amber, line: 3, seed: 192 }); ink(g, [[x - 150 * s, y + 10 * s], [x - 150 * s, y - 90 * s]], 8 * s, { color: C.soft, seed: 193 }); ink(g, [[x + 150 * s, y + 10 * s], [x + 150 * s, y - 90 * s]], 8 * s, { color: C.soft, seed: 194 }); }

// ---------- scenes ----------
const S = id => SEC[id];
function hook(g, t) {
  ground(g, 1420);
  const p = ss(seg(t, 0, 2.5));
  g.save(); g.translate(560, 1400); g.scale(.9, .9); man(g, 0, 0, t, { sweat: seg(t, .2, .8), pale: .4 + p * .5, confused: seg(t, .8, 1.4), sway: 1 }); g.restore();
  const a1 = seg(t, .15, .5), a2 = seg(t, 1.2, 1.5);
  bigText(g, ['Sudato, pallido,', 'confuso.'], 520, { px: 92, a: a1, stagger: true });
  bigText(g, ['Potrebbe essere', 'la glicemia.'], 1660, { px: 84, a: a2, fill: C.teal });
  if (a1 > .5) note('h1', 'Sudato, pallido, confuso.', 60, 430, 1020, 640);
  if (a2 > .5) note('h2', 'Potrebbe essere la glicemia.', 60, 1580, 1020, 1780);
}
function day(g, t) {
  ground(g, 1500);
  const [t0] = S('day'), u = seg(t, t0 + .2, t0 + 1.2);
  // the stylised blue circle: a thick ring that draws on
  const pts = ellipse(W / 2, 960, 250, 250, 80, -Math.PI / 2, -Math.PI / 2 + TAU * eo(u));
  ink(g, pts, 64, { color: C.blue, taper: false, wob: .08, seed: 200 });
  const b = seg(t, VO.L02 + .4, VO.L02 + .8);
  text(g, '14', W / 2, 1010, { font: SLAB(170), fill: C.white, plate: C.ink, align: 'center', alpha: b });
  text(g, 'NOVEMBRE', W / 2, 1070, { font: SANS(700, 48), fill: C.white, align: 'center', track: 6, alpha: b });
  const c = seg(t, VO.L02 + .8, VO.L02 + 1.1);
  bigText(g, ['Giornata mondiale', 'del diabete'], 1330, { px: 70, a: c, fill: C.white });
  if (b > .5) note('d1', '14 NOVEMBRE', 330, 860, 750, 1080);
  if (c > .5) note('d2', 'Giornata mondiale del diabete', 80, 1260, 1000, 1420);
}
function what(g, t) {
  ground(g, 1500);
  const a = seg(t, VO.L03, VO.L03 + .4);
  bigText(g, ['IPOGLICEMIA'], 560, { px: 120, a, fill: C.white });
  text(g, 'abbassamento della glicemia', W / 2, 650, { font: SANS(600, 50), fill: C.soft, align: 'center', alpha: seg(t, VO.L03 + .8, VO.L03 + 1.2) });
  if (a > .5) note('w1', 'IPOGLICEMIA abbassamento della glicemia', 80, 460, 1000, 670);
  const b = seg(t, VO.L04 + 2.2, VO.L04 + 2.6);
  if (b > 0) {
    // a gauge: the level falls below the 70 line
    const gx = 230, gy0 = 820, gy1 = 1360; card(g, gx - 60, gy0, 120, gy1 - gy0, C.bgL, { r: 60, lineColor: C.soft, seed: 210 });
    const lv = lerp(.85, .32, eo(seg(t, VO.L04 + 2.2, VO.L04 + 3.4))), ly = lerp(gy1 - 30, gy0 + 30, lv);
    shape(g, rrect(gx - 40, ly, 80, gy1 - 20 - ly, 40), { fill: lv < .45 ? C.teal : C.soft, line: 0, seed: 211 });
    const l70 = lerp(gy1 - 30, gy0 + 30, .45); ink(g, [[gx - 90, l70], [gx + 90, l70]], 5, { color: C.amber, seed: 212 }); text(g, '70', gx + 110, l70 + 14, { font: SANS(700, 40), fill: C.amber });
    g.save(); g.translate(660, 1150); g.scale(back(b, 2), back(b, 2));
    text(g, '< 70', 0, 0, { font: SLAB(210), fill: C.teal, plate: C.ink, align: 'center' });
    text(g, 'mg/dl', 0, 90, { font: SANS(700, 60), fill: C.white, align: 'center' });
    g.restore(); if (b > .5) note('w2', '< 70 mg/dl', 420, 960, 900, 1260);
  }
}
const SIGNS = ['SUDORAZIONE', 'TREMORI', 'PALLORE', 'FAME IMPROVVISA', 'CONFUSIONE'];
function sigTitle(g, t) {
  ground(g, 1500); const [t0] = S('sigT'), a = seg(t, t0, t0 + .3);
  bigText(g, ['I SEGNALI'], 820, { px: 130, a });
  [0, 1, 2, 3, 4].forEach(k => medallion(g, 220 + k * 160, 1080, 52, k + 1, seg(t, t0 + .5 + k * .15, t0 + .8 + k * .15)));
  if (a > .5) note('st', 'I SEGNALI', 120, 700, 960, 860);
}
function sign(g, t, i) {
  ground(g, 1460); const [t0] = S('s' + i), lt = t - t0;
  medallion(g, W / 2, 540, 76, i + 1, seg(lt, 0, .25));
  if (i === 0) [0, 1, 2, 3, 4].forEach(k => medallion(g, 220 + k * 160, 1540, 34, k + 1, seg(lt, .2 + k * .1, .4 + k * .1)));
  const f = fit(g, SIGNS[i], SLAB('{px}'), 100, W - 140, 2, 64);
  f.lines.forEach((l, k) => text(g, l, W / 2, 760 + k * f.px * 1.05, { font: f.font, fill: C.white, plate: C.ink, align: 'center', alpha: clamp(lt * 6 - .2) }));
  if (lt > .1) note('s' + i, SIGNS[i], 70, 680, 1010, 760 + f.lines.length * f.px * 1.05);
  const hx = 470, hy = 1210;
  if (i === 0) head(g, hx, hy, 2.0, { t, sweat: seg(lt, .2, .6) });
  if (i === 1) { head(g, hx, hy - 60, 1.4, {}); const tr = Math.sin(twos(t) * 60) * 7; shape(g, rrect(hx - 40 + tr, hy + 120, 180, 110, 50), { fill: C.skin, line: 4, seed: 230 }); for (let k = 0; k < 4; k++) shape(g, rrect(hx + 120 + tr, hy + 124 + k * 26, 70, 22, 11), { fill: C.skin, line: 3, seed: 231 + k }); for (const s of [-1, 1]) ink(g, [[hx + 60 + s * 150, hy + 130], [hx + 60 + s * 170, hy + 175], [hx + 60 + s * 150, hy + 220]], 5, { color: C.white, seed: 235 + s }); }
  if (i === 2) { head(g, hx - 140, hy, 1.6, {}); head(g, hx + 200, hy, 1.6, { pale: ss(seg(lt, .3, 1.0)) }); arrow(g, [hx - 20, hy + 220], [hx + 120, hy + 220], { u: seg(lt, .2, .6), bend: -.2, w: 6, head: 26, fill: C.teal, color: C.soft }); }
  if (i === 3) { plateIcon(g, W / 2, 1300, 1.3); for (let k = 0; k < 3; k++) { const a = seg(lt, .3 + k * .2, .6 + k * .2); ink(g, ellipse(W / 2 + 190 + k * 40, 1110 - k * 50, 16 + k * 8, 10 + k * 5, 16), 4, { closed: true, color: C.white, alpha: a, seed: 240 + k }); } text(g, '!', W / 2 + 300, 980, { font: SLAB(110), fill: C.amber, plate: C.ink, align: 'center', alpha: seg(lt, .8, 1) }); }
  if (i === 4) { head(g, hx, hy, 2.0, {}); confusion(g, hx - 20, hy - 300, t, seg(lt, .2, .6)); }
}
function warn(g, t) {
  ground(g, 1500); const [t0] = S('warn');
  const a = seg(t, t0 + .1, t0 + .4);
  g.save(); g.translate(W / 2, 600); g.scale(back(a, 2), back(a, 2));
  shape(g, [[0, -110], [125, 100], [-125, 100]], { fill: C.amber, line: 5, seed: 250 }); text(g, '!', 0, 80, { font: SLAB(150), fill: C.ink, align: 'center' });
  g.restore();
  bigText(g, ['ATTENZIONE'], 820, { px: 96, a, fill: C.amber });
  if (a > .5) note('wa', 'ATTENZIONE', 160, 720, 920, 840);
  const b = seg(t, VO.L12 + .2, VO.L12 + .6);
  g.save(); g.translate(380, 1430); g.scale(.75, .75); man(g, 0, 0, t, { confused: b, pale: .2 }); g.restore();
  for (const [k, s] of [[0, 'demenza?'], [1, 'stanchezza?']]) { const c = seg(t, VO.L12 + 1.1 + k * .3, VO.L12 + 1.4 + k * .3); if (c <= 0) continue; const y = 1000 + k * 140; card(g, 620, y, 380, 96, C.bgL, { r: 48, lineColor: C.amber, seed: 260 + k }); text(g, s, 810, y + 64, { font: SANS(600, 44), fill: C.white, align: 'center', alpha: c }); }
  if (seg(t, VO.L12 + 1.4, VO.L12 + 1.7) > .5) note('wb', 'demenza? stanchezza?', 620, 1000, 1000, 1236);
}
const CHECKS = [['Non lascia sola', 'la persona'], ["Avvisa subito", "l'infermiere"], ["Riferisce orario, segnali", 'e se ha mangiato']];
function oss(g, t) {
  ground(g, 1520); const [t0] = S('oss');
  const a = seg(t, VO.L13, VO.L13 + .4);
  bigText(g, ["COSA FA L'OSS"], 540, { px: 96, a });
  if (a > .5) note('oh', "COSA FA L'OSS", 120, 450, 960, 560);
  const T = [VO.L14, VO.L15, VO.L16];
  CHECKS.forEach(([l1, l2], i) => {
    const y = 730 + i * 200, ap = seg(t, T[i] - .3, T[i]), ck = seg(t, T[i], T[i] + .3); if (ap <= 0) return;
    g.save(); g.globalAlpha = clamp(ap * 2); g.translate((1 - eo(ap)) * 60, 0);
    card(g, 60, y - 82, 960, 164, C.bgL, { r: 30, lineColor: '#4A4F55', seed: 300 + i }); check(g, 160, y, 1, ck);
    text(g, l1, 250, y - 8, { font: SANS(600, 50), fill: C.white }); text(g, l2, 250, y + 48, { font: SANS(500, 42), fill: C.teal });
    g.restore(); if (ap > .9) note('c' + i, l1 + ' ' + l2, 60, y - 82, 1020, y + 82);
  });
  // who decides what to give: an amber note
  const b = seg(t, VO.L17 - .25, VO.L17);
  if (b > 0) { const y = 1350; g.save(); g.globalAlpha = clamp(b * 2); card(g, 60, y - 70, 960, 140, C.bgL, { r: 30, lineColor: C.amber, seed: 320 }); shape(g, ellipse(140, y, 40, 40, 20), { fill: C.amber, line: 0, seed: 321 }); text(g, '!', 140, y + 22, { font: SLAB(60), fill: C.ink, align: 'center' });
    text(g, 'Cosa dare: lo stabiliscono', 210, y - 6, { font: SANS(600, 44), fill: C.white }); text(g, "l'infermiere e il protocollo", 210, y + 44, { font: SANS(600, 44), fill: C.amber }); g.restore();
    if (b > .9) note('dec', "Cosa dare: lo stabiliscono l'infermiere e il protocollo", 60, y - 70, 1020, y + 70); }
}
function not(g, t) {
  ground(g, 1500); const [t0] = S('not');
  bigText(g, ['COSA NON FA'], 540, { px: 100, a: seg(t, t0 + .1, t0 + .4), fill: C.red });
  glassIcon(g, 380, 1130, 1.4); plateIcon(g, 700, 1110, .9);
  bigX(g, 540, 1020, 260, seg(t, VO.L18 + .9, VO.L18 + 1.2));
  const b = seg(t, VO.L18 + 1.0, VO.L18 + 1.4);
  if (b > 0) { text(g, 'mai a chi non è cosciente', W / 2, 1300, { font: SANS(700, 52), fill: C.white, align: 'center', alpha: b }); text(g, 'rischio di soffocamento', W / 2, 1380, { font: SANS(600, 46), fill: C.red, align: 'center', alpha: seg(t, VO.L18 + 1.9, VO.L18 + 2.2) }); }
  if (seg(t, t0 + .1, t0 + .4) > .5) note('n0', 'COSA NON FA', 160, 450, 920, 560);
  if (b > .5) note('n1', 'mai a chi non è cosciente', 80, 1250, 1000, 1310);
  if (seg(t, VO.L18 + 1.9, VO.L18 + 2.2) > .5) note('n2', 'rischio di soffocamento', 120, 1335, 960, 1395);
}
function key(g, t) {
  ground(g, 1520); const [t0] = S('key'); if (t < VO.L19) return;
  const lt = t - VO.L19;
  const y1 = bigText(g, ['Prima di pensare', 'alla stanchezza,'], 640, { px: 92, a: seg(lt, 0, .35), stagger: true });
  // a light ink strike through "stanchezza"
  const st = seg(lt, 1.3, 1.7); if (st > 0) ink(g, [[200, 735], [880, 725]], 9, { color: C.amber, upto: eo(st), seed: 400 });
  bigText(g, ['pensa alla', 'GLICEMIA.'], y1 + 60, { px: 110, a: seg(lt, 1.5, 2.0), fill: C.teal, stagger: true });
  star(g, W / 2, y1 + 200, 380, { fill: '#FFFFFF', n: 18, inner: .82, alpha: .06 * seg(lt, 1.5, 2.0), rot: twos(t) * .05 });
  if (lt > .4) note('k1', 'Prima di pensare alla stanchezza,', 60, 540, 1020, 760);
  if (lt > 2.0) note('k2', 'pensa alla GLICEMIA.', 60, y1 - 40, 1020, y1 + 230);
}
function cta(g, t) {
  ground(g, 1520); const [t0] = S('cta'), lt = t - t0;
  bigText(g, ['Lo sapevi che', 'la soglia è 70?'], 600, { px: 90, a: seg(lt, .1, .4) });
  if (lt > .4) note('q', 'Lo sapevi che la soglia è 70?', 60, 510, 1020, 720);
  const b = seg(t, VO.L20 + 1.6, VO.L20 + 1.9);
  if (b > 0) {
    g.save(); g.translate(W / 2, 1060); g.scale(back(b, 2), back(b, 2));
    shape(g, [[-250, 100], [-300, 200], [-170, 100]], { fill: C.bgL, line: 4.5, seed: 409, lineColor: C.teal }); shape(g, rrect(-400, -120, 800, 240, 60), { fill: C.bgL, line: 4.5, seed: 410, lineColor: C.teal });
    text(g, 'Scrivi nei commenti:', 0, -36, { font: SANS(600, 44), fill: C.white, align: 'center' });
    const n = Math.floor(clamp((t - VO.L20 - 1.9) / .3) * 2 + 1e-6);
    text(g, '70'.slice(0, n), 0, 84, { font: SLAB(120), fill: C.teal, plate: C.ink, align: 'center' });
    g.restore(); if (b > .9) note('c70', 'Scrivi nei commenti: 70', 140, 940, 940, 1180);
  }
  for (let i = 0; i < 6; i++) sparkle(g, 140 + i * 160, 1340 + Math.sin(i * 2.1) * 40, 22 * seg(lt, .4 + i * .1, .7 + i * .1), { fill: C.teal, rot: twos(t) * .2 });
}

// ---------- logo band, wipes, captions ----------
function logoBand(g) {
  plane(g, rect(0, 0, W, BAND), '#26292C');
  const lw = Math.round(W * .83), lh = Math.round(lw * IMG.logo.height / IMG.logo.width);
  g.drawImage(IMG.logo, (W - lw) / 2, (BAND - lh) / 2, lw, lh);
  ink(g, [[30, BAND - 2], [W * .5, BAND - 1], [W - 30, BAND - 2]], 3, { breaks: .25, seed: 3, color: '#4A4F55' });
}
function wipe(g, t, t0) { const u = seg(t, t0 - .25, t0), v = seg(t, t0, t0 + .25); if (u <= 0 || v >= 1) return; const top = u < 1 ? BAND + (H - BAND) * (1 - eo(u)) : BAND, bot = u < 1 ? H : BAND + (H - BAND) * (1 - eo(v)); plane(g, rect(0, top, W, bot - top), C.bgL); ink(g, [[0, top], [W, top]], 4, { color: C.teal, seed: 8, alpha: .8 }); }
let CUES = null;
function caption(g, t) {
  CUES = CUES || subtitleCues(); const S0 = CUES.find(s => t >= s.t0 && t < s.t1); if (!S0 || !CAP.has(S0.id)) return;
  const f = fit(g, S0.text, SANS(500, '{px}'), 42, W - 200, 3, 34), lh = f.px * 1.25, h = f.lines.length * lh + 40, w = Math.max(...f.lines.map(l => measure(g, l, f.font))) + 120, x = (W - w) / 2, y = H - 150 - h;
  const a = seg(t, S0.t0, S0.t0 + .15) * (1 - seg(t, S0.t1 - .15, S0.t1));
  g.save(); g.globalAlpha = a; g.translate(0, (1 - eo(seg(t, S0.t0, S0.t0 + .2))) * 14);
  shape(g, rrect(x, y, w, h, 26), { fill: C.bgL, line: 3, seed: 500, grain: .1, breaks: .1, lineColor: C.teal });
  sparkle(g, x + 30, y + h / 2, 14, { fill: C.teal, rot: twos(t) }); sparkle(g, x + w - 30, y + h / 2, 14, { fill: C.teal, rot: -twos(t) });
  f.lines.forEach((l, i) => text(g, l, W / 2, y + 22 + lh * (i + .78), { font: f.font, align: 'center', fill: C.white }));
  g.restore();
}
export function render(g, t) {
  TXT = []; setClock(t); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  if (t >= END) { g.drawImage(IMG.fin, 0, 0, W, H); note('end', 'UNA DOMANDA AL GIORNO', 90, 880, 990, 1040, true); return; }
  const sec = PLAN.find(s => t < SEC[s.id][1])?.id || 'cta';
  if (sec === 'hook') hook(g, t); else if (sec === 'day') day(g, t); else if (sec === 'what') what(g, t); else if (sec === 'sigT') sigTitle(g, t);
  else if (sec[0] === 's' && sec.length === 2) sign(g, t, +sec[1]); else if (sec === 'warn') warn(g, t); else if (sec === 'oss') oss(g, t); else if (sec === 'not') not(g, t); else if (sec === 'key') key(g, t); else cta(g, t);
  PLAN.slice(1).forEach(s => wipe(g, t, SEC[s.id][0]));
  paperFinish(g, W, H, .35);
  logoBand(g); caption(g, t);
  const fo = seg(t, END - .4, END); if (fo > 0) { g.globalAlpha = fo; g.drawImage(IMG.fin, 0, 0, W, H); g.globalAlpha = 1; }
}
export function texts(g, t) { render(g, t); return TXT; }
export function events() {
  const E = [], ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  PLAN.slice(1).forEach(s => ev(SEC[s.id][0] - .25, 'wipe'));
  ev(.15, 'pop'); ev(1.2, 'pop'); for (let k = 0; k < 6; k++) ev(.3 + k * .55, 'drip'); ev(.9, 'wobble', { d: 2.5 });
  ev(SEC.day[0] + .2, 'ring', { d: 1.0 }); ev(VO.L02 + .4, 'stamp');
  ev(VO.L03, 'pop'); ev(VO.L04 + 2.2, 'fall', { d: 1.2 }); ev(VO.L04 + 2.3, 'stamp', { big: 1 });
  [0, 1, 2, 3, 4].forEach(i => { const t0 = SEC['s' + i][0]; ev(t0, 'medal'); ev(t0, 'chord', { i }); });
  ev(SEC.s0[0] + .2, 'drip'); ev(SEC.s0[0] + .7, 'drip'); ev(SEC.s1[0] + .1, 'tremble', { d: 2.2 }); ev(SEC.s2[0] + .3, 'whoosh'); ev(SEC.s3[0] + .3, 'rumble'); ev(SEC.s4[0] + .2, 'wobble', { d: 2.0 });
  ev(SEC.warn[0] + .1, 'alert'); ev(VO.L12 + 1.1, 'pop'); ev(VO.L12 + 1.4, 'pop');
  [VO.L14, VO.L15, VO.L16].forEach((c, i) => { ev(c, 'tick'); ev(c, 'chord', { i: i + 5 }); }); ev(VO.L17 - .25, 'alert');
  ev(VO.L18 + .9, 'stamp', { big: 1 });
  ev(VO.L19 + 1.3, 'scratch'); ev(VO.L19 + 1.5, 'chord', { i: 8 });
  ev(VO.L20 + 1.6, 'pop'); ev(VO.L20 + 1.95, 'type'); ev(VO.L20 + 2.1, 'type');
  ev(END - .4, 'endcard');
  Object.entries(VO).forEach(([id, t]) => ev(t, 'vo', { id }));
  E.push({ t: 0, type: 'meta', secs: SEC, end: END });
  return E.sort((a, b) => a.t - b.t);
}
