// Hands seen from above, in the flat three-tone language of the style (no outlines).
// Unit: palm width ≈ 1. Origin = centre of the palm. Fingers point to −y. Right hand; mirror with scale(−1, 1).
import { tri, hex, mix, TAU, clamp, lerp } from './engine.js';

export const SKIN = '#D9A27E';
const cap = (g, x0, y0, x1, y1, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const poly = (g, pts, c) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = c; g.fill(); };

// o: {palm: true = palm side visible, curl 0..1, spread 0..1, nails 0..1 (length), polish (colour|null), sleeve, glove (colour),
//     col: colour filter, arm: forearm length, thumbA: thumb angle offset, fingers: false to skip}
export function hand(g, o = {}) {
  const C = o.col || (c => c), base = o.glove || o.skin || SKIN, S = tri(base, .22, .2);
  const top = o.palm ? hex(mix(S[0], '#FFF4EC', .25)) : S[1], mid = o.palm ? S[0] : hex(mix(S[1], S[2], .25)), dark = S[2];
  const curl = o.curl || 0, sp = o.spread || 0;
  // forearm (+ sleeve cuff)
  const A = o.arm ?? 1.6;
  if (A > 0) {
    poly(g, [[-.36, .45], [.36, .45], [.30, .45 + A], [-.30, .45 + A]].map(p => [p[0] + .04, p[1] + .04]), C(dark));
    poly(g, [[-.36, .45], [.36, .45], [.30, .45 + A], [-.30, .45 + A]], C(mid));
    poly(g, [[-.36, .45], [-.06, .45], [-.08, .45 + A], [-.30, .45 + A]], C(top));
    if (o.sleeve) { const SL = tri(o.sleeve); poly(g, [[-.36, .45 + A * .62], [.36, .45 + A * .62], [.34, .45 + A], [-.34, .45 + A]], C(SL[1])); poly(g, [[.02, .45 + A * .62], [.36, .45 + A * .62], [.34, .45 + A], [.02, .45 + A]], C(SL[2])); }
    if (o.wrist) o.wrist(g, C);
  }
  // palm (dark offset = thickness, then mid, then light facet)
  const P = [[-.46, .48], [-.52, .05], [-.46, -.40], [-.2, -.5], [.2, -.5], [.46, -.42], [.5, .02], [.42, .48]];
  poly(g, P.map(p => [p[0] + .05, p[1] + .06]), C(dark));
  poly(g, P, C(mid));
  poly(g, [[-.42, .4], [-.46, .04], [-.4, -.34], [-.16, -.44], [.04, -.44], [-.02, .42]], C(top));
  // thumb
  const ta = (o.palm ? 1 : 1) * (-2.35 + (o.thumbA || 0) - sp * .25);
  const t0 = [-.44, .18], t1 = [t0[0] + Math.cos(ta) * .42, t0[1] + Math.sin(ta) * .42], t2 = [t1[0] + Math.cos(ta + .35) * .34 * (1 - curl * .5), t1[1] + Math.sin(ta + .35) * .34 * (1 - curl * .5)];
  if (o.fingers !== false) {
    cap(g, t0[0] + .04, t0[1] + .05, t1[0] + .04, t1[1] + .05, .27, C(dark)); cap(g, t1[0] + .04, t1[1] + .05, t2[0] + .04, t2[1] + .05, .23, C(dark));
    cap(g, t0[0], t0[1], t1[0], t1[1], .26, C(mid)); cap(g, t1[0], t1[1], t2[0], t2[1], .22, C(top));
    nail(g, t2, ta + .35, o, C, .9);
    // four fingers
    const X = [-.33, -.11, .11, .33], L = [.66, .76, .72, .56];
    X.forEach((x, i) => {
      const a = -Math.PI / 2 + (i - 1.5) * .12 * sp, l = L[i] * (1 - curl * .62), y = -.44;
      const m = [x + Math.cos(a) * l * .55, y + Math.sin(a) * l * .55], e = [x + Math.cos(a) * l, y + Math.sin(a) * l];
      cap(g, x + .04, y + .05, e[0] + .04, e[1] + .05, .21, C(dark));
      cap(g, x, y, m[0], m[1], .2, C(i % 2 ? mid : top)); cap(g, m[0], m[1], e[0], e[1], .19, C(i % 2 ? top : mid));
      if (curl > .5) { g.beginPath(); g.arc(e[0], e[1], .1, 0, TAU); g.fillStyle = C(dark); g.fill(); }
      else nail(g, e, a, o, C, 1);
    });
  }
}
function nail(g, p, a, o, C, s) {
  if (o.palm || o.glove) return;
  const len = .07 + (o.nails || 0) * .12, c = o.polish || '#F3D9CC';
  g.save(); g.translate(p[0], p[1]); g.rotate(a + Math.PI / 2);
  g.beginPath(); g.ellipse(0, -len * .3, .075 * s, len, 0, 0, TAU); g.fillStyle = C(c); g.fill();
  g.restore();
}

// ---- personal items (mustard = "things to remove") ----
export function ringItem(g, C, x, y, r = .13) {
  const T = tri('#E2B04A'); g.beginPath(); g.ellipse(x, y, r, r * .55, 0, 0, TAU); g.lineWidth = .06; g.strokeStyle = C(T[1]); g.stroke();
  g.beginPath(); g.ellipse(x, y, r, r * .55, 0, Math.PI * .1, Math.PI * .9); g.strokeStyle = C(T[2]); g.stroke();
  g.beginPath(); g.arc(x, y - r * .55, .06, 0, TAU); g.fillStyle = C('#F6EFE0'); g.fill();
}
export function braceletItem(g, C, x, y) {
  const T = tri('#E2B04A'); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI; g.beginPath(); g.arc(x - .34 + i * .113, y + Math.sin(a) * .04, .055, 0, TAU); g.fillStyle = C(i % 2 ? T[1] : T[0]); g.fill(); }
}
export function watchItem(g, C, x, y) {
  const T = tri('#E2B04A'); poly(g, [[x - .4, y - .1], [x + .4, y - .1], [x + .4, y + .1], [x - .4, y + .1]], C(T[2]));
  g.beginPath(); g.arc(x, y, .2, 0, TAU); g.fillStyle = C(T[1]); g.fill(); g.beginPath(); g.arc(x - .02, y - .02, .15, 0, TAU); g.fillStyle = C('#FBF8F0'); g.fill();
  g.strokeStyle = C('#2A2733'); g.lineWidth = .025; g.beginPath(); g.moveTo(x - .02, y - .02); g.lineTo(x - .02, y - .12); g.moveTo(x - .02, y - .02); g.lineTo(x + .06, y + .02); g.stroke();
}

// ---- motion arrows (ink, infographic furniture) ----
export function arrow2(g, x0, y0, x1, y1, a = 1, lw = 3, ink = '#2A2733') { // double-headed
  if (a <= 0) return; g.save(); g.globalAlpha *= a; g.strokeStyle = ink; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  const ang = Math.atan2(y1 - y0, x1 - x0), h = lw * 4.2;
  for (const [x, y, s] of [[x1, y1, 1], [x0, y0, -1]]) { g.beginPath(); g.moveTo(x - s * Math.cos(ang - .5) * h, y - s * Math.sin(ang - .5) * h); g.lineTo(x, y); g.lineTo(x - s * Math.cos(ang + .5) * h, y - s * Math.sin(ang + .5) * h); g.stroke(); }
  g.restore();
}
export function arrowArc(g, x, y, r, a0, a1, a = 1, lw = 3, ink = '#2A2733') {
  if (a <= 0) return; g.save(); g.globalAlpha *= a; g.strokeStyle = ink; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke();
  const ex = x + Math.cos(a1) * r, ey = y + Math.sin(a1) * r, tg = a1 + Math.PI / 2, h = lw * 4.2;
  g.beginPath(); g.moveTo(ex - Math.cos(tg - .5) * h, ey - Math.sin(tg - .5) * h); g.lineTo(ex, ey); g.lineTo(ex - Math.cos(tg + .5) * h, ey - Math.sin(tg + .5) * h); g.stroke();
  g.restore();
}

// ---- the six WHO rub steps as two-hand pictograms. u = 0..1 progress inside the step (drives the motion).
// draws centred at (0,0), unit ≈ palm width. Returns nothing.
export function rubStep(g, i, u, C, o = {}) {
  const osc = Math.sin(u * TAU * 2), sk = o.skin || SKIN;
  const R = (x, y, rot, opt) => { g.save(); g.translate(x, y); g.rotate(rot); hand(g, { col: C, skin: sk, arm: 1.3, sleeve: o.sleeve, ...opt }); g.restore(); };
  const Lh = (x, y, rot, opt) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(-1, 1); hand(g, { col: C, skin: sk, arm: 1.3, sleeve: o.sleeve, ...opt }); g.restore(); };
  if (i === 0) {        // palm to palm
    Lh(-.1, .15, .12, { palm: true }); R(.1 + osc * .02, -.05 + osc * .22, -.12, { palm: false });
  } else if (i === 1) { // right palm over left back, fingers interlaced
    Lh(-.05, .2, .35, { palm: false, spread: 1 }); R(.12, -.05 + osc * .2, .1, { palm: true, spread: 1, arm: 1.5 });
  } else if (i === 2) { // palm to palm, fingers interlaced
    Lh(-.12, .1, .05, { palm: true, spread: 1 }); R(.06 + osc * .03, -.02 + osc * .16, -.05, { palm: false, spread: 1 });
  } else if (i === 3) { // backs of the fingers against the opposite palm (interlocked fists)
    Lh(-.05, .5, 0, { palm: true, curl: .3 }); R(osc * .16, -.35, Math.PI, { palm: false, curl: 1, arm: 1.2 });
  } else if (i === 4) { // rotational rubbing of the thumb
    Lh(-.35, .3, -.25, { palm: false });
    const a = u * TAU * 2, cx = -.95, cy = -.15; R(cx + .55 + Math.cos(a) * .08, cy + .25 + Math.sin(a) * .06, -1.9 + Math.sin(a) * .25, { palm: false, curl: 1, arm: 1.2 });
  } else {              // fingertips rotating in the opposite palm
    Lh(-.1, .35, -.15, { palm: true, spread: .6 });
    const a = u * TAU * 2; R(.2 + Math.cos(a) * .16, -.55 + Math.sin(a) * .12, .5, { palm: false, curl: .85, arm: 1.4 });
  }
}
export const RUB_NAMES = ['PALMO CONTRO PALMO', 'IL DORSO', 'TRA LE DITA', 'LE NOCCHE', 'I POLLICI', 'LA PUNTA DELLE DITA'];
// arrow hints per step, in the same unit space
export function rubArrows(g, i, a) {
  if (i === 0) arrow2(g, .95, -.55, .95, .55, a, .045);
  else if (i === 1) arrow2(g, 1.0, -.6, 1.0, .4, a, .045);
  else if (i === 2) arrow2(g, .95, -.5, .95, .5, a, .045);
  else if (i === 3) arrow2(g, -.6, -1.25, .6, -1.25, a, .045);
  else if (i === 4) arrowArc(g, -.4, .05, .62, -2.6, .2, a, .045);
  else arrowArc(g, .2, -.55, .48, -2.4, 1.2, a, .045);
}
