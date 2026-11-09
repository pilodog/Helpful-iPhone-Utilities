// Disfagia: l'acqua che può fare male — vertical 1080×1920, Mid-century Cartoon.
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, starPts, sparkle, rays, arrow, dashed, paperFinish, spline, ellipse, rect, rrect, move, xform, clamp, lerp, seg, ss, eo, eio, back, twos, hash, REG, TAU } from './engine/toon.js';

export const W = 1080, H = 1920;
// ---------- timeline (120 bpm, beat 0.5 s) ----------
export const VO = { L01: 0.4, L02: 5.2, L03: 8.0, L04: 10.8, L05: 13.3, L06: 15.7, L07: 18.9, L08: 22.9, L09: 27.7, L10: 29.7, L11: 32.6, L12: 35.5, L13: 38.6, L14: 41.9, L15: 43.5, L16: 45.0, L17: 47.5, L18: 49.1, L19: 52.6, L20: 57.2, L21: 61.3, L22: 67.0 };
export const TL = { HOOK: 0, CRACK: .25, HOOK2: 1.5, SCENE: 4.6, SIP1: 5.0, COUGH1: 5.8, SIP2: 6.8, COUGH2: 7.6, GURGLE: 8.2, OFFER: 11.2, SIL1: 12.7, X: 13.2,
  WHAT: 15.3, THIN: 18.9, DIAG: 22.7, DROP: 23.9, SIG: 27.3, S: [29.7, 32.6, 35.5, 38.6], OSS: 41.6, C: [43.5, 45.0, 47.5, 49.1], WHO: 52.2, PAI: 57.2,
  KEY: 60.8, KEYTXT: 61.3, CTA: 66.6, CTA2: 68.4, END: 72.0, DUR: 75.0 };
export const DUR = TL.DUR;
// captions burned in only where the same words are not already big on screen (all lines go in the .srt)
const CAP = new Set(['L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L14', 'L19', 'L20']);
export const SUBTEXT = {
  L01: 'Tossisce mentre beve? Non dargli altra acqua.', L02: 'Un sorso, un colpo di tosse.', L03: 'Poi la voce diventa gorgogliante.', L04: "L'istinto? Un altro bicchiere.",
  L05: 'È un errore.', L06: 'La disfagia è la difficoltà a deglutire.', L07: "E i liquidi, come l'acqua, sono spesso i più difficili.",
  L08: "Il rischio è che il liquido vada nelle vie aeree, invece che nell'esofago.", L09: 'I segnali da osservare.', L10: 'Tosse.', L11: 'Voce gorgogliante.',
  L12: 'Cibo trattenuto in bocca.', L13: 'Deglutizioni ripetute.', L14: "Cosa fa l'OSS?", L15: 'Interrompe.', L16: 'La tiene seduta, con il busto eretto.', L17: 'Non la lascia sola.',
  L18: "Avvisa subito l'infermiere.", L19: "Consistenze, addensanti e posture li decidono l'équipe e il logopedista.", L20: 'E sono scritti nel PAI.',
  L21: "Non serve altra acqua: serve fermarsi e chiamare l'infermiere.", L22: 'Ti è mai capitato in turno? Scrivi ACQUA nei commenti.',
};
let SUBS = [];
export function init(dur) {
  const ids = Object.keys(VO);
  SUBS = ids.map((id, i) => { const t0 = VO[id], d = dur[id] || 2, nx = i + 1 < ids.length ? VO[ids[i + 1]] : 1e9; return { id, t0, d, t1: Math.min(nx - .1, Math.max(t0 + 1.8, t0 + d + .6, t0 + SUBTEXT[id].length / 12 + 1)) }; });
}
export const subtitleCues = () => SUBS.map(s => ({ t0: s.t0, t1: s.t1, text: SUBTEXT[s.id] }));

// ---------- palette: one meaning per hue ----------
const C = { paper: PAL.paper, ink: PAL.ink, water: '#9CC3DE', waterD: '#6E9DC0', waterL: '#CFE2EF', red: '#D9483B', redD: '#A93228', teal: '#2FA39A', tealD: '#1F7A73', tealL: '#9ED6CF',
  amber: '#E3A031', amberD: '#B67A17', amberL: '#F3D08C', mustL: '#F1DDA4', mustD: '#D9B866', plum: PAL.plum, plumL: '#9B7397', skin: PAL.skin, skinD: PAL.skinD, grey: '#D9D3C7', greyD: '#B7AE9E', hair: '#E8E3DA', hairD: '#C9C1B4', oat: '#EADFCB', oatD: '#D8C9AE', blueG: '#DCE7EE', blueGD: '#BFD0DC' };
const SANS = (w, px) => `${w} ${px}px Jost`, SLAB = px => `${px}px Slab`, OLEO = px => `700 ${px}px Oleo`;
const BAND = 384;               // the logo band (top fifth)
let IMG = {};
export async function loadImages() {
  const ld = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  IMG.logo = await ld('logo.png'); IMG.fin = await ld('finale.png');
}
let TXT = [];
const note = (id, t, x0, y0, x1, y1, pass) => TXT.push({ id, text: t, x0: Math.round(Math.max(0, x0)), y0: Math.round(y0), x1: Math.round(Math.min(W, x1)), y1: Math.round(y1), ...(pass ? { pass: true } : {}) });

// ---------- small drawing helpers ----------
function bigText(g, lines, y, o = {}) { // slab lines centred, ink over an off-register colour plate; returns bottom y
  const px = o.px || 96, lh = o.lh || px * 1.08, a = o.a ?? 1; let yy = y;
  lines.forEach((l, i) => {
    const ai = o.stagger ? clamp(a * lines.length - i) : a; if (ai <= 0) { yy += lh; return; }
    const s = back(ai, 1.8), f = o.font ? o.font(px) : SLAB(px);
    g.save(); g.translate(W / 2, yy); g.scale(s, s); text(g, l, 0, 0, { font: f, fill: o.fill || C.ink, plate: o.plate || C.amberL, align: 'center', maxW: W - 120, alpha: clamp(ai * 3), seed: 40 + i }); g.restore();
    yy += lh;
  });
  return yy;
}
function card(g, x, y, w, h, fill, o = {}) { shape(g, rrect(x, y, w, h, o.r ?? 28), { fill, line: o.line ?? 4, grain: .25, seed: o.seed || 5, breaks: .12 }); }
function glove(g, x, y, ang, s, fill = '#FBF6EA', o = {}) { // four-finger cartoon glove, palm facing viewer, fingers along +x
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
  const palm = rrect(-40, -36, 70, 72, 26), fingers = [[-2, -34], [8, -12], [8, 10], [-2, 30]].map(([fx, fy], i) => rrect(fx + 22, fy - 9, 52 - Math.abs(i - 1.5) * 8, 19, 9.5)), thumb = xform(rrect(-10, -10, 46, 20, 10), -18, -40, -1.1);
  for (const p of [...fingers, thumb, palm]) shape(g, p, { fill, line: 0, grain: .1, seed: 61 });
  for (const p of [...fingers, thumb]) ink(g, p, 3, { closed: true, breaks: .15, seed: 62 }); ink(g, palm, 3.5, { closed: true, breaks: .2, seed: 63 });
  if (o.cuff) { shape(g, rrect(-62, -30, 26, 60, 8), { fill: o.cuff, line: 3, seed: 64 }); }
  g.restore();
}
function glass(g, x, y, s, o = {}) { // tumbler of water; y = base centre. o.level 0..1, o.tilt, o.crack 0..1
  const w0 = 70 * s, w1 = 92 * s, h = 190 * s, lv = o.level ?? .7;
  g.save(); g.translate(x, y); g.rotate(o.tilt || 0);
  const body = [[-w0, 0], [w0, 0], [w1, -h], [-w1, -h]];
  const wy = -h * lv, ww = lerp(w0, w1, lv);
  shape(g, [[-w0, 0], [w0, 0], [ww, wy], [-ww, wy]], { fill: C.water, line: 0, grain: .2, seed: 71, shade: [{ pts: [[w0 * .25, 0], [w0, 0], [ww, wy], [ww * .35, wy]], color: C.waterD, alpha: .45 }] });
  shape(g, ellipse(0, wy, ww, 9 * s, 24), { fill: C.waterL, line: 0, grain: 0, seed: 72 });
  ink(g, body, 4.5 * Math.min(1.4, s), { closed: true, breaks: .1, seed: 73 });
  ink(g, ellipse(0, -h, w1, 12 * s, 30), 3 * Math.min(1.4, s), { closed: true, breaks: .2, seed: 74 });
  ink(g, [[-w1 * .72, -h * .9], [-w0 * .8, -h * .15]], 5 * s, { color: '#FFFFFF', alpha: .7, seed: 75 });
  if (o.crack > 0) { // ink cracks that draw on from an impact point
    const P = [[[w1 * .2, -h * .62], [w1 * .05, -h * .5], [w1 * .3, -h * .38], [w1 * .12, -h * .2], [w0 * .4, -h * .02]], [[w1 * .05, -h * .5], [-w1 * .35, -h * .55], [-w1 * .6, -h * .42]], [[w1 * .3, -h * .38], [w1 * .7, -h * .45], [w1 * .86, -h * .6]], [[w1 * .2, -h * .62], [w1 * .1, -h * .82], [w1 * .25, -h * .98]]];
    P.forEach((p, i) => ink(g, p, (5.5 - i) * s * .7, { upto: clamp(o.crack * 1.6 - i * .2), seed: 80 + i, taper: true, wob: .6 }));
    if (o.crack < .6) star(g, w1 * .2, -h * .62, 70 * s * (1 - o.crack), { fill: '#FFFFFF', n: 10, inner: .3, alpha: .8 });
  }
  g.restore();
}
function head(g, x, y, s, o = {}) { // elderly woman's head in profile facing right (+x). o.mouth: 'closed'|'open'|'o', o.cheek 0..1, o.jolt
  g.save(); g.translate(x + (o.jolt || 0) * 10 * s, y); g.scale(s, s); g.rotate((o.jolt || 0) * .12);
  // hair (back) with a bun
  shape(g, ellipse(-46, -78, 34, 30, 24), { fill: C.hair, line: 3.5, seed: 91, shade: [{ pts: ellipse(-36, -70, 30, 20, 20), color: C.hairD, alpha: .6 }] });
  // the egg head with the nose in the outline
  const hd = spline([[-60, -40], [-50, -95], [0, -118], [48, -96], [66, -50], [86, -30], [70, -18], [64, 10], [50, 44], [10, 62], [-40, 50], [-66, 10]], true, 10);
  shape(g, hd, { fill: C.skin, line: 4, seed: 92, breaks: .15, shade: [{ pts: ellipse(-20, 20, 50, 40, 20), color: C.skinD, alpha: .35 }] });
  if (o.cheek > 0) shape(g, ellipse(28, 18, 30 * o.cheek + 6, 24 * o.cheek + 5, 24), { fill: C.skin, line: 3.5, seed: 93 });
  shape(g, spline([[-62, -46], [-40, -104], [10, -122], [52, -98], [36, -84], [-4, -92], [-34, -74], [-48, -38]], true, 8), { fill: C.hair, line: 3.5, seed: 94, shade: [{ pts: ellipse(10, -100, 40, 12, 16), color: '#FFFFFF', alpha: .3 }] });
  // eye (a dot with a lid), glasses
  const blink = o.squint ? 1 : 0;
  if (blink) ink(g, [[22, -46], [32, -42], [42, -46]], 4, { seed: 95 }); else shape(g, ellipse(32, -46, 5, 6, 12), { fill: C.ink, line: 0, grain: 0, seed: 95 });
  ink(g, ellipse(32, -46, 16, 13, 20), 2.6, { closed: true, seed: 96, breaks: .2 }); ink(g, [[16, -48], [-14, -54]], 2.4, { seed: 97 });
  // mouth
  if (o.mouth === 'open') shape(g, ellipse(58, 26, 12, 10, 16), { fill: '#7A3B33', line: 3, seed: 98 });
  else if (o.mouth === 'o') shape(g, ellipse(60, 24, 7, 8, 14), { fill: '#7A3B33', line: 3, seed: 98 });
  else ink(g, [[46, 26], [60, 24]], 3.5, { seed: 98 });
  // neck
  shape(g, [[-22, 50], [26, 54], [24, 110], [-30, 110]], { fill: C.skin, line: 3.5, seed: 99, shade: [{ pts: [[-30, 50], [0, 52], [-2, 110], [-30, 110]], color: C.skinD, alpha: .4 }] });
  g.restore();
}
function grandma(g, x, y, t, o = {}) { // seated, facing right; x,y = seat front. o.drink 0..1 (glass to mouth), o.jolt, o.mouth, o.noGlass
  const j = o.jolt || 0;
  // chair
  shape(g, rrect(x - 230, y - 300, 70, 330, 26), { fill: C.amber, line: 4, seed: 101, shade: [{ pts: rect(x - 200, y - 300, 40, 330), color: C.amberD, alpha: .35 }] });
  shape(g, rrect(x - 240, y - 20, 300, 60, 22), { fill: C.amber, line: 4, seed: 102 });
  ink(g, [[x - 200, y + 40], [x - 210, y + 210]], 9, { seed: 103 }); ink(g, [[x + 30, y + 40], [x + 44, y + 210]], 9, { seed: 104 });
  // legs + shoes
  shape(g, [[x - 160, y - 40], [x + 60, y - 50], [x + 70, y + 10], [x - 150, y + 20]], { fill: C.greyD, line: 4, seed: 105 });
  shape(g, [[x + 30, y - 30], [x + 80, y - 20], [x + 66, y + 190], [x + 26, y + 190]], { fill: C.greyD, line: 4, seed: 106 });
  shape(g, rrect(x + 16, y + 180, 96, 34, 16), { fill: C.ink, line: 0, seed: 107 });
  // torso (cardigan), held drawing
  g.save(); g.translate(j * 8, 0);
  const torso = [[x - 175, y - 30], [x - 150, y - 300], [x - 40, y - 320], [x + 10, y - 290], [x + 30, y - 40]];
  shape(g, torso, { fill: C.plum, line: 4, seed: 108, shade: [{ pts: [[x - 175, y - 30], [x - 150, y - 300], [x - 110, y - 310], [x - 120, y - 30]], color: '#4E3350', alpha: .5 }] });
  ink(g, [[x - 20, y - 300], [x - 10, y - 40]], 3, { seed: 109, breaks: .3 });
  for (let i = 0; i < 4; i++) shape(g, ellipse(x - 2, y - 250 + i * 55, 6, 6, 10), { fill: C.paper, line: 2, seed: 110 + i });
  head(g, x - 60, y - 400, 1.15, { jolt: j, mouth: o.mouth, cheek: o.cheek, squint: o.squint });
  g.restore();
  // the arm with the glass: shoulder → elbow → hand; drink lifts the hand to the mouth
  const d = o.drink || 0, sh = [x - 60 + j * 8, y - 280], el = [x + lerp(10, -10, d), y - lerp(140, 190, d)], hd = [x + lerp(110, 40, d) + j * 6, y - lerp(170, 360, d)];
  ink(g, [sh, el, hd], 30, { color: '#4E3350', taper: false, wob: .1, seed: 120 }); ink(g, [sh, el, hd], 22, { color: C.plum, taper: false, wob: .1, seed: 121 });
  if (!o.noGlass) glass(g, hd[0] + 26, hd[1] + 70, .55, { level: lerp(.7, .5, d), tilt: lerp(0, -.7, d) + j * .3 });
  shape(g, ellipse(hd[0], hd[1], 22, 20, 16), { fill: C.skin, line: 3.5, seed: 122 });
}
function coughBurst(g, x, y, s, a, seed = 0) { // little starburst + motion ticks from the mouth
  if (a <= 0) return; const k = back(a, 2);
  star(g, x + 30 * s, y, 46 * s * k, { fill: '#FFFFFF', n: 9, inner: .45, line: 3, seed: 130 + seed, alpha: 1 - seg(a, .7, 1) });
  for (let i = 0; i < 3; i++) { const an = -.5 + i * .5; ink(g, [[x + Math.cos(an) * 60 * s * k, y + Math.sin(an) * 60 * s * k], [x + Math.cos(an) * 100 * s * k, y + Math.sin(an) * 100 * s * k]], 5, { seed: 131 + i, alpha: 1 - seg(a, .6, 1) }); }
}
function bubbles(g, x, y, t, a, s = 1) { // the gurgle: bubbles + a wavy line
  if (a <= 0) return;
  for (let i = 0; i < 7; i++) { const u = ((twos(t) * .9 + i / 7) % 1), bx = x + Math.sin(i * 2.3 + u * 4) * 26 * s + u * 60 * s, by = y - u * 160 * s, r = (8 + hash(i) * 12) * s;
    shape(g, ellipse(bx, by, r, r, 14), { fill: C.waterL, line: 3, seed: 140 + i, alpha: a * (1 - u * .6) }); }
  const pts = []; for (let i = 0; i <= 30; i++) pts.push([x + 30 * s + i * 7 * s, y + 40 * s + Math.sin(i * .9 + twos(t) * 10) * 12 * s]);
  ink(g, pts, 4.5, { seed: 150, alpha: a, upto: a });
}
function bigX(g, cx, cy, r, a) { // the red X, stamped
  if (a <= 0) return; const k = back(a, 2.5), w = r * .3;
  g.save(); g.translate(cx, cy); g.scale(k, k); g.rotate(-.06);
  const bar = rect(-r, -w / 2, 2 * r, w);
  for (const an of [Math.PI / 4, -Math.PI / 4]) shape(g, xform(bar, 0, 0, an), { fill: C.red, line: 5, seed: 160 + an, grain: .3, shade: [{ pts: xform(rect(-r, 0, 2 * r, w / 2), 0, 0, an), color: C.redD, alpha: .4 }] });
  g.restore();
}
function medallion(g, cx, cy, r, n, a) {
  if (a <= 0) return; const k = back(a, 2.4);
  g.save(); g.translate(cx, cy); g.scale(k, k);
  star(g, 0, 0, r * 1.35, { fill: C.amberL, n: 14, inner: .78, line: 0, seed: 170 });
  shape(g, ellipse(0, 0, r, r, 32), { fill: C.ink, line: 0, seed: 171 });
  text(g, String(n), 0, r * .36, { font: SLAB(Math.round(r * 1.05)), fill: C.paper, align: 'center', seed: 172 });
  g.restore();
}
function check(g, x, y, s, a) { // turquoise tick in a box
  card(g, x - 46 * s, y - 46 * s, 92 * s, 92 * s, '#FFFFFF', { r: 18 * s, line: 3.5, seed: 180 });
  if (a <= 0) return;
  const P = [[x - 26 * s, y], [x - 6 * s, y + 22 * s], [x + 34 * s, y - 30 * s]];
  ink(g, P, 16 * s, { color: C.teal, upto: eo(a), taper: false, seed: 181 });
}

// ---------- scenes ----------
const G = (g, fill, floor, horizon = 1340) => { plane(g, rect(0, BAND, W, H - BAND), fill); plane(g, rect(0, horizon, W, H - horizon), floor); ink(g, [[0, horizon], [W * .4, horizon], [W * .46, horizon], [W, horizon]], 4, { breaks: .35, seed: 7 }); };

function hook(g, t) {
  G(g, C.blueG, C.blueGD, 1380);
  rays(g, W / 2, 900, 30, 900, '#FFFFFF', { alpha: .35, rot: twos(t) * .05 });
  const s = 1.9 + t * .04, cr = seg(t, TL.CRACK, TL.CRACK + .5);
  glass(g, W / 2, 1300, s, { level: .72, crack: cr });
  // drops leaking from the crack after it breaks
  for (let i = 0; i < 4; i++) { const u = ((t - TL.CRACK - .4 - i * .45) / 1.4); if (u > 0 && u < 1) shape(g, ellipse(W / 2 + 60 + i * 8, 1060 + u * 260, 10, 14, 12), { fill: C.water, line: 2.5, seed: 200 + i, alpha: 1 - u }); }
  const a1 = seg(t, .15, .5), a2 = seg(t, TL.HOOK2, TL.HOOK2 + .35);
  bigText(g, ['Tossisce', 'mentre beve?'], 540, { px: 104, a: a1, plate: C.waterL });
  bigText(g, ['Non dargli', 'altra acqua.'], 1530, { px: 98, a: a2, plate: '#F4B3A8', fill: C.redD });
  if (a1 > .5) note('h1', 'Tossisce mentre beve?', 80, 440, 1000, 680);
  if (a2 > .5) note('h2', 'Non dargli altra acqua.', 80, 1430, 1000, 1660);
}
function scene(g, t) {
  G(g, C.mustL, C.mustD, 1360);
  const lt = t - TL.SCENE;
  const drink = Math.max(ss(seg(t, TL.SIP1 - .4, TL.SIP1)) * (1 - ss(seg(t, TL.COUGH1, TL.COUGH1 + .3))), ss(seg(t, TL.SIP2 - .4, TL.SIP2)) * (1 - ss(seg(t, TL.COUGH2, TL.COUGH2 + .3))));
  const cough = [TL.COUGH1, TL.COUGH2, TL.COUGH2 + .7, TL.GURGLE + 1.5].reduce((m, c) => Math.max(m, Math.sin(clamp((t - c) / .35) * Math.PI)), 0);
  const jolt = twos(t) === twos(t) ? cough : 0;
  const offered = t > TL.OFFER - .3, mouth = cough > .2 ? 'open' : (t > TL.GURGLE && t < TL.OFFER) ? 'o' : 'closed';
  const gx = 520 - seg(t, TL.OFFER - .3, TL.OFFER + .3) * 60;
  grandma(g, gx, 1240, t, { drink, jolt, mouth, squint: cough > .3, noGlass: t > TL.OFFER + .5 });
  // cough bursts and gurgle
  for (const c of [TL.COUGH1, TL.COUGH2, TL.COUGH2 + .7]) coughBurst(g, gx + 40, 840, 1, seg(t, c, c + .6), c);
  bubbles(g, gx + 20, 890, t, seg(t, TL.GURGLE, TL.GURGLE + .4) * (1 - seg(t, TL.OFFER, TL.OFFER + .4)));
  if (t > TL.GURGLE + .3 && t < TL.OFFER) { const a = seg(t, TL.GURGLE + .3, TL.GURGLE + .7); card(g, 560, 560, 420, 96, '#FFFFFF', { r: 48, seed: 210 }); text(g, '“voce gorgogliante”', 770, 622, { font: SANS(600, 38), align: 'center', fill: C.ink, alpha: a }); }
  // the instinct: a hand offers another glass from the right
  if (offered) {
    const u = eo(seg(t, TL.OFFER - .3, TL.OFFER + .4)), hx = lerp(W + 260, 820, u);
    glass(g, hx, 1000, .75, { level: .9 });
    glove(g, hx + 90, 940, Math.PI, 1.3, '#FBF6EA', { cuff: C.teal });
    const ax = seg(t, TL.X, TL.X + .3); bigX(g, hx, 900, 230, ax);
    if (t > TL.OFFER + .2 && t < TL.X) text(g, '?', hx - 10, 720, { font: SLAB(120), fill: C.ink, plate: C.amberL, align: 'center', alpha: seg(t, TL.OFFER + .2, TL.OFFER + .5) });
    if (ax > 0) { text(g, 'ERRORE', W / 2, 560, { font: SLAB(120), fill: C.redD, plate: '#F4B3A8', align: 'center', alpha: clamp(ax * 3) }); if (ax > .5) note('err', 'ERRORE', 260, 440, 820, 580); }
  }
}
function profileHead(g, cx, cy, s, o = {}) { // simple side schematic: head facing left, mouth, throat with two tubes
  g.save(); g.translate(cx, cy); g.scale(s, s);
  const hd = spline([[60, -230], [-60, -250], [-150, -170], [-170, -80], [-200, -40], [-176, -20], [-182, 20], [-166, 40], [-150, 80], [-110, 110], [-60, 120], [-40, 330], [90, 330], [110, 130], [150, 40], [160, -110]], true, 10);
  shape(g, hd, { fill: C.skin, line: 4.5, seed: 220, shade: [{ pts: ellipse(80, -40, 100, 160, 20), color: C.skinD, alpha: .35 }] });
  shape(g, spline([[70, -236], [-50, -258], [-150, -180], [-120, -200], [-20, -200], [100, -150], [170, -110], [150, -190]], true, 8), { fill: C.hair, line: 4, seed: 221 });
  shape(g, ellipse(-100, -110, 9, 10, 12), { fill: C.ink, line: 0, seed: 222 });
  g.restore();
}
function what(g, t) {
  G(g, C.oat, C.oatD, 1500);
  const lt = t - TL.WHAT;
  if (t < TL.DIAG) {
    const a = seg(t, TL.WHAT + .3, TL.WHAT + .7);
    bigText(g, ['DISFAGIA'], 610, { px: 150, a, plate: C.amberL });
    const b = seg(t, VO.L06 + .9, VO.L06 + 1.3);
    if (b > 0) { text(g, 'difficoltà a deglutire', W / 2, 720, { font: SANS(600, 58), align: 'center', fill: C.ink, alpha: b }); if (b > .5) note('dg', 'difficoltà a deglutire', 200, 670, 880, 740); }
    if (a > .5) note('dis', 'DISFAGIA', 200, 480, 880, 630);
    const th = seg(t, TL.THIN, TL.THIN + .5);
    glass(g, W / 2, 1360, 1.5, { level: .75 });
    if (th > 0) {
      for (let i = 0; i < 5; i++) sparkle(g, W / 2 + Math.cos(i * 1.3) * 230, 1120 + Math.sin(i * 1.9) * 160, 34 * back(clamp(th * 2 - i * .2), 2), { fill: '#FFFFFF', rot: twos(t) });
      card(g, 250, 860, 580, 110, '#FFFFFF', { r: 55, seed: 230 }); text(g, "liquidi = più difficili", W / 2, 932, { font: SANS(600, 40), align: 'center', alpha: th });
      if (th > .5) note('thin', 'liquidi = più difficili', 250, 860, 830, 970);
    }
  } else {
    // the schematic: head in profile, two tubes; the drop takes the wrong way (red)
    const a = seg(t, TL.DIAG, TL.DIAG + .5);
    profileHead(g, 600, 900, 1.25);
    const tra = [[590, 1060], [584, 1200], [584, 1310]], eso = [[672, 1050], [676, 1200], [678, 1310]];
    ink(g, tra, 40, { color: '#E9A79E', taper: false, wob: .1, seed: 240 }); ink(g, eso, 40, { color: C.skinD, taper: false, wob: .1, seed: 241 });
    ink(g, tra.map(p => [p[0] - 21, p[1]]), 3.5, { seed: 242 }); ink(g, tra.map(p => [p[0] + 21, p[1]]), 3.5, { seed: 243 });
    ink(g, eso.map(p => [p[0] - 21, p[1]]), 3.5, { seed: 244 }); ink(g, eso.map(p => [p[0] + 21, p[1]]), 3.5, { seed: 245 });
    const route = spline([[392, 928], [470, 980], [574, 1050], [586, 1180], [585, 1290]], false, 10);
    const u = seg(t, TL.DROP, TL.DROP + 1.6);
    if (u > 0) { dashed(g, route, 8, 16, 12, 0, C.red, u); const s = route[Math.min(route.length - 1, Math.floor(u * (route.length - 1)))]; shape(g, ellipse(s[0], s[1], 18, 22, 14), { fill: C.water, line: 3, seed: 246 }); }
    const la = seg(t, TL.DROP + .4, TL.DROP + .8);
    if (la > 0) {
      card(g, 60, 1150, 300, 90, '#FFFFFF', { r: 45, seed: 247 }); text(g, 'vie aeree', 210, 1210, { font: SANS(700, 44), align: 'center', fill: C.redD, alpha: la });
      card(g, 720, 1150, 300, 90, '#FFFFFF', { r: 45, seed: 248 }); text(g, 'esofago', 870, 1210, { font: SANS(600, 44), align: 'center', fill: C.ink, alpha: la });
      ink(g, [[360, 1195], [560, 1195]], 4, { seed: 249 }); ink(g, [[690, 1150], [700, 1195]], 4, { seed: 250 });
      if (la > .5) note('lab', 'vie aeree esofago', 60, 1150, 980, 1240);
    }
    const ra = seg(t, TL.DROP + 1.0, TL.DROP + 1.4); if (ra > 0) { bigText(g, ['RISCHIO'], 520, { px: 110, a: ra, fill: C.redD, plate: '#F4B3A8' }); if (ra > .5) note('risk', 'RISCHIO', 260, 420, 820, 540); }
    if (a < 1) { /* the head slides up on twos */ }
  }
}
const SIGNS = ['TOSSE', 'VOCE GORGOGLIANTE', 'CIBO TRATTENUTO IN BOCCA', 'DEGLUTIZIONI RIPETUTE'];
function signals(g, t) {
  const grounds = [[C.blueG, C.blueGD], [C.mustL, C.mustD], [C.oat, C.oatD], ['#E7D9E3', '#CDB8C9']];
  const i = t < TL.S[0] ? -1 : TL.S.filter(s => t >= s).length - 1;
  if (i < 0) {
    G(g, C.oat, C.oatD, 1500);
    const a = seg(t, TL.SIG, TL.SIG + .3);
    bigText(g, ['I SEGNALI'], 760, { px: 130, a, plate: C.amberL });
    [0, 1, 2, 3].forEach(k => medallion(g, 270 + k * 180, 1120, 60, k + 1, seg(t, TL.SIG + 1 + k * .25, TL.SIG + 1.4 + k * .25)));
    if (a > .5) note('sig', 'I SEGNALI', 120, 640, 960, 800);
    return;
  }
  const [gr, fl] = grounds[i]; G(g, gr, fl, 1420);
  const lt = t - TL.S[i], a = seg(lt, 0, .3);
  // iris opening from the medallion
  medallion(g, W / 2, 560, 80, i + 1, seg(lt, 0, .25));
  const f = fit(g, SIGNS[i], SLAB('{px}'), 92, W - 140, 2, 60);
  f.lines.forEach((l, k) => text(g, l, W / 2, 780 + k * (f.px * 1.05), { font: f.font, fill: C.ink, plate: C.amberL, align: 'center', alpha: clamp(lt * 6 - .2), seed: 260 + k }));
  if (lt > .1) note('s' + i, SIGNS[i], 70, 700, 1010, 780 + f.lines.length * f.px * 1.05);
  const py = 1250, hx = 470;
  if (i === 0) { const c = Math.sin(clamp((lt - .5) / .35) * Math.PI) + Math.sin(clamp((lt - 1.3) / .35) * Math.PI); head(g, hx, py, 1.9, { mouth: c > .2 ? 'open' : 'closed', jolt: c * .6, squint: c > .3 }); coughBurst(g, hx + 140, py + 50, 1.4, seg(lt, .5, 1.1), 1); coughBurst(g, hx + 140, py + 50, 1.4, seg(lt, 1.3, 1.9), 2); }
  if (i === 1) { head(g, hx, py, 1.9, { mouth: 'o' }); bubbles(g, hx + 120, py + 40, t, seg(lt, .3, .7), 1.4); }
  if (i === 2) { head(g, hx, py, 1.9, { mouth: 'closed', cheek: ss(seg(lt, .3, .8)) }); shape(g, ellipse(hx + 52, py + 34, 22 * ss(seg(lt, .3, .8)), 16 * ss(seg(lt, .3, .8)), 14), { fill: '#C9955D', line: 2.5, seed: 270 }); }
  if (i === 3) { head(g, hx, py, 1.9, {}); const n = Math.min(3, Math.floor((lt - .3) / .7) + 1); for (let k = 0; k < 3; k++) { const on = k < n; const bob = on && k === n - 1 ? Math.sin(clamp(((lt - .3) % .7) / .35) * Math.PI) : 0;
      arrow(g, [hx + 220 + k * 90, py + 200 + bob * -20], [hx + 220 + k * 90, py + 80 + bob * -20], { u: on ? 1 : 0, bend: 0, w: 6, head: 26, fill: C.amber, seed: 280 + k }); } text(g, `×${Math.max(1, n)}`, hx + 330, py + 290, { font: SLAB(70), fill: C.ink, plate: C.amberL, align: 'center' }); }
}
const CHECKS = [['Interrompe', ''], ['La tiene seduta', 'con il busto eretto'], ['Non la lascia sola', ''], ["Avvisa subito", "l'infermiere"]];
function oss(g, t) {
  G(g, '#E3EFEC', '#C6DCD7', 1460);
  const a = seg(t, TL.OSS + .2, TL.OSS + .6);
  bigText(g, ["COSA FA L'OSS"], 560, { px: 96, a, plate: C.tealL });
  if (a > .5) note('oh', "COSA FA L'OSS", 120, 470, 960, 580);
  CHECKS.forEach(([t1, t2], i) => {
    const y = 760 + i * 190, ap = seg(t, TL.C[i] - .4, TL.C[i]), ck = seg(t, TL.C[i], TL.C[i] + .3);
    if (ap <= 0) return;
    g.save(); g.globalAlpha = clamp(ap * 2); g.translate((1 - eo(ap)) * 60, 0);
    card(g, 70, y - 80, 940, 160, '#FFFFFF', { r: 30, seed: 300 + i });
    check(g, 170, y, 1, ck);
    text(g, t1, 260, t2 ? y - 6 : y + 18, { font: SANS(600, 54), fill: C.ink });
    if (t2) text(g, t2, 260, y + 50, { font: SANS(500, 42), fill: C.tealD });
    ossIcon(g, i, 900, y, t);
    g.restore();
    if (ap > .9) note('c' + i, t1 + ' ' + t2, 70, y - 80, 1010, y + 80);
  });
}
function ossIcon(g, i, x, y, t) {
  if (i === 0) { glove(g, x, y, -Math.PI / 2, .9, '#FBF6EA'); }                                   // a raised flat hand: stop
  if (i === 1) { shape(g, rrect(x - 56, y - 60, 22, 110, 8), { fill: C.amber, line: 3, seed: 310 }); shape(g, rrect(x - 56, y + 16, 100, 22, 8), { fill: C.amber, line: 3, seed: 311 }); shape(g, rrect(x - 28, y - 60, 34, 76, 14), { fill: C.plum, line: 3, seed: 312 }); shape(g, ellipse(x - 10, y - 78, 20, 20, 16), { fill: C.skin, line: 3, seed: 313 }); ink(g, [[x - 10, y - 50], [x - 10, y + 10]], 3, { color: C.tealD, seed: 314 }); }
  if (i === 2) { for (const [dx, c] of [[-34, C.plum], [30, C.teal]]) { shape(g, rrect(x + dx - 20, y - 30, 40, 80, 16), { fill: c, line: 3, seed: 320 + dx }); shape(g, ellipse(x + dx, y - 50, 19, 19, 16), { fill: C.skin, line: 3, seed: 322 + dx }); } }
  if (i === 3) { const ring = Math.sin(twos(t) * 30) * .12; g.save(); g.translate(x, y); g.rotate(ring); shape(g, spline([[-46, 30], [-36, -20], [0, -50], [36, -20], [46, 30]], true, 8), { fill: C.amber, line: 3.5, seed: 330 }); shape(g, rect(-56, 26, 112, 14), { fill: C.amberD, line: 3, seed: 331 }); shape(g, ellipse(0, 48, 10, 10, 12), { fill: C.ink, line: 0, seed: 332 }); g.restore(); }
}
function who(g, t) {
  G(g, '#F6E7C8', '#E8CF9D', 1460);
  const a = seg(t, TL.WHO + .2, TL.WHO + .6);
  bigText(g, ['CHI DECIDE?'], 560, { px: 104, a, plate: C.amberL });
  if (a > .5) note('wh', 'CHI DECIDE?', 160, 460, 920, 580);
  const items = [['CONSISTENZE', 0], ['ADDENSANTI', 1], ['POSTURE', 2]];
  items.forEach(([s, k]) => {
    const ap = seg(t, VO.L19 + .2 + k * .55, VO.L19 + .55 + k * .55); if (ap <= 0) return;
    const x = 210 + k * 330, y = 800;
    g.save(); g.translate(x, y); g.scale(back(ap, 2), back(ap, 2));
    shape(g, ellipse(0, 0, 120, 120, 36), { fill: C.amber, line: 4, seed: 340 + k, shade: [{ pts: ellipse(30, 30, 110, 110, 30), color: C.amberD, alpha: .35 }] });
    if (k === 0) { shape(g, [[-60, -6], [60, -6], [44, 46], [-44, 46]], { fill: '#FBF6EA', line: 3.5, seed: 350 }); shape(g, ellipse(0, -6, 60, 14, 20), { fill: '#E8D9B8', line: 3, seed: 351 }); }
    if (k === 1) { shape(g, rrect(-40, -50, 80, 100, 14), { fill: '#FBF6EA', line: 3.5, seed: 352 }); shape(g, rrect(-46, -66, 92, 24, 8), { fill: C.amberD, line: 3, seed: 353 }); ink(g, [[-22, 0], [22, 0]], 4, { seed: 354 }); ink(g, [[-22, 18], [14, 18]], 4, { seed: 355 }); }
    if (k === 2) { shape(g, rrect(-46, -60, 22, 110, 8), { fill: '#FBF6EA', line: 3.5, seed: 356 }); shape(g, rrect(-46, 10, 96, 22, 8), { fill: '#FBF6EA', line: 3.5, seed: 357 }); ink(g, [[-36, 32], [-36, 60]], 5, { seed: 358 }); ink(g, [[40, 32], [40, 60]], 5, { seed: 359 }); }
    g.restore();
    text(g, s, x, y + 170, { font: SANS(700, 36), align: 'center', track: 2, alpha: ap });
  });
  if (seg(t, VO.L19 + 1.6, VO.L19 + 2) > .5) note('items', 'CONSISTENZE ADDENSANTI POSTURE', 60, 660, 1020, 990);
  // the team: three figures + speech therapist label
  const tb = seg(t, VO.L19 + 1.5, VO.L19 + 1.8);
  if (tb > 0) {
    const tf = 1 - seg(t, TL.PAI + .1, TL.PAI + .4); g.save(); g.globalAlpha = clamp(tb * 2) * tf;
    [[-200, C.blueG], [-70, C.teal], [70, C.plum], [200, C.amber]].forEach(([dx, c], k) => { const x = W / 2 + dx, y = 1180; shape(g, rrect(x - 44, y - 40, 88, 150, 34), { fill: c, line: 3.5, seed: 360 + k }); shape(g, ellipse(x, y - 76, 38, 38, 18), { fill: C.skin, line: 3.5, seed: 364 + k }); });
    card(g, 190, 1290, 700, 92, '#FFFFFF', { r: 46, seed: 370 }); text(g, "l'équipe e il logopedista", W / 2, 1350, { font: SANS(600, 44), align: 'center' });
    g.restore(); if (tb > .5 && tf > .99) note('team', "l'équipe e il logopedista", 190, 1290, 890, 1382);
  }
  // the PAI: a document stamped
  const pa = seg(t, TL.PAI + .4, TL.PAI + .7);
  if (pa > 0) {
    g.save(); g.translate(W / 2, 1100); g.rotate(-.06); g.scale(back(pa, 2.6), back(pa, 2.6));
    shape(g, rrect(-230, -120, 460, 240, 18), { fill: C.red, line: 5, seed: 380, alpha: .95 }); shape(g, rrect(-200, -92, 400, 184, 12), { fill: C.paper, line: 3, seed: 381 });
    text(g, 'PAI', 0, 50, { font: SLAB(150), fill: C.redD, align: 'center', seed: 382 });
    g.restore(); text(g, 'è tutto scritto nel PAI', W / 2, 1300, { font: SANS(600, 44), align: 'center', alpha: pa });
    if (pa > .5) note('pai', 'PAI è tutto scritto nel PAI', 160, 970, 920, 1320);
  }
}
function key(g, t) {
  G(g, C.blueG, C.blueGD, 1460);
  if (t < TL.KEYTXT) return;   // the silence: just the ground
  const lt = t - TL.KEYTXT;
  glass(g, 250 - eo(seg(lt, 0, .6)) * 60, 1440, .8, { level: .7 });
  bigX(g, 190, 1340, 90, seg(lt, .3, .6));
  const bx = 820, by = 1380; g.save(); g.translate(bx, by); g.rotate(Math.sin(twos(t) * 25) * .1 * (1 - seg(lt, 3, 3.5))); shape(g, spline([[-80, 50], [-62, -30], [0, -84], [62, -30], [80, 50]], true, 8), { fill: C.amber, line: 4.5, seed: 400 }); shape(g, rect(-96, 44, 192, 24), { fill: C.amberD, line: 4, seed: 401 }); shape(g, ellipse(0, 84, 16, 16, 12), { fill: C.ink, line: 0, seed: 402 }); g.restore();
  star(g, bx, by - 10, 160, { fill: '#FFFFFF', n: 16, inner: .8, alpha: .5, rot: twos(t) * .1 });
  const y1 = bigText(g, ['Non serve', 'altra acqua:'], 560, { px: 104, a: seg(lt, 0, .35), plate: C.waterL, stagger: true });
  bigText(g, ['serve fermarsi', 'e chiamare', "l'infermiere."], y1 + 40, { px: 92, a: seg(lt, .9, 1.4), plate: C.tealL, fill: C.tealD, stagger: true });
  if (lt > .4) note('k1', 'Non serve altra acqua:', 60, 460, 1020, 790);
  if (lt > 1.4) note('k2', "serve fermarsi e chiamare l'infermiere.", 60, 800, 1020, 1120);
}
function cta(g, t) {
  G(g, '#F3E2D9', '#E0C4B5', 1500);
  const lt = t - TL.CTA;
  bigText(g, ['Ti è mai capitato', 'in turno?'], 600, { px: 92, a: seg(lt, .2, .5), plate: C.amberL });
  if (lt > .5) note('q', 'Ti è mai capitato in turno?', 60, 510, 1020, 720);
  const b = seg(t, TL.CTA2 - .2, TL.CTA2 + .1);
  if (b > 0) {
    g.save(); g.translate(W / 2, 1060); g.scale(back(b, 2), back(b, 2));
    shape(g, [[-250, 100], [-300, 200], [-170, 100]], { fill: '#FFFFFF', line: 4.5, seed: 409 }); shape(g, rrect(-400, -110, 800, 220, 60), { fill: '#FFFFFF', line: 4.5, seed: 410 });
    text(g, 'Scrivi nei commenti:', 0, -30, { font: SANS(600, 44), align: 'center' });
    const word = 'ACQUA', n = Math.floor(clamp((t - TL.CTA2 - .3) / .5) * word.length + 1e-6);
    text(g, word.slice(0, Math.max(0, n)), 0, 70, { font: SLAB(96), fill: C.waterD, plate: C.waterL, align: 'center' });
    if (n < word.length && Math.floor(t * 4) % 2) ink(g, [[measure(g, word.slice(0, n), SLAB(96)) / 2 + 10, 0], [measure(g, word.slice(0, n), SLAB(96)) / 2 + 10, 80]], 5, { seed: 411 });
    g.restore();
    if (b > .9) note('acqua', 'Scrivi nei commenti: ACQUA', 140, 950, 940, 1170);
  }
  for (let i = 0; i < 6; i++) sparkle(g, 140 + i * 160, 1320 + Math.sin(i * 2.1) * 40, 22 * seg(lt, .3 + i * .1, .6 + i * .1), { fill: C.amber, rot: twos(t) * .2 });
}

// ---------- the logo band, transitions, captions ----------
function logoBand(g) {
  plane(g, rect(0, 0, W, BAND), C.paper);
  const lw = Math.round(W * .83), lh = Math.round(lw * IMG.logo.height / IMG.logo.width);
  g.drawImage(IMG.logo, (W - lw) / 2, (BAND - lh) / 2, lw, lh);
  ink(g, [[30, BAND - 2], [W * .5, BAND - 1], [W - 30, BAND - 2]], 4, { breaks: .25, seed: 3 });
}
function wipe(g, t, t0, color, dir = 1) { // colour-block wipe (bottom-up), covering the content area
  const u = seg(t, t0 - .25, t0), v = seg(t, t0, t0 + .25); if (u <= 0 || v >= 1) return;
  const y0 = BAND + (H - BAND) * (1 - eo(u)), y1 = BAND + (H - BAND) * (1 - eo(v)) * 0;
  const top = u < 1 ? y0 : BAND, bot = u < 1 ? H : BAND + (H - BAND) * (1 - eo(v));
  plane(g, rect(0, top, W, bot - top), color);
}
function caption(g, t) {
  const S = SUBS.find(s => t >= s.t0 && t < s.t1); if (!S || !CAP.has(S.id)) return;
  const f = fit(g, SUBTEXT[S.id], SANS(500, '{px}'), 42, W - 200, 3, 34);
  const lh = f.px * 1.25, h = f.lines.length * lh + 40, w = Math.max(...f.lines.map(l => measure(g, l, f.font))) + 120, x = (W - w) / 2, y = H - 150 - h;
  const a = seg(t, S.t0, S.t0 + .15) * (1 - seg(t, S.t1 - .15, S.t1)), rise = (1 - eo(seg(t, S.t0, S.t0 + .2))) * 14;
  g.save(); g.globalAlpha = a; g.translate(0, rise);
  shape(g, rrect(x, y, w, h, 26), { fill: '#FBF6EA', line: 3.5, seed: 500, grain: .15, breaks: .1 });
  sparkle(g, x + 30, y + h / 2, 14, { fill: C.amber, rot: twos(t) }); sparkle(g, x + w - 30, y + h / 2, 14, { fill: C.amber, rot: -twos(t) });
  f.lines.forEach((l, i) => text(g, l, W / 2, y + 22 + lh * (i + .78), { font: f.font, align: 'center', fill: C.ink, plate: null }));
  g.restore();
}

// ---------- render ----------
export function render(g, t) {
  TXT = []; setClock(t);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
  if (t >= TL.END) { endCard(g, t); return; }
  if (t < TL.SCENE) hook(g, t); else if (t < TL.WHAT) scene(g, t); else if (t < TL.SIG) what(g, t); else if (t < TL.OSS) signals(g, t);
  else if (t < TL.WHO) oss(g, t); else if (t < TL.KEY) who(g, t); else if (t < TL.CTA) key(g, t); else cta(g, t);
  // transitions: a colour block wipes up over each change of card
  [[TL.SCENE, C.mustL], [TL.WHAT, C.oat], [TL.SIG, C.oat], ...TL.S.map((s, i) => [s, [C.blueG, C.mustL, C.oat, '#E7D9E3'][i]]), [TL.OSS, '#E3EFEC'], [TL.WHO, '#F6E7C8'], [TL.CTA, '#F3E2D9']].forEach(([t0, c]) => wipe(g, t, t0, c));
  paperFinish(g, W, H, .8);
  logoBand(g);
  caption(g, t);
  // fade to the end card
  const fo = seg(t, TL.END - .4, TL.END); if (fo > 0) { g.globalAlpha = fo; g.drawImage(IMG.fin, 0, 0, W, H); g.globalAlpha = 1; }
}
function endCard(g, t) { g.drawImage(IMG.fin, 0, 0, W, H); note('end', 'UNA DOMANDA AL GIORNO toglie il concorso di torno', 90, 880, 990, 1040, true); }
export function texts(g, t) { render(g, t); return TXT; }

// ---------- sound events ----------
export function events() {
  const E = [], ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  ev(TL.CRACK, 'crack'); ev(TL.HOOK2, 'pop');
  ev(TL.SIP1, 'sip'); ev(TL.COUGH1, 'cough'); ev(TL.SIP2, 'sip'); ev(TL.COUGH2, 'cough'); ev(TL.COUGH2 + .7, 'cough', { g: .7 }); ev(TL.GURGLE, 'gurgle', { d: 2.4 }); ev(TL.GURGLE + 1.5, 'cough', { g: .6 });
  ev(TL.OFFER - .3, 'slide'); ev(TL.OFFER + .3, 'glassdown'); ev(TL.X, 'stamp', { big: 1 });
  [TL.SCENE, TL.WHAT, TL.SIG, ...TL.S, TL.OSS, TL.WHO, TL.CTA].forEach(t => ev(t - .25, 'wipe'));
  ev(TL.WHAT + .3, 'pop'); ev(TL.THIN, 'sparkle'); ev(TL.DIAG, 'pop'); ev(TL.DROP, 'drop', { d: 1.6 }); ev(TL.DROP + 1.6, 'stamp');
  [0, 1, 2, 3].forEach(k => ev(TL.SIG + 1 + k * .25, 'medal', { i: k })); TL.S.forEach((s, i) => { ev(s, 'medal', { i }); ev(s, 'chord', { i }); });
  ev(TL.S[0] + .5, 'cough', { g: .6 }); ev(TL.S[0] + 1.3, 'cough', { g: .6 }); ev(TL.S[1] + .3, 'gurgle', { d: 2.2 }); ev(TL.S[3] + .3, 'gulp'); ev(TL.S[3] + 1.0, 'gulp'); ev(TL.S[3] + 1.7, 'gulp');
  TL.C.forEach((c, i) => { ev(c, 'tick', { i }); ev(c, 'chord', { i: i + 4 }); }); ev(TL.C[3] + .1, 'bell');
  [0, 1, 2].forEach(k => ev(VO.L19 + .2 + k * .55, 'pop')); ev(VO.L19 + 1.5, 'pop'); ev(TL.PAI + .4, 'stamp', { big: 1 });
  ev(TL.KEYTXT, 'glassdown'); ev(TL.KEYTXT + .3, 'stamp'); ev(TL.KEYTXT + .5, 'bell');
  ev(TL.CTA + .2, 'pop'); ev(TL.CTA2, 'pop'); for (let k = 0; k < 5; k++) ev(TL.CTA2 + .3 + k * .1, 'type');
  ev(TL.END - .4, 'endcard');
  Object.entries(VO).forEach(([id, t]) => ev(t, 'vo', { id }));
  return E.sort((a, b) => a.t - b.t);
}
