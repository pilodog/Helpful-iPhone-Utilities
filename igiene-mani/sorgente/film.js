// Mani pulite, cura sicura — the film: boards, camera, story state, overlays, subtitles, sound events.
import { Iso, PAL, tri, hex, mix, TAU, clamp, lerp, seg, ss, eo, eio, back, hash, pin, inset, ring, cutLine, haloText, person } from './engine.js';
import { hand, rubStep, rubArrows, RUB_NAMES, ringItem, braceletItem, watchItem, SKIN, arrow2 } from './hands.js';
import { TL, VO, BEAT, DUR as D } from './timeline.js';
export const DUR = D;

// ---------- palette (one meaning per hue) ----------
const BG = '#ECEEF0', INK = '#2A2733';
const CORAL = '#E8705E', TEAL = '#2FA39A', WATER = '#4C8FD6', LAV = '#A99BD6', STEEL = '#8C96A3', MUST = '#E2B04A', NAVY = '#3D4E6E';
Object.assign(PAL, { ink: INK, paper: '#F8F9FA', bg: BG, halo: 'rgba(240,242,244,.94)', grey: '#DEE1E5' });
const T = {
  floor: tri('#D3D8DE', .35, .18), slab1: tri('#BFC5CD'), slab2: tri('#A9B0BA'), slab3: tri('#959DA8'),
  wall: tri('#C9CFD7', .3, .16), steel: tri(STEEL), white: tri('#F1F2F4', .1, .14), lav: tri(LAV), lavD: tri('#9384C8'),
  teal: tri(TEAL), coral: tri(CORAL), water: tri(WATER), must: tri(MUST), navy: tri(NAVY), skin: tri(SKIN), wood: tri('#B9C0CA'),
  bag: tri('#E6DDB0'), ceramic: tri('#F6F3EE', .1, .14), plinth: tri('#E3E6EA', .3, .14),
};
const LANG_FONT = 'Jost';

// ---------- sub-titles (from the timeline + measured voice lengths) ----------
let LINES = [], SUBS = [];
export function init(dur) {
  SUBS = Object.keys(VO).map((id, i, ids) => {
    const t0 = VO[id], d = dur[id] || 2, next = i + 1 < ids.length ? VO[ids[i + 1]] : 1e9;
    return { id, t0, t1: Math.min(next - .15, Math.max(t0 + 1.8, t0 + d + .6)), d };
  });
}
export function setLines(l) { LINES = l; }
const SUBTEXT = {
  L01: "Le mani di chi assiste sono il primo strumento di cura.",
  L02: "Ma possono anche portare i germi da un paziente all'altro.",
  L03: "Secondo l'OMS, una buona igiene delle mani previene fino al 50% delle infezioni evitabili legate all'assistenza.",
  L04: "Prima di tutto, mani pronte: unghie corte e senza smalto, niente anelli, bracciali o orologio.",
  L05: "E ricorda: i guanti non sostituiscono l'igiene delle mani.",
  L06: "Poi, i 5 momenti.",
  L07: "1 · Prima di toccare il paziente.",
  L08: "2 · Prima di una manovra pulita o asettica, come l'igiene della bocca.",
  L09: "3 · Dopo il rischio di contatto con liquidi biologici, come svuotare la sacca delle urine.",
  L10: "4 · Dopo aver toccato il paziente.",
  L11: "5 · Dopo aver toccato ciò che lo circonda, anche senza aver toccato lui.",
  L12: "Di regola, usa il gel idroalcolico: 20–30 secondi, finché le mani sono asciutte.",
  L13: "Palmo contro palmo, il dorso, tra le dita, le nocche, i pollici, la punta delle dita.",
  L14: "Se le mani sono visibilmente sporche, o dopo il bagno, usa acqua e sapone: 40–60 secondi.",
  L15: "Stessi movimenti, poi risciacqua, asciuga con una salvietta monouso e usala per chiudere il rubinetto.",
  L16: "5 momenti. Ogni volta, per ogni paziente.",
  L17: "Mani pulite, cura sicura.",
};
export const subtitleCues = () => SUBS.map(s => ({ t0: s.t0, t1: s.t1, text: SUBTEXT[s.id] }));

// ---------- helpers ----------
const sect = t => t < TL.NUM0 ? 'hook' : t < TL.READY0 ? 'num' : t < TL.ROOM0 ? 'ready' : t < TL.RUB0 ? 'mom' : t < TL.WASH0 ? 'rub' : t < TL.FIN0 ? 'wash' : 'fin';
const steps12 = t => Math.floor(t * 12) / 12;
function path(t, keys) { // keys [[t,x,y], ...] eased between consecutive keys; returns [x,y,moving,dir]
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2], 0, 0];
  for (let i = 1; i < keys.length; i++) {
    const [t0, x0, y0] = keys[i - 1], [t1, x1, y1] = keys[i];
    if (t <= t1) { if (x0 === x1 && y0 === y1) return [x0, y0, 0, 0]; const u = eio(seg(t, t0, t1)); return [lerp(x0, x1, u), lerp(y0, y1, u), u > 0 && u < 1 ? 1 : 0, Math.sign((x1 - y1) - (x0 - y0))]; }
  }
  const l = keys[keys.length - 1]; return [l[1], l[2], 0, 0];
}
function camAt(t, keys) { // keys [{t,x,y,z,k}] eio in position, log in zoom
  if (t <= keys[0].t) return { ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    const A = keys[i - 1], B = keys[i];
    if (t <= B.t) { const u = (B.e || eio)(seg(t, A.t, B.t)); return { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), z: lerp(A.z, B.z, u), k: Math.exp(lerp(Math.log(A.k), Math.log(B.k), u)) }; }
  }
  return { ...keys[keys.length - 1] };
}
const boardZ = (t, tin, tout) => { // rise from below with a bounce; sink when leaving
  let z = 0; if (tin != null) z = -26 * (1 - back(seg(t, tin, tin + .8), 1.3)); if (tout != null) z -= 30 * Math.pow(seg(t, tout, tout + .6), 2); return z;
};
function germ(g, x, y, r, c = CORAL, a = 1) { // coral germ: disc + 6 nubs (screen px)
  if (a <= 0 || r <= .3) return; g.save(); g.globalAlpha *= a; const T3 = tri(c);
  g.fillStyle = T3[2]; for (let i = 0; i < 6; i++) { const q = i / 6 * TAU + .3; g.beginPath(); g.arc(x + Math.cos(q) * r * 1.15, y + Math.sin(q) * r * 1.15, r * .28, 0, TAU); g.fill(); }
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = T3[1]; g.fill(); g.beginPath(); g.arc(x - r * .25, y - r * .3, r * .55, 0, TAU); g.fillStyle = T3[0]; g.fill(); g.restore();
}
function drop(g, x, y, s, c = TEAL, a = 1) { // gel / water drop icon
  if (a <= 0) return; const T3 = tri(c); g.save(); g.globalAlpha *= a; g.translate(x, y);
  g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(s * .55, -s * .3, s * .7, s * .15, s * .7, s * .35); g.arc(0, s * .35, s * .7, 0, Math.PI); g.bezierCurveTo(-s * .7, s * .15, -s * .55, -s * .3, 0, -s); g.fillStyle = T3[1]; g.fill();
  g.beginPath(); g.ellipse(-s * .25, s * .2, s * .16, s * .3, -.3, 0, TAU); g.fillStyle = T3[0]; g.fill(); g.restore();
}
function plate(g, x, y, w, h, r = 12) { g.beginPath(); g.roundRect(x, y, w, h, r); }
let TXT = [];
const note = (id, text, x0, y0, x1, y1, pass) => TXT.push({ id, text, x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1), ...(pass ? { pass: true } : {}) });
function title(g, text, x, y, a, o = {}) { // section title plate (top-left), ink caps with tracking, a teal chip
  if (a <= 0) return; const s = o.size || 34; g.save(); g.globalAlpha = clamp(a * 3);
  g.font = `600 ${s}px Jost`; g.letterSpacing = '5px'; const w = g.measureText(text).width; g.letterSpacing = '0px';
  const wv = (w + 40) * eo(a);
  g.save(); g.beginPath(); g.rect(x - 4, y - s - 20, wv + 70, s * 2 + 60); g.clip();
  const T3 = tri(o.chip || TEAL); const cx = x + 12, cy = y - s * .35;
  g.beginPath(); g.moveTo(cx, cy - 12); g.lineTo(cx + 11, cy - 6); g.lineTo(cx, cy); g.lineTo(cx - 11, cy - 6); g.closePath(); g.fillStyle = T3[0]; g.fill();
  g.beginPath(); g.moveTo(cx - 11, cy - 6); g.lineTo(cx, cy); g.lineTo(cx, cy + 12); g.lineTo(cx - 11, cy + 6); g.closePath(); g.fillStyle = T3[1]; g.fill();
  g.beginPath(); g.moveTo(cx + 11, cy - 6); g.lineTo(cx, cy); g.lineTo(cx, cy + 12); g.lineTo(cx + 11, cy + 6); g.closePath(); g.fillStyle = T3[2]; g.fill();
  haloText(g, text, x + 38, y, { font: `600 ${s}px Jost`, track: 5, color: INK });
  if (o.sub) haloText(g, o.sub, x + 38, y + s + 8, { font: `400 ${Math.round(s * .72)}px Jost`, track: 1, color: INK });
  g.restore(); g.restore();
  if (a > .5) note('title:' + text, text + (o.sub ? ' ' + o.sub : ''), x, y - s, x + 38 + w + 10, y + (o.sub ? s * 1.8 : 10));
}

// ---------- world: the room ----------
const BED_A = [0.7, 2.4], BED_B = [0.7, 12.6];
const ZONE = [[0.1, 11.3], [10.2, 11.3], [10.2, 19.4], [0.1, 19.4]];
const DISP_WALL = [0, 9.9, 3.0], DISP_FOOT_B = [8.0, 14.0, 1.75];
function room(iso, t, S, o = {}) {
  const z0 = o.z || 0, dz = (z) => z + z0, full = o.detail !== false;
  // board and strata
  iso.box(0, 0, dz(-.3), 22, 22, .3, T.floor, { cull: false, layer: -2 });
  iso.box(0, 0, dz(-1.0), 22, 22, .7, T.slab1, { cull: false, layer: -2 });
  iso.box(0, 0, dz(-1.9), 22, 22, .9, T.slab2, { cull: false, layer: -2 });
  if (full) {
    // a pipe in the screed (strata detail on the near faces)
    iso.cyl(22.01, 6, dz(-.65), .22, .01, T.steel, { axis: 'x', cull: false, layer: -2 });
    // floor tile lines
    for (let i = 2; i < 22; i += 2) { iso.line3([[i, 0, dz(0)], [i, 22, dz(0)]], '#C6CCD3', 1, { depth: -900 }); iso.line3([[0, i, dz(0)], [22, i, dz(0)]], '#C6CCD3', 1, { depth: -900 }); }
  }
  // walls: along x = 0 (window) and y = 0 (door at x 15..18.5)
  iso.box(-.5, -.5, dz(-1.9), .5, 22.5, 8.4, T.wall, { cull: false, layer: -1 });
  iso.box(0, -.5, dz(-1.9), 15, .5, 8.4, T.wall, { cull: false, layer: -1 });
  iso.box(18.5, -.5, dz(-1.9), 3.5, .5, 8.4, T.wall, { cull: false, layer: -1 });
  iso.box(15, -.5, dz(5.2), 3.5, .5, 1.3, T.wall, { cull: false, layer: -1 });
  if (full) {
    iso.flat([[15, -.02], [18.5, -.02], [18.5, -.02], [15, -.02]], dz(0), '#B8BFC8');
    // window on the x = 0 wall, behind bed B
    iso.add(0, () => { const P = (y, z) => iso.P(0.01, y, dz(z)); iso.poly([P(13.4, 3.4), P(18.6, 3.4), P(18.6, 6.0), P(13.4, 6.0)], '#DCEBF5'); iso.poly([P(13.4, 3.4), P(18.6, 3.4), P(18.6, 3.55), P(13.4, 3.55)], '#B6C2CE'); iso.poly([P(15.95, 3.4), P(16.05, 3.4), P(16.05, 6.0), P(15.95, 6.0)], '#B6C2CE'); }, -.5);
    // wall dispenser between the beds
    disp(iso, DISP_WALL[0], DISP_WALL[1], dz(DISP_WALL[2]), 'wall', S.lit?.(t, 'wall') ?? 0);
  }
  bed(iso, BED_A[0], BED_A[1], dz(0), { germs: S.germA ? S.germA(t) : 0, detail: full });
  bed(iso, BED_B[0], BED_B[1], dz(0), { germs: S.germB ? S.germB(t) : 0, detail: full, bag: true, footDisp: S.lit?.(t, 'foot') ?? 0, cup: S.cup ? S.cup(t) : 0 });
}
function disp(iso, x, y, z, kind, lit) { // teal dispenser; lit 0..1 pulses
  const c = T.teal;
  if (kind === 'wall') { iso.box(x, y - .45, z, .45, .9, 1.3, c); iso.box(x + .45, y - .1, z + .1, .2, .2, .25, tri('#2A7F78')); }
  else { iso.box(x, y, z, .55, .55, .8, c); iso.cyl(x + .27, y + .27, z + .8, .12, .25, T.white); }
}
function bed(iso, x, y, z, o) {
  const W = 3.2;
  for (const [lx, ly] of [[.1, .1], [6.6, .1], [.1, W - .35], [6.6, W - .35]]) iso.box(x + lx, y + ly, z, .25, .25, .55, T.steel);
  iso.box(x, y, z + .55, 7, W, .4, T.steel);
  iso.box(x + .12, y + .1, z + .95, 6.76, W - .2, .45, T.white);
  iso.box(x - .15, y, z + .2, .3, W, 2.6, T.steel, { bias: -1 });
  iso.box(x + 6.9, y, z + .2, .25, W, 1.7, T.steel);
  iso.box(x + .4, y + .5, z + 1.4, 1.3, W - 1, .35, T.white);
  iso.sphere(x + 1.05, y + W / 2, z + 2.25, .62, T.skin); iso.sphere(x + .85, y + W / 2, z + 2.45, .5, tri('#8A8F99'), { hi: false });
  iso.box(x + 1.8, y + .02, z + 1.4, 5.0, W - .04, .45, T.lav);
  iso.box(x + 2.1, y + .7, z + 1.85, 4.3, W - 1.4, .3, T.lavD);
  iso.box(x + 2.6, y + W - .75, z + 2.15, 1.8, .38, .2, T.skin);   // the arm on the blanket (the side facing the viewer)
  if (o.footDisp != null && o.footDisp !== undefined && o.bag) disp(iso, x + 7.15, y + 1.3, z + 1.9, 'foot', o.footDisp);
  // bedside table (comodino) at the head, on the viewer side
  iso.box(x + .2, y + W + .5, z, 1.7, 1.5, 1.9, T.wood);
  iso.box(x + .2, y + W + .5, z + 1.9, 1.7, 1.5, .08, T.white);
  iso.cyl(x + 1.05 + (o.cup || 0) * .5, y + W + 1.25, z + 1.98, .22, .45, T.ceramic, { n: 14 });
  if (o.bag) { iso.box(x + 4.2, y + W + .02, z + .25, .8, .12, 1.0, T.bag); iso.line3([[x + 4.6, y + W + .08, z + .25], [x + 4.6, y + W + .3, z - .0], [x + 5.6, y + W + .4, z]], '#B9B08A', 2); }
  // germs on the blanket (screen-space coral germs at fixed spots)
  if (o.germs > 0) {
    const spots = [[3.0, .7], [4.6, 1.2], [5.6, 2.2], [3.6, 2.4], [2.4, 1.6], [5.0, .5]];
    spots.forEach(([gx, gy], i) => { const a = clamp(o.germs * 6 - i); if (a > 0) iso.bill(x + gx, y + gy, z + 2.3, (g, I, k) => germ(g, 0, 0, .3 * back(clamp(a), 2.2), CORAL), { bias: 3, r: 1 }); });
  }
}
// the operator (OSS): navy uniform, billboard; returns the hand world point
function oss(iso, x, y, t, o = {}) {
  const h = 3.4, mv = o.moving ? 1 : 0, ph = steps12(t) * 2 * Math.PI * 1.6;
  const bob = mv ? Math.abs(Math.sin(ph)) * .06 * h : 0, arm = o.arm ?? (mv ? .25 + Math.sin(ph) * .35 : .2);
  iso.bill(x, y, o.z || 0, (g) => { person(g, { body: NAVY, skin: SKIN, hair: '#4A3328', h, face: o.face || 1, bob, arm, legs: '#2E3A52' }); }, { r: 4, bias: .5 });
  const f = o.face || 1, ax = .12 * h, ay = -.6 * h, al = .34 * h;
  return { x, y, z: o.z || 0, dx: f * (ax + Math.sin(arm) * al), dy: ay + Math.cos(arm) * al - bob };
}
const handScreen = (iso, H) => { const [sx, sy] = iso.P(H.x, H.y, H.z); const k = iso.cam.k; return [sx + H.dx * k, sy + H.dy * k]; };
function rubRing(g, x, y, t, a, r = 46) { // teal ring + gel drops around the hands while rubbing
  if (a <= 0) return; ring(g, x, y, r, a, t, null, { color: TEAL, lw: 3 });
  for (let i = 0; i < 3; i++) { const q = t * 3 + i * 2.1; drop(g, x + Math.cos(q) * r * .55, y - r * .1 + Math.sin(q) * r * .3, 7, TEAL, a * .9); }
}

// ---------- the story state per section ----------
const HOOK_PATH = [[0, 4.6, 6.5], [TL.WALK0, 4.6, 6.5], [TL.WALK1, 4.6, 11.0]];
const MOM_PATH = [[TL.ROOM0, 16.8, 1.2], [TL.ZONE0 + .2, 16.8, 1.2], [TL.M1 - .2, 11.0, 15.0], [TL.M1 + 1.8, 11.0, 15.0], [TL.M2 - .2, 2.8, 17.2], [45.6, 2.8, 17.2], [46.5, 5.2, 17.2],
  [50.6, 5.2, 17.2], [51.2, 3.9, 17.0], [52.4, 3.9, 17.0], [TL.M4 - .1, 11.2, 17.6], [55.5, 11.2, 17.6], [56.5, 2.6, 18.6], [57.3, 2.6, 18.6], [58.4, 11.2, 18.8]];
const FIN_PATH = [[TL.FIN0, 4.6, 6.5], [TL.FIN_WALK0, 4.6, 6.5], [TL.FIN_GEL - .2, 1.6, 9.9], [TL.FIN_WALK1, 1.6, 9.9], [TL.FIN_WALK1 + 1.2, 4.6, 11.0]];
const RUBS = [[TL.M1, TL.M1 + 1.8], [TL.M2, TL.M2 + 1.6], [48.8, 50.4], [TL.M4 + .2, TL.M4 + 1.9], [58.6, 60.4]];
const MOMENTS = [
  { t: TL.M1, n: '1', title: 'PRIMA DEL CONTATTO', sub: 'col paziente', at: [10.2, 13.6, 4.2], dir: 1, up: 120 },
  { t: TL.M2, n: '2', title: 'PRIMA DI UNA MANOVRA', sub: 'pulita o asettica', at: [1.75, 14.2, 2.8], dir: 1, up: 105 },
  { t: TL.M3, n: '3', title: 'DOPO I LIQUIDI', sub: 'biologici (rischio)', at: [5.3, 15.9, 1.0], dir: -1, up: 60 },
  { t: TL.M4, n: '4', title: 'DOPO IL CONTATTO', sub: 'col paziente', at: [11.4, 17.7, 3.8], dir: 1, up: 70 },
  { t: TL.M5, n: '5', title: "DOPO L'AMBIENTE", sub: 'attorno al paziente', at: [1.7, 17.0, 2.4], dir: -1, up: 30 },
];

// ---------- cameras ----------
const CAM_HOOK = [{ t: 0, x: 11, y: 11, z: 0, k: 36 }, { t: 1.5, x: 9.5, y: 9.0, z: 1, k: 40 }, { t: TL.PUSH0, x: 7.5, y: 9.5, z: 1.5, k: 44 },
  { t: TL.PUSH1, x: 4.4, y: 11.0, z: 2.2, k: 150 }, { t: TL.HOOK_END, x: 4.4, y: 11.0, z: 2.2, k: 158 }];
const CAM_NUM = [{ t: TL.NUM0, x: 2.5, y: -2.5, z: -1, k: 38 }, { t: TL.SIL1, x: 2.8, y: -2.8, z: -.5, k: 43 }, { t: TL.READY0, x: 2.8, y: -2.8, z: -.5, k: 43.5 }];
const CAM_READY = [{ t: TL.READY0, x: 11, y: 11, z: 0, k: 33 }, { t: TL.READY_END, x: 11, y: 11, z: 0, k: 34 }];
const CAM_MOM = [{ t: TL.ROOM0, x: 11, y: 11, z: 0, k: 34 }, { t: TL.ZONE0, x: 9.5, y: 12, z: 0, k: 38 }, { t: TL.ZONE1, x: 6.5, y: 15, z: 0, k: 50 },
  { t: TL.M1 + 1.5, x: 8.0, y: 15.0, z: 1, k: 58 }, { t: TL.M2, x: 4.5, y: 16, z: 1, k: 62 }, { t: TL.M2 + 1.8, x: 2.8, y: 16.0, z: 2, k: 84 }, { t: 45.6, x: 3.2, y: 16.2, z: 2, k: 86 }, { t: TL.M3, x: 5.0, y: 16.6, z: 1, k: 82 }, { t: 50.6, x: 5.0, y: 16.6, z: 1, k: 78 }, { t: TL.M4, x: 7.5, y: 16.5, z: 1, k: 58 },
  { t: TL.M5 + 1.0, x: 6.0, y: 16.8, z: 1, k: 58 }, { t: 60.4, x: 6.0, y: 16.0, z: 1, k: 50 }, { t: TL.MOM_END, x: 6.2, y: 16.0, z: 1, k: 49 }];
const CAM_RUB = [{ t: TL.RUB0, x: 6.2, y: 16.0, z: 1, k: 49 }, { t: TL.RUB0 + 1.2, x: 10.5, y: 19.5, z: 2.0, k: 72 }, { t: TL.RUB_END, x: 10.8, y: 19.9, z: 2.0, k: 78 }];
const CAM_WASH = [{ t: TL.WASH0, x: 0, y: 0, z: 1.5, k: 50 }, { t: TL.WASH_END, x: 0, y: 0, z: 1.5, k: 56 }];
const CAM_FIN = [{ t: TL.FIN0, x: 8, y: 9, z: 1, k: 46 }, { t: TL.PULL0, x: 6, y: 10, z: 1, k: 50 }, { t: TL.PULL1, x: 13, y: 45, z: 0, k: 9.8, e: t => 1 - Math.pow(1 - t, 3) }, { t: TL.END, x: 12.5, y: 45.5, z: 0, k: 9.5 }];

// ---------- render ----------
export function render(g, t, Q) {
  TXT = [];
  g.fillStyle = BG; g.fillRect(0, 0, 1920, 1080);
  dots(g);
  const iso = new Iso(g);
  const s = sect(t);
  if (s === 'hook') hook(g, iso, t);
  else if (s === 'num') numberBoard(g, iso, t);
  else if (s === 'ready') ready(g, iso, t);
  else if (s === 'mom') moments(g, iso, t);
  else if (s === 'rub') rub(g, iso, t);
  else if (s === 'wash') wash(g, iso, t);
  else finale(g, iso, t);
  subtitle(g, t);
}
export function texts(g, t, Q) { render(g, t, Q); return TXT; }
function dots(g) { g.fillStyle = 'rgba(42,39,51,.07)'; for (let y = 0; y < 1080; y += 36) for (let x = (y / 36) % 2 ? 31 : 0; x < 1920; x += 62) g.fillRect(x, y, 2, 2); }

// 1 — the hook: germs travel on the hands from bed A to bed B
function hook(g, iso, t) {
  iso.cam = camAt(t, CAM_HOOK);
  const desat = ss(seg(t, TL.PUSH0 + .6, TL.PUSH1)) * .9; iso.desat = desat;
  const out = TL.HOOK_END - .05;
  const [x, y, mv] = path(t, HOOK_PATH);
  const onHand = clamp((t - TL.TOUCH_A) * 3) * (1 - 0);
  room(iso, t, { germA: () => 1, germB: tt => clamp((tt - TL.TOUCH_B - .2) * 1.5) });
  const touchA = t < TL.WALK0 ? .95 + .35 * ss(seg(t, 1.2, 1.8)) - .35 * ss(seg(t, 2.5, 2.9)) : null;
  const touchB = t > TL.WALK1 ? .95 + .35 * ss(seg(t, TL.WALK1, TL.TOUCH_B)) : null;
  const face = 1;
  iso.keep = true;
  const H = oss(iso, x, y, t, { moving: mv, face, arm: touchA ?? touchB ?? undefined });
  iso.keep = false;
  // the coral trail of the hand: world positions sampled along the path up to now (drawn as a dashed coral line)
  const trail = []; for (let q = TL.WALK0; q <= Math.min(t, TL.WALK1 + .6); q += .1) { const [px, py] = path(q, HOOK_PATH); trail.push([px, py]); }
  iso.flush();
  if (trail.length > 1) {
    g.save(); g.strokeStyle = CORAL; g.lineWidth = 4; g.setLineDash([2, 12]); g.lineCap = 'round'; g.beginPath();
    trail.forEach(([px, py], i) => { const [sx, sy] = iso.P(px, py, 0); const k = iso.cam.k; const X = sx + H.dx * k, Y = sy + (-.6 * 3.4 + Math.cos(.25) * .34 * 3.4) * k; i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
    g.stroke(); g.restore();
  }
  const [hx, hy] = handScreen(iso, H);
  const k = iso.cam.k, gr = clamp(k / 160) * 10 + 5;
  if (t > TL.TOUCH_A) for (let i = 0; i < 4; i++) { const a = clamp((t - TL.TOUCH_A - i * .12) * 4) * (1 - clamp((t - TL.TOUCH_B - .3) * 1.5) * .5); germ(g, hx + Math.cos(i * 1.7) * gr * 1.4, hy + Math.sin(i * 1.7) * gr * 1.1, gr * .55 * back(clamp(a), 2.2)); }
  ring(g, hx, hy, 18 + k * .35, clamp((t - TL.PUSH0) * 2), t, t > TL.PUSH1 - .6 ? 'LE MANI' : null, { color: INK, ts: 30 });
  title(g, 'IGIENE DELLE MANI', 96, 120, seg(t, 1.2, 2.4) * (1 - seg(t, 7.2, 7.8)), { sub: 'per operatori socio-sanitari' });
}

// 2 — the number: 100 avoidable infections, up to 50 prevented
function numberBoard(g, iso, t) {
  iso.cam = camAt(t, CAM_NUM);
  const z = boardZ(t, TL.NUM0, TL.READY0 - .01 + 10);
  iso.box(-7, -7, z - 1.2, 14, 14, 1.2, T.plinth, { cull: false, layer: -2 });
  iso.box(-7, -7, z - 2.0, 14, 14, .8, T.slab1, { cull: false, layer: -2 });
  for (let i = 0; i < 100; i++) {
    const c = i % 10, r = (i / 10) | 0, flipT = i < 50 ? TL.ICONS[(c * 5 + Math.floor(r / 2)) % 50] : 1e9;  // the 50 flip in a sweep
    const f = clamp((t - flipT) * 6), hop = Math.sin(clamp((t - flipT) * 3) * Math.PI) * .9;
    const tone = f > .5 ? T.teal : T.coral;
    iso.box(-6.1 + c * 1.22, -6.1 + r * 1.22, z + hop, .85, .85, .85 * (1 + .25 * Math.sin(f * Math.PI)), tone);
  }
  iso.flush();
  const n = TL.ICONS.filter(q => t >= q).length;
  const [ax, ay] = iso.P(-6.1, -6.1, z + 1);
  const a1 = seg(t, TL.NUM0 + .6, TL.NUM0 + 1.6);
  pin(iso, -5.7, -5.7, z + .9, { title: '100 INFEZIONI EVITABILI', dir: -1, up: 70, len: 60, a: a1, ts: 26 });
  if (a1 > .6) { const [px, py] = iso.P(-5.7, -5.7, z + .9); note('p100', '100 INFEZIONI EVITABILI', px - 480, py - 110, px, py - 50); }
  // the counter, big, to the right
  const a2 = seg(t, TL.ICON0, TL.ICON0 + .5);
  if (a2 > 0) {
    g.save(); g.globalAlpha = a2; const x = 1390, y = 420;
    haloText(g, 'FINO AL', x, y - 96, { font: '600 30px Jost', track: 5 });
    haloText(g, `${n}`, x, y + 40, { font: '400 170px Jost', color: TEAL });
    g.font = '400 170px Jost'; const w = g.measureText(`${n}`).width;
    haloText(g, '%', x + w + 8, y + 40, { font: '500 84px Jost', color: TEAL });
    haloText(g, "SI PREVIENE CON L'IGIENE", x, y + 104, { font: '600 28px Jost', track: 4 });
    haloText(g, 'DELLE MANI', x, y + 142, { font: '600 28px Jost', track: 4 });
    haloText(g, 'Fonte: OMS', x, y + 196, { font: '400 24px Jost', color: '#5B5866' });
    g.restore();
    note('cnt', "FINO AL 50% SI PREVIENE CON L'IGIENE DELLE MANI Fonte: OMS", x, y - 130, x + 520, y + 200);
  }
}

// 3 — hands ready: rules as objects that leave the hand
function ready(g, iso, t) {
  iso.cam = camAt(t, CAM_READY);
  const z = boardZ(t, TL.READY0 + .1, null);
  iso.desat = .85;
  room(iso, t, { germA: () => 0, germB: () => 0 }, { z });
  const H = oss(iso, 16.8, 1.2, t, { z, face: -1 });
  iso.flush(); iso.desat = 0;
  const [hx, hy] = handScreen(iso, H);
  const a = seg(t, TL.READY0 + .8, TL.READY0 + 1.8);
  inset(iso, hx, hy, 980, 470, 360, a, (g2, cx, cy, R) => readyInset(g2, cx, cy, R, t));
  title(g, 'MANI PRONTE', 96, 120, seg(t, TL.READY0 + 1.2, TL.READY0 + 2.2));
}
function readyInset(g, cx, cy, R, t) {
  g.fillStyle = '#F4F5F7'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  const C = c => c, s = R * .42;
  const gl = ss(seg(t, TL.GLOVE, TL.GLOVE + .8));
  // the hand (back), fingers up, slightly left; moves left when the glove arrives
  const hxp = cx - gl * R * .38, hyp = cy + R * .12;
  const nails = 1 - ss(seg(t, TL.NAILS, TL.NAILS + .5)), pol = mix(MUST, '#F3D9CC', ss(seg(t, TL.NAILS, TL.NAILS + .5)));
  g.save(); g.translate(hxp, hyp); g.scale(s * (1 - gl * .25), s * (1 - gl * .25)); g.rotate(-.12);
  hand(g, { palm: false, nails, polish: hex(pol), arm: 1.9, sleeve: NAVY, wrist: (g2) => {
    const w = 1 - clamp((t - TL.WATCH) * 3); if (w > 0) { g2.save(); g2.globalAlpha = 1; watchItem(g2, C, 0, .95); g2.restore(); }
    const b = 1 - clamp((t - TL.BRACELET) * 3); if (b > 0) braceletItem(g2, C, 0, .68);
  } });
  if (t < TL.RING + .05) ringItem(g, C, -.11, -.62, .14);
  g.restore();
  // items flying out to a tray (arcs with back-ease landing)
  const tray = [cx + R * .48, cy + R * .58];
  const fly = (t0, from, draw) => { const u = seg(t, t0, t0 + .6); if (u <= 0) return; const x = lerp(from[0], tray[0], eo(u)), y = lerp(from[1], tray[1], u) - Math.sin(u * Math.PI) * R * .35; g.save(); g.translate(x, y); g.scale(s * .8, s * .8); draw(); g.restore(); };
  if (gl < .5) {
    g.save(); const T3 = tri('#C9CFD7'); g.beginPath(); g.ellipse(tray[0], tray[1] + 10, R * .2, R * .07, 0, 0, TAU); g.fillStyle = T3[2]; g.fill(); g.beginPath(); g.ellipse(tray[0], tray[1], R * .2, R * .07, 0, 0, TAU); g.fillStyle = T3[0]; g.fill(); g.restore();
    fly(TL.RING, [hxp - s * .1, hyp - s * .62], () => ringItem(g, C, 0, 0, .14));
    fly(TL.BRACELET, [hxp, hyp + s * .68], () => braceletItem(g, C, 0, 0));
    fly(TL.WATCH, [hxp, hyp + s * .95], () => watchItem(g, C, 0, 0));
    // labels
    const la = seg(t, TL.NAILS - .3, TL.NAILS + .4), lb = seg(t, TL.RING - .3, TL.RING + .4);
    if (la > 0) { g.save(); g.globalAlpha = la; haloText(g, 'UNGHIE CORTE', cx - R * .72, cy - R * .5, { font: '600 26px Jost', track: 3 }); haloText(g, 'SENZA SMALTO', cx - R * .72, cy - R * .5 + 34, { font: '600 26px Jost', track: 3 }); g.restore(); if (la > .5) note('nails', 'UNGHIE CORTE SENZA SMALTO', cx - R * .72, cy - R * .58, cx - R * .1, cy - R * .38); }
    if (lb > 0) { g.save(); g.globalAlpha = lb; haloText(g, 'NO ANELLI', tray[0] - R * .2, tray[1] - R * .5, { font: '600 26px Jost', track: 3 }); haloText(g, 'BRACCIALI', tray[0] - R * .2, tray[1] - R * .5 + 34, { font: '600 26px Jost', track: 3 }); haloText(g, 'OROLOGIO', tray[0] - R * .2, tray[1] - R * .5 + 68, { font: '600 26px Jost', track: 3 }); g.restore(); if (lb > .5) note('items', 'NO ANELLI BRACCIALI OROLOGIO', tray[0] - R * .2, tray[1] - R * .6, tray[0] + R * .3, tray[1] - R * .2); }
  } else {
    // glove ≠ hand hygiene
    const gx = cx + R * .05, gy = cy + R * .12;
    g.save(); g.translate(gx - R * .05, gy); g.scale(s * .75, s * .75); g.rotate(.1); hand(g, { palm: false, glove: '#8FA2BE', arm: 1.6 }); g.restore();
    const ne = back(seg(t, TL.NOTEQ, TL.NOTEQ + .5), 2);
    if (ne > 0) {
      g.save(); g.translate(cx + R * .36, cy - R * .02); g.scale(ne, ne); g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-34, -14); g.lineTo(34, -14); g.moveTo(-34, 14); g.lineTo(34, 14); g.moveTo(18, -38); g.lineTo(-18, 38); g.stroke(); g.restore();
      drop(g, cx + R * .68, cy - R * .02, 50 * ne, TEAL);
    }
    const la = seg(t, TL.GLOVE, TL.GLOVE + .5);
    if (la > 0) { g.save(); g.globalAlpha = la; haloText(g, 'I GUANTI NON SOSTITUISCONO', cx - R * .62, cy - R * .62, { font: '600 26px Jost', track: 3 }); haloText(g, "L'IGIENE DELLE MANI", cx - R * .62, cy - R * .62 + 34, { font: '600 26px Jost', track: 3 }); g.restore(); if (la > .5) note('glove', "I GUANTI NON SOSTITUISCONO L'IGIENE DELLE MANI", cx - R * .62, cy - R * .7, cx + R * .4, cy - R * .5); }
  }
}

// 4 — five moments in the patient zone
function momentsState(t) {
  const [x, y, mv, dir] = path(t, MOM_PATH);
  let arm, face = dir < 0 ? -1 : 1;
  if (!mv) face = x > 9 ? -1 : 1;
  const rubbing = RUBS.some(([a, b]) => t >= a && t <= b);
  if (rubbing) arm = 1.3 + Math.sin(t * 18) * .12;
  if (t > TL.M2 + 1.6 && t < 45.6) { arm = 2.4 + Math.sin(t * 7) * .15; face = -1; }   // oral care: reaching to the head
  if (t > 46.6 && t < 48.6) { arm = .9 + Math.sin(t * 5) * .1; face = 1; }             // emptying the bag (low)
  if (t > 51.2 && t < 52.4) { arm = 1.5; face = -1; }                                  // touching the arm
  if (t > 56.5 && t < 57.3) { arm = 1.6; face = -1; }                                  // touching the bedside table
  return { x, y, mv, arm, face, rubbing };
}
function moments(g, iso, t) {
  iso.cam = camAt(t, CAM_MOM);
  const S = momentsState(t);
  room(iso, t, { lit: (tt, w) => 0, cup: tt => ss(seg(tt, 56.6, 57.1)) });
  // patient zone plate (decal) + dashed boundary
  const zA = ss(seg(t, TL.ZONE0 + 1.2, TL.ZONE1));
  if (zA > 0) iso.flat(ZONE, .01, '#D6CFEE', { a: zA, depth: -950 });
  const H = oss(iso, S.x, S.y, t, { moving: S.mv, face: S.face, arm: S.arm });
  iso.flush();
  const zl = seg(t, TL.ZONE0, TL.ZONE0 + 1.6);
  if (zl > 0) { const pts = [...ZONE, ZONE[0]].map(p => iso.P(p[0], p[1], .02)); cutLine(g, pts, zl, { color: '#6E5FB0', lw: 3, dash: [14, 9] }); }
  const zp = seg(t, TL.ZONE0 + 1.0, TL.ZONE0 + 2.4);
  if (zp > 0) { const [px, py] = iso.P(0.6, 19.4, 0); g.save(); g.globalAlpha = zp; haloText(g, 'ZONA PAZIENTE', px - 40, py + 44, { font: '600 26px Jost', track: 4, color: '#5A4C9C' }); g.restore(); if (zp > .5) note('zone', 'ZONA PAZIENTE', px - 40, py + 20, px + 200, py + 50); }
  const [hx, hy] = handScreen(iso, H);
  const ri = RUBS.findIndex(([a, b]) => t >= a - .1 && t <= b + .3);
  if (ri >= 0) { const [a, b] = RUBS[ri]; rubRing(g, hx, hy, t, seg(t, a - .1, a + .2) * (1 - seg(t, b, b + .3)), 22 + iso.cam.k * .3); }
  // germs on the hand after touching (moment 3, 4, 5 stories), cleaned by the next rub
  // pins accumulate: the room becomes the infographic
  MOMENTS.forEach((m, i) => {
    const a = seg(t, m.t, m.t + 1.2);
    if (a <= 0) return;
    const P = m.at;
    pinN(g, iso, P, m, a, `m${i}`);
  });
  title(g, 'I 5 MOMENTI', 96, 120, seg(t, TL.ZONE0, TL.ZONE0 + 1));
  if (t > TL.M2 + 1.6 && t < 45.6) { const [sx, sy] = iso.P(1.75, 14.2, 2.4); swab(g, sx, sy - 10, iso.cam.k * .02, seg(t, TL.M2 + 1.6, TL.M2 + 2)); }
  if (t > 46.6 && t < 48.8) { const [sx, sy] = iso.P(5.6, 16.1, 0.1); for (let i = 0; i < 4; i++) { const u = ((t * 2 + i / 4) % 1); drop(g, sx + 30, sy - 30 + u * 40, 6, '#D9C77A', 1 - u); } }
}
function swab(g, x, y, s, a) { if (a <= 0) return; g.save(); g.globalAlpha = a; g.strokeStyle = '#7E8897'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 40, y + 30); g.lineTo(x + 6, y + 4); g.stroke(); g.beginPath(); g.arc(x + 4, y + 2, 8, 0, TAU); g.fillStyle = '#F6F3EE'; g.fill(); g.restore(); }
function pinN(g, iso, P, m, a, id) { // numbered moment pin: mustard number chip + title + sub
  const [ax, ay] = iso.P(P[0], P[1], P[2]); const up = m.up, dir = m.dir, len = 70;
  const s1 = eo(seg(a, 0, .2)), s2 = eo(seg(a, .12, .45)), s3 = eo(seg(a, .38, .58)), s4 = seg(a, .5, 1);
  g.save(); g.strokeStyle = INK; g.lineWidth = 2.2; g.lineCap = 'round';
  if (s2 > 0) { g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax, ay - up * s2); if (s3 > 0) g.lineTo(ax + dir * len * s3, ay - up); g.stroke(); }
  const R = 7 * back(s1, 2.2); g.beginPath(); g.arc(ax, ay, Math.max(0, R), 0, TAU); g.fillStyle = PAL.paper; g.fill(); g.stroke(); g.beginPath(); g.arc(ax, ay, Math.max(0, R * .42), 0, TAU); g.fillStyle = INK; g.fill();
  if (s4 > 0) {
    const tx = ax + dir * (len + 30), ty = ay - up, cr = 24 * back(seg(a, .5, .75), 2.4);
    g.beginPath(); g.arc(tx, ty, Math.max(0, cr), 0, TAU); g.fillStyle = MUST; g.fill(); g.lineWidth = 2; g.stroke();
    if (cr > 10) haloText(g, m.n, tx, ty + 11, { font: '600 32px Jost', align: 'center', halo: false, color: INK });
    g.save(); g.beginPath(); const wv = 520 * ss(seg(a, .6, 1)); if (dir > 0) g.rect(tx + 30, ty - 40, wv, 100); else g.rect(tx - 30 - wv, ty - 40, wv, 100); g.clip();
    const al = dir > 0 ? 'left' : 'right', x = tx + dir * 36;
    haloText(g, m.title, x, ty - 2, { font: '600 25px Jost', track: 3, align: al });
    haloText(g, m.sub, x, ty + 28, { font: '400 24px Jost', track: 1, align: al });
    g.restore();
    if (a > .7) { g.font = '600 25px Jost'; const w = g.measureText(m.title).width + 40; note(id, m.n + ' ' + m.title + ' ' + m.sub, dir > 0 ? tx - 24 : tx - 36 - w, ty - 28, dir > 0 ? tx + 36 + w : tx + 24, ty + 36); }
  }
  g.restore();
}

// 5 — the alcohol rub: inset with the six motions and a 20–30 s timer
function rub(g, iso, t) {
  iso.cam = camAt(t, CAM_RUB);
  iso.desat = ss(seg(t, TL.RUB0, TL.RUB0 + 1.2)) * .85;
  room(iso, t, {});
  iso.flat(ZONE, .01, '#D6CFEE', { a: 1, depth: -950 });
  const H = oss(iso, 11.2, 18.8, t, { face: -1, arm: 1.3 + Math.sin(t * 18) * .12 });
  iso.flush(); iso.desat = 0;
  const [hx, hy] = handScreen(iso, H);
  rubRing(g, hx, hy, t, seg(t, TL.RUB0, TL.RUB0 + .4), 40);
  const a = seg(t, TL.RUB0 + .6, TL.RUB0 + 1.6), cx = 1240, cy = 450, R = 360;
  inset(iso, hx, hy, cx, cy, R, a, (g2, x, y, r) => rubInset(g2, x, y, r, t));
  title(g, 'FRIZIONE IDROALCOLICA', 96, 120, seg(t, TL.RUB0 + .8, TL.RUB0 + 1.8), { sub: '' });
  timer(g, 300, 470, 110, t, TL.GEL, TL.RUB_END, '20–30', 's', TEAL, seg(t, TL.GEL - .4, TL.GEL));
}
function rubInset(g, cx, cy, R, t) {
  g.fillStyle = '#F4F5F7'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  const C = c => c, s = R * .34;
  if (t < TL.STEPS0) { // the gel into the cupped palm
    g.save(); g.translate(cx, cy + R * .12); g.scale(s * 1.2, s * 1.2); hand(g, { palm: true, curl: .25, arm: 1.6, sleeve: NAVY }); g.restore();
    const u = seg(t, TL.GEL, TL.GEL + .8), py = lerp(cy - R * .8, cy + R * .02, eo(u));
    if (u > 0 && u < 1) drop(g, cx, py, 22, TEAL);
    const pud = seg(t, TL.GEL + .7, TL.GEL + 1.0); if (pud > 0) { const T3 = tri(TEAL); g.beginPath(); g.ellipse(cx - 6, cy + R * .06, 70 * pud, 34 * pud, -.1, 0, TAU); g.fillStyle = T3[0]; g.fill(); g.beginPath(); g.ellipse(cx - 20, cy + R * .04, 30 * pud, 12 * pud, -.1, 0, TAU); g.fillStyle = '#BFE6E1'; g.fill(); }
    const la = seg(t, TL.GEL + .5, TL.GEL + 1.0); if (la > 0) { g.save(); g.globalAlpha = la; haloText(g, 'UNA DOSE NEL PALMO', cx, cy - R * .62, { font: '600 26px Jost', track: 3, align: 'center' }); g.restore(); if (la > .5) note('dose', 'UNA DOSE NEL PALMO', cx - 160, cy - R * .7, cx + 160, cy - R * .55); }
    return;
  }
  const i = Math.min(5, Math.floor((t - TL.STEPS0) / TL.STEP)), u = (t - TL.STEPS0 - i * TL.STEP) / TL.STEP;
  // a short slide between steps (the inset content changes on the beat with a 0.15 s push)
  const sl = 1 - eo(seg(u, 0, .12));
  g.save(); g.translate(cx + sl * 60, cy + R * .1); g.scale(s, s);
  rubStep(g, i, u, C, { sleeve: NAVY });
  rubArrows(g, i, seg(u, .1, .3));
  g.restore();
  // step number + name
  const T3 = tri(TEAL); g.beginPath(); g.arc(cx - R * .55, cy - R * .62, 26, 0, TAU); g.fillStyle = T3[1]; g.fill();
  haloText(g, `${i + 1}`, cx - R * .55, cy - R * .62 + 11, { font: '600 32px Jost', align: 'center', halo: false, color: '#FFFFFF' });
  haloText(g, RUB_NAMES[i], cx - R * .55 + 40, cy - R * .62 + 10, { font: '600 26px Jost', track: 3 });
  note('step', RUB_NAMES[i], cx - R * .55 - 26, cy - R * .62 - 26, cx + R * .5, cy - R * .62 + 26, true);
}
function timer(g, x, y, r, t, t0, t1, num, unit, c, a) { // a gauge that fills from t0 to t1
  if (a <= 0) return; const u = seg(t, t0, t1); const T3 = tri(c);
  g.save(); g.globalAlpha = a;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = PAL.paper; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  g.beginPath(); g.moveTo(x, y); g.arc(x, y, r - 10, -Math.PI / 2, -Math.PI / 2 + u * TAU); g.closePath(); g.fillStyle = T3[0]; g.fill();
  g.beginPath(); g.arc(x, y, r * .62, 0, TAU); g.fillStyle = PAL.paper; g.fill();
  for (let i = 0; i < 12; i++) { const q = i / 12 * TAU; g.beginPath(); g.moveTo(x + Math.cos(q) * (r - 2), y + Math.sin(q) * (r - 2)); g.lineTo(x + Math.cos(q) * (r - 12), y + Math.sin(q) * (r - 12)); g.stroke(); }
  haloText(g, num, x, y + 8, { font: '500 40px Jost', align: 'center', halo: false });
  haloText(g, unit === 's' ? 'secondi' : unit, x, y + 40, { font: '400 22px Jost', align: 'center', halo: false });
  g.restore();
  if (a > .5) note('timer' + num, num + ' secondi', x - r, y - r, x + r, y + r);
}

// 6 — soap and water: the sink board
function sink(iso, t, z) {
  iso.box(-7, -6, z - 1.2, 14, 12, 1.2, T.floor, { cull: false, layer: -2 });
  iso.box(-7, -6, z - 2.0, 14, 12, .8, T.slab1, { cull: false, layer: -2 });
  iso.box(-7.5, -6, z - 2.0, .5, 12, 9.5, T.wall, { cull: false, layer: -1 });
  // tiled splash-back
  iso.add(0, () => { for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) { const P = (y, zz) => iso.P(-6.99, y, z + zz); const y0 = -4.6 + c * .9, z0 = 2.2 + r * .9; iso.poly([P(y0 + .04, z0 + .04), P(y0 + .86, z0 + .04), P(y0 + .86, z0 + .86), P(y0 + .04, z0 + .86)], (r + c) % 2 ? '#E7EDF3' : '#DCE5EE'); } }, -.5);
  // cabinet + basin
  iso.box(-7, -3, z, 3, 6, 2.9, T.white);
  iso.box(-6.6, -2.4, z + 2.6, 2.2, 4.8, .3, tri('#D9DEE4'), { bias: 1 });
  // faucet
  iso.box(-6.9, -.25, z + 2.9, .5, .5, 1.3, T.steel);
  iso.box(-6.9, -.25, z + 4.0, 1.5, .5, .3, T.steel);
  const lever = ss(seg(t, TL.TAP_ON - .3, TL.TAP_ON)) - ss(seg(t, TL.TAP_OFF - .2, TL.TAP_OFF + .2));
  iso.box(-6.9, -.15 - lever * .3, z + 4.3, .4, .3, .5, T.steel);
  // soap dispenser (water blue = soap and water), towel dispenser (white), bin
  iso.box(-7, 2.2, z + 4.6, .5, .9, 1.4, T.water);
  iso.box(-7, -5.4, z + 4.2, .5, 2.0, 2.2, T.white);
  iso.box(-6.5, -4.6, z + 4.1, .05, .8, .25, tri('#FFFFFF'));
  iso.cyl(-5.8, 4.6, z, .7, 1.8, T.steel);
}
function wash(g, iso, t) {
  iso.cam = camAt(t, CAM_WASH);
  const z = boardZ(t, TL.WASH0, TL.WASH_END - .01 + 10);
  sink(iso, t, z);
  const water = seg(t, TL.TAP_ON, TL.TAP_ON + .2) * (1 - seg(t, TL.TAP_OFF, TL.TAP_OFF + .2));
  const H = oss(iso, -3.3, .6, t, { z, face: -1, arm: 1.5 + (t > TL.SOAP && t < TL.RINSE ? Math.sin(t * 16) * .12 : 0) });
  iso.flush();
  if (water > 0) { const [sx, sy] = iso.P(-5.5, 0, z + 3.95), [ex, ey] = iso.P(-5.5, 0, z + 2.85); g.save(); g.strokeStyle = tri(WATER)[0]; g.lineWidth = iso.cam.k * .16 * water; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke(); g.restore(); }
  const [hx, hy] = handScreen(iso, H);
  const a = seg(t, TL.WASH0 + .9, TL.WASH0 + 1.9), cx = 1240, cy = 450, R = 360;
  inset(iso, hx, hy, cx, cy, R, a, (g2, x, y, r) => washInset(g2, x, y, r, t, water));
  title(g, 'ACQUA E SAPONE', 96, 120, seg(t, TL.WASH0 + .8, TL.WASH0 + 1.8), { chip: WATER });
  // when: two chips
  const wa = seg(t, VO.L14 + .6, VO.L14 + 1.4);
  if (wa > 0) { g.save(); g.globalAlpha = wa * (1 - seg(t, VO.L15, VO.L15 + .4)); haloText(g, 'MANI VISIBILMENTE SPORCHE', 96, 210, { font: '600 25px Jost', track: 3 }); haloText(g, 'DOPO IL BAGNO', 96, 250, { font: '600 25px Jost', track: 3 }); g.restore(); if (wa > .5 && t < VO.L15) note('when', 'MANI VISIBILMENTE SPORCHE DOPO IL BAGNO', 96, 185, 540, 260); }
  timer(g, 300, 520, 110, t, TL.TAP_ON, TL.TAP_OFF, '40–60', 's', WATER, seg(t, TL.TAP_ON - .4, TL.TAP_ON));
  washSteps(g, t);
}
const WASH_STEPS = ['BAGNA', 'SAPONE', 'STROFINA', 'RISCIACQUA', 'ASCIUGA', 'CHIUDI'];
const WASH_T = [TL.TAP_ON, TL.SOAP, TL.SOAP + .6, TL.RINSE, TL.DRY, TL.TAP_OFF];
function washSteps(g, t) { // a numbered row at the bottom-left (above the subtitle zone)
  const x0 = 96, y = 800;
  WASH_STEPS.forEach((s, i) => {
    const a = seg(t, WASH_T[i], WASH_T[i] + .4); const on = a > 0, cur = on && (i === 5 || t < WASH_T[i + 1]);
    const x = x0 + i * 186;
    g.save(); g.globalAlpha = on ? 1 : .35;
    const T3 = tri(on ? WATER : '#C9CFD7'); const r = 16 * (cur ? 1 + .15 * back(a, 2) - .15 : 1);
    g.beginPath(); g.arc(x + 16, y, r, 0, TAU); g.fillStyle = T3[1]; g.fill();
    haloText(g, `${i + 1}`, x + 16, y + 7, { font: '600 20px Jost', align: 'center', halo: false, color: '#FFFFFF' });
    haloText(g, s, x + 40, y + 8, { font: `${cur ? 600 : 500} 21px Jost`, track: 2 });
    if (i < 5) { g.strokeStyle = INK; g.lineWidth = 1.5; g.setLineDash([3, 5]); g.beginPath(); g.moveTo(x + 150, y); g.lineTo(x + 176, y); g.stroke(); }
    g.restore();
  });
  if (t > TL.TAP_ON + .4) note('wsteps', WASH_STEPS.join(' '), x0, y - 20, x0 + 6 * 186, y + 20, true);
}
function washInset(g, cx, cy, R, t, water) {
  g.fillStyle = '#F2F6FA'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  const s = R * .34, C = c => c;
  // water stream from the top
  if (water > 0) { const T3 = tri(WATER); g.fillStyle = T3[0]; g.fillRect(cx - 18 * water, cy - R, 36 * water, R * .8); for (let i = 0; i < 10; i++) { const u = ((t * 1.7 + i * .37) % 1); drop(g, cx + Math.sin(i * 7.1) * 120, cy - R * .1 + u * R * .9, 9, WATER, (1 - u) * water); } }
  const lather = seg(t, TL.SOAP + .3, TL.SOAP + 1) * (1 - seg(t, TL.RINSE, TL.RINSE + 1.2));
  if (t < TL.DRY) {
    const rubbing = t > TL.SOAP + .4 && t < TL.RINSE;
    g.save(); g.translate(cx, cy + R * .15); g.scale(s, s);
    if (rubbing) { const k = Math.floor((t - TL.SOAP - .4) / .7) % 6, u = ((t - TL.SOAP - .4) / .7) % 1; rubStep(g, k, u, C, { sleeve: NAVY }); }
    else { hand(g, { palm: true, arm: 1.4, sleeve: NAVY }); }
    g.restore();
    if (t > TL.SOAP && t < TL.SOAP + .8) drop(g, cx - 10, lerp(cy - R * .7, cy, eo(seg(t, TL.SOAP, TL.SOAP + .6))), 20, WATER);
    if (lather > 0) for (let i = 0; i < 16; i++) { const q = hash(i) * TAU, rr = hash(i + 9) * R * .45; g.beginPath(); g.arc(cx + Math.cos(q) * rr, cy + R * .05 + Math.sin(q) * rr * .7, (8 + hash(i + 3) * 12) * lather, 0, TAU); g.fillStyle = 'rgba(255,255,255,.85)'; g.fill(); g.strokeStyle = 'rgba(76,143,214,.35)'; g.lineWidth = 1.5; g.stroke(); }
  } else {
    // towel: dry, then close the tap with it
    const closing = seg(t, TL.TAP_OFF - .5, TL.TAP_OFF + .3);
    g.save(); g.translate(cx - closing * R * .1, cy + R * .2 - closing * R * .35); g.scale(s, s); hand(g, { palm: false, arm: 1.5, sleeve: NAVY }); g.restore();
    const T3 = tri('#FFFFFF', .05, .12); g.save(); g.translate(cx + 10 - closing * R * .1, cy + R * .02 - closing * R * .35); g.rotate(-.2);
    g.fillStyle = T3[2]; g.fillRect(-R * .22 + 6, -R * .14 + 8, R * .44, R * .28); g.fillStyle = T3[0]; g.fillRect(-R * .22, -R * .14, R * .44, R * .28); g.strokeStyle = '#C9D4E0'; g.lineWidth = 2; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-R * .22 + i * R * .11, -R * .14); g.lineTo(-R * .22 + i * R * .11, R * .14); g.stroke(); } g.restore();
    // the tap lever at the top
    const lv = closing; g.save(); g.translate(cx - R * .05, cy - R * .62); const S3 = tri(STEEL); g.fillStyle = S3[1]; g.fillRect(-90, -18, 180, 36); g.fillStyle = S3[0]; g.fillRect(-90, -18, 180, 12); g.rotate(-.5 + lv * .5); g.fillStyle = S3[2]; g.fillRect(-12, -80, 24, 70); g.restore();
    const la = seg(t, TL.DRY + .2, TL.DRY + .6); if (la > 0) { g.save(); g.globalAlpha = la; haloText(g, 'CHIUDI CON LA SALVIETTA', cx, cy + R * .78, { font: '600 26px Jost', track: 3, align: 'center' }); g.restore(); if (la > .5) note('towel', 'CHIUDI CON LA SALVIETTA', cx - 200, cy + R * .7, cx + 200, cy + R * .85); }
  }
}

// 7 — finale: the same walk, cut at the dispenser; pull out over the ward; the legend
function finale(g, iso, t) {
  iso.cam = camAt(t, CAM_FIN);
  const z = boardZ(t, TL.FIN0, null);
  const [x, y, mv] = path(t, FIN_PATH);
  const lit = (tt, w) => w === 'wall' ? seg(tt, TL.FIN_GEL, TL.FIN_GEL + .3) : 0;
  room(iso, t, { germA: () => 1, germB: () => 0, lit }, { z });
  // the ward: five more rooms appear as the camera pulls out (low detail)
  const ward = [[24, 0], [48, 0], [0, 24], [24, 24], [48, 24]];
  ward.forEach(([ox, oy], i) => { const a = seg(iso.cam.k, 30, 18); if (a <= 0) return; iso.push(ox, oy, 0); room(iso, t, { germA: () => 0, germB: () => 0 }, { z: -26 * (1 - back(a, 1.3)), detail: false }); iso.pop(); });
  const rubbing = t > TL.FIN_GEL && t < TL.FIN_WALK1;
  const H = oss(iso, x, y, t, { z, moving: mv, face: 1, arm: t < TL.FIN_WALK0 ? 1.2 : rubbing ? 1.3 + Math.sin(t * 18) * .12 : undefined });
  iso.flush();
  const [hx, hy] = handScreen(iso, H);
  const k = iso.cam.k, gr = clamp(k / 160) * 10 + 4;
  const clean = seg(t, TL.FIN_GEL + .2, TL.FIN_GEL + 1.0);
  for (let i = 0; i < 4; i++) germ(g, hx + Math.cos(i * 1.7) * gr * 1.4, hy + Math.sin(i * 1.7) * gr * 1.1, gr * .55 * (1 - eo(clean)) * clamp((t - TL.FIN0 - .2) * 3));
  if (rubbing) rubRing(g, hx, hy, t, seg(t, TL.FIN_GEL, TL.FIN_GEL + .3) * (1 - seg(t, TL.FIN_WALK1 - .3, TL.FIN_WALK1)), 20 + k * .3);
  // the coral trail stops at the dispenser: a short dashed coral line, then an ink stop mark
  const trail = []; for (let q = TL.FIN_WALK0; q <= Math.min(t, TL.FIN_GEL); q += .1) { const [px, py] = path(q, FIN_PATH); trail.push(iso.P(px, py, z)); }
  if (trail.length > 1 && iso.cam.k > 30) { g.save(); g.strokeStyle = CORAL; g.lineWidth = 4; g.setLineDash([2, 12]); g.lineCap = 'round'; g.beginPath(); trail.forEach(([sx, sy], i) => { const X = sx + H.dx * k, Y = sy + (-.6 * 3.4 + Math.cos(.25) * .34 * 3.4) * k; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke(); g.restore(); }
  // dispensers lighting up across the ward (one note each)
  [[0, 0], ...ward].forEach(([ox, oy], i) => { const a = seg(t, TL.LIGHTS[i], TL.LIGHTS[i] + .4); if (a <= 0) return; const [sx, sy] = iso.P(ox + DISP_WALL[0] + .2, oy + DISP_WALL[1], DISP_WALL[2] + .6); g.save(); g.globalAlpha = a; g.strokeStyle = TEAL; g.lineWidth = 3; g.beginPath(); g.arc(sx, sy, 8 + 18 * eo(a), 0, TAU); g.stroke(); g.restore(); drop(g, sx, sy - 30 - 10 * eo(a), 10, TEAL, a); });
  legend(g, t);
}
function legend(g, t) {
  const a = seg(t, TL.CARD, TL.CARD + 1.2); if (a <= 0) return;
  const x = 96, y = 150;
  title(g, 'MANI PULITE, CURA SICURA', x, y, a, { size: 40 });
  const items = ['Prima del contatto col paziente', 'Prima di una manovra pulita o asettica', 'Dopo il rischio di esposizione a liquidi biologici', 'Dopo il contatto col paziente', "Dopo il contatto con l'ambiente attorno al paziente"];
  items.forEach((s, i) => {
    const b = seg(t, TL.CARD + .4 + i * .3, TL.CARD + .9 + i * .3); if (b <= 0) return;
    const yy = y + 80 + i * 52; g.save(); g.globalAlpha = b;
    g.beginPath(); g.arc(x + 16, yy - 9, 17 * back(b, 2), 0, TAU); g.fillStyle = MUST; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke();
    haloText(g, `${i + 1}`, x + 16, yy, { font: '600 22px Jost', align: 'center', halo: false });
    haloText(g, s, x + 46, yy, { font: '500 26px Jost' });
    g.restore();
  });
  const c = seg(t, TL.CARD + 2.2, TL.CARD + 2.8);
  if (c > 0) {
    g.save(); g.globalAlpha = c; const yy = y + 80 + 5 * 52 + 16;
    drop(g, x + 16, yy - 10, 14, TEAL); haloText(g, 'Gel idroalcolico  20–30 s', x + 46, yy, { font: '500 26px Jost' });
    drop(g, x + 16, yy + 38, 14, WATER); haloText(g, 'Acqua e sapone  40–60 s', x + 46, yy + 48, { font: '500 26px Jost' });
    haloText(g, 'Fonte: OMS, «I 5 momenti per l’igiene delle mani»', x, yy + 110, { font: '400 21px Jost', color: '#5B5866' });
    g.restore();
  }
  if (a > .5) note('legend', 'MANI PULITE, CURA SICURA ' + items.join(' '), x, y - 40, x + 760, y + 560, true);
}

// ---------- subtitles: a map label, bottom centre ----------
function wrap(g, s, max) {
  if (g.measureText(s).width > max) { const w = s.split(' '); let best = null; for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '); const m = Math.max(g.measureText(a).width, g.measureText(b).width); if (m <= max && (!best || m < best[0])) best = [m, a, b]; } if (best) return [best[1], best[2]]; } const w = s.split(' '); const L = []; let cur = ''; for (const x of w) { const n = cur ? cur + ' ' + x : x; if (g.measureText(n).width > max && cur) { L.push(cur); cur = x; } else cur = n; } if (cur) L.push(cur); return L; }
function subtitle(g, t) {
  const S = SUBS.find(s => t >= s.t0 && t < s.t1); if (!S) return;
  const txt = SUBTEXT[S.id]; g.save(); g.font = '500 40px Jost';
  const L = wrap(g, txt, 1380), lh = 52, w = Math.max(...L.map(l => g.measureText(l).width)) + 110, h = L.length * lh + 34;
  const x = 960 - w / 2, y = 1080 - 56 - h;
  const ain = seg(t, S.t0, S.t0 + .2), aout = seg(t, S.t1 - .25, S.t1), dy = aout * 8;
  g.globalAlpha = 1 - aout; g.translate(0, dy);
  plate(g, x, y, w, h, 10); g.fillStyle = PAL.paper; g.fill();
  g.save(); g.beginPath(); g.rect(x - 4, y - 4, (w + 8) * eo(ain), h + 8); g.clip(); plate(g, x, y, w, h, 10); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); g.restore();
  const cx = x + 36, cy = y + h / 2, T3 = tri(TEAL);
  g.beginPath(); g.moveTo(cx, cy - 11); g.lineTo(cx + 10, cy - 5); g.lineTo(cx, cy + 1); g.lineTo(cx - 10, cy - 5); g.closePath(); g.fillStyle = T3[0]; g.fill();
  g.beginPath(); g.moveTo(cx - 10, cy - 5); g.lineTo(cx, cy + 1); g.lineTo(cx, cy + 12); g.lineTo(cx - 10, cy + 6); g.closePath(); g.fillStyle = T3[1]; g.fill();
  g.beginPath(); g.moveTo(cx + 10, cy - 5); g.lineTo(cx, cy + 1); g.lineTo(cx, cy + 12); g.lineTo(cx + 10, cy + 6); g.closePath(); g.fillStyle = T3[2]; g.fill();
  const wipe = seg(t, S.t0 + .1, S.t0 + .1 + Math.min(.6, S.d * .3));
  g.save(); g.beginPath(); g.rect(x + 60, y, (w - 60) * ss(wipe), h); g.clip();
  g.fillStyle = INK; L.forEach((l, i) => g.fillText(l, x + 72, y + 17 + lh * (i + 1) - 14));
  g.restore(); g.restore();
}

// ---------- sound / cue events ----------
export function events() {
  const E = [];
  const ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  // footsteps at 12 fps steps while walking (every 0.3 s)
  const walk = (keys, t0, t1) => { for (let q = t0; q < t1; q += .3) { const [, , mv] = path(q + .01, keys); if (mv) ev(q, 'step'); } };
  walk(HOOK_PATH, 0, TL.HOOK_END); walk(MOM_PATH, TL.ROOM0, TL.MOM_END); walk(FIN_PATH, TL.FIN0, TL.PULL1);
  ev(TL.TOUCH_A, 'germ'); ev(TL.TOUCH_A + .12, 'germ'); ev(TL.TOUCH_B, 'germ'); ev(TL.TOUCH_B + .2, 'germ', { g: .7 });
  ev(TL.PUSH0, 'whoosh', { d: 1.8 });
  ev(TL.NUM0, 'board'); TL.ICONS.forEach((q, i) => ev(q, 'flip', { i }));
  ev(TL.CLICK, 'click', { big: 1 }); ev(TL.READY0 + .1, 'board');
  ev(TL.NAILS, 'snip'); ev(TL.RING, 'plink', { p: 0 }); ev(TL.BRACELET, 'plink', { p: 1 }); ev(TL.WATCH, 'plink', { p: 2 });
  ev(TL.RING + .6, 'tray'); ev(TL.BRACELET + .6, 'tray'); ev(TL.WATCH + .6, 'tray');
  ev(TL.GLOVE, 'snap'); ev(TL.NOTEQ, 'thud');
  ev(TL.ZONE0, 'draw', { d: 1.6 });
  MOMENTS.forEach((m, i) => ev(m.t, 'motif', { i }));
  RUBS.forEach(([a, b]) => { ev(a, 'click'); ev(a + .15, 'rub', { d: b - a - .15 }); });
  ev(43.4, 'swab', { d: 2.0 }); ev(46.8, 'pour', { d: 1.8 }); ev(51.3, 'cloth'); ev(56.7, 'cup');
  ev(TL.RUB0 + .6, 'whoosh', { d: .8 }); ev(TL.GEL, 'click'); ev(TL.GEL + .7, 'squelch'); TL.STEPS.forEach((q, i) => ev(q, 'stepcue', { i })); ev(TL.STEPS0, 'rub', { d: TL.RUB_END - TL.STEPS0 - .2 });
  ev(TL.JWATER, 'roomtone', { d: TL.WASH_END - TL.JWATER }); ev(TL.JWATER + .2, 'drip'); ev(TL.TAP_ON, 'waterbed', { d: TL.TAP_OFF - TL.TAP_ON }); ev(TL.WASH0, 'board'); ev(TL.TAP_ON, 'tap'); ev(TL.SOAP, 'pump'); ev(TL.SOAP + .6, 'rub', { d: TL.RINSE - TL.SOAP - .6, wet: 1 }); ev(TL.DRY, 'paper'); ev(TL.TAP_OFF, 'tap');
  ev(TL.SIL2 + .3, 'drip');
  ev(TL.FIN0, 'board'); ev(TL.FIN0 + .2, 'germ'); ev(TL.FIN_GEL, 'click'); ev(TL.FIN_GEL + .1, 'rub', { d: 1.1 }); ev(TL.PULL0, 'whoosh', { d: 2.6 });
  TL.LIGHTS.forEach((q, i) => ev(q, 'light', { i }));
  ev(TL.CARD, 'card');
  Object.entries(VO).forEach(([id, t]) => ev(t, 'vo', { id }));
  [[0, TL.HOOK_END], [TL.READY0, TL.RUB_END], [TL.FIN0, TL.END]].forEach(([a, b]) => ev(a, 'ward', { d: b - a }));
  return E.sort((a, b) => a.t - b.t);
}
