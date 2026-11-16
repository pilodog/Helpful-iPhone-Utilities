// Reel "Turni e riposo" — 1080×1920, six scenes, texts exactly as supplied by the author.
export const W = 1080, H = 1920;
const TEAL = '#00D5CD', WHITE = '#FFFFFF', F = 'DVC';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t, seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - clamp(t), 3), back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
// scene lengths (s) and cross-fade
export const SC = [6.0, 6.0, 8.0, 9.0, 10.0, 10.0], XF = 0.35;
export const T0 = SC.map((_, i) => SC.slice(0, i).reduce((a, b) => a + b, 0));
export const DUR = SC.reduce((a, b) => a + b, 0);
let LOGO;
export async function loadImages() { LOGO = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'logo.png'; }); }
let TXT = []; const note = (id, text, x0, y0, x1, y1) => TXT.push({ id, text, x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1) });

// ---------- text ----------
function wrap(g, s, max) { const out = []; let cur = ''; for (const w of s.split(' ')) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > max && cur) { out.push(cur); cur = w; } else cur = n; } if (cur) out.push(cur); return out; }
// blocks: [{text, px, color, bold, gap}] laid out centred horizontally and vertically (around cy), with a shadow
function layout(g, blocks, max = 940) { let h = 0; const L = blocks.map(b => { g.font = `${b.bold === false ? 400 : 700} ${b.px}px ${F}`; const lines = wrap(g, b.text, b.max || max), lh = b.px * 1.18; const o = { ...b, lines, lh, y: h + (b.gap || 0) }; h = o.y + lines.length * lh; return o; }); return { L, h }; }
function drawBlocks(g, blocks, t, id, cy = H / 2 + 40, stagger = .45) {
  const { L, h } = layout(g, blocks); const y0 = cy - h / 2; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  L.forEach((b, i) => {
    const a = seg(t, .25 + i * stagger, .65 + i * stagger); if (a <= 0) return;
    g.save(); g.globalAlpha = clamp(a * 1.5); g.translate(0, (1 - eo(a)) * 30); g.font = `${b.bold === false ? 400 : 700} ${b.px}px ${F}`;
    g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 18; g.shadowOffsetY = 5; g.fillStyle = b.color || WHITE;
    b.lines.forEach((l, k) => g.fillText(l, W / 2, y0 + b.y + b.lh * (k + .82))); g.restore();
    if (a >= 1) note(id + i, b.text, 60, y0 + b.y, W - 60, y0 + b.y + b.lines.length * b.lh);
  });
}

// ---------- backgrounds: simple line illustrations, kept dim so the text stays readable ----------
function bg(g, i) {
  const r = g.createRadialGradient(W / 2, 760, 0, W / 2, 1000, 1350); const c = [['#3E4348', '#22252A'], ['#124A4A', '#162A2E'], ['#3A4046', '#1F2226'], ['#40424A', '#22232A'], ['#3B4450', '#1E2228'], ['#3E4348', '#202327']][i];
  r.addColorStop(0, c[0]); r.addColorStop(1, c[1]); g.fillStyle = r; g.fillRect(0, 0, W, H);
}
function line(g, a = .22, w = 10, col = TEAL) { g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; }
function clock(g, cx, cy, R, hour, a = .22) { // analog clock; hour is a float (0–24)
  g.save(); line(g, a, 14); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  for (let k = 0; k < 12; k++) { const q = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(q) * R * .86, cy + Math.sin(q) * R * .86); g.lineTo(cx + Math.cos(q) * R * .94, cy + Math.sin(q) * R * .94); g.stroke(); }
  const ah = (hour % 12) / 12 * Math.PI * 2 - Math.PI / 2, am = (hour % 1) * Math.PI * 2 - Math.PI / 2;
  line(g, a * 1.5, 18, WHITE); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ah) * R * .5, cy + Math.sin(ah) * R * .5); g.stroke();
  line(g, a * 1.5, 10, WHITE); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(am) * R * .76, cy + Math.sin(am) * R * .76); g.stroke(); g.restore();
}
const SCENE = [
  (g, t) => { // 1 hook: the clock runs from 7:00 to 18:00
    clock(g, W / 2, 1000, 430, lerp(7, 18, eo(seg(t, .8, 4.6))));
    drawBlocks(g, [{ text: 'Hai finito la notte alle 7.', px: 92, color: TEAL }, { text: 'Alle 18 sei di nuovo in turno?', px: 92, gap: 40 }], t, 's1', H / 2 + 40, .9);
  },
  (g, t) => { // 2 CTA: pulsing rings
    g.save(); for (let k = 0; k < 4; k++) { const u = ((t * .35 + k / 4) % 1); line(g, .28 * (1 - u), 10); g.beginPath(); g.arc(W / 2, 1000, 120 + u * 620, 0, 7); g.stroke(); } g.restore();
    drawBlocks(g, [{ text: 'SEGUI LA PAGINA', px: 118, color: TEAL }, { text: 'Ogni giorno una domanda. E i tuoi diritti, spiegati.', px: 62, gap: 50, bold: false }], t, 's2');
  },
  (g, t) => { // 3 the rule: an arc that fills to 11 hours out of 24
    g.save(); line(g, .14, 40, WHITE); g.beginPath(); g.arc(W / 2, 1000, 450, 0, 7); g.stroke();
    line(g, .5, 40); g.beginPath(); g.arc(W / 2, 1000, 450, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (11 / 24) * eo(seg(t, .5, 2.6))); g.stroke(); g.restore();
    drawBlocks(g, [{ text: '11 ORE', px: 210, color: TEAL }, { text: 'di riposo consecutive tra un turno e l\'altro', px: 74, gap: 20 }, { text: 'D.Lgs. 66/2003, art. 7', px: 44, gap: 60, bold: false }], t, 's3');
  },
  (g, t) => { // 4 exceptions: a contract sheet
    g.save(); line(g, .2, 12); g.translate(W / 2, 1000); g.rotate(-.06); g.beginPath(); g.roundRect(-330, -470, 660, 940, 30); g.stroke();
    for (let k = 0; k < 7; k++) { const u = eo(seg(t, .4 + k * .2, 1 + k * .2)); g.beginPath(); g.moveTo(-250, -350 + k * 110); g.lineTo(-250 + (k % 3 === 2 ? 320 : 500) * u, -350 + k * 110); g.stroke(); } g.restore();
    drawBlocks(g, [{ text: 'Le deroghe esistono,', px: 84, color: TEAL }, { text: 'ma solo se previste dal contratto, con riposo compensativo subito dopo.', px: 72, gap: 40 }], t, 's4', H / 2 + 40, .9);
  },
  (g, t) => { // 5 on-call: a ringing phone
    g.save(); g.translate(W / 2, 1000); g.rotate(Math.sin(t * 22) * .05 * (t % 2 < 1 ? 1 : 0)); line(g, .2, 12); g.beginPath(); g.roundRect(-220, -420, 440, 840, 60); g.stroke(); g.beginPath(); g.arc(0, 330, 34, 0, 7); g.stroke();
    for (const s of [-1, 1]) for (let k = 1; k <= 3; k++) { const u = ((t * .8 + k / 3) % 1); line(g, .3 * (1 - u), 10); g.beginPath(); g.arc(s * 220, 0, 80 + k * 70, s > 0 ? -.7 : Math.PI - .7, s > 0 ? .7 : Math.PI + .7); g.stroke(); } g.restore();
    drawBlocks(g, [{ text: 'Se ti chiamano in reperibilità, il riposo non si azzera:', px: 76 }, { text: 'si recupera quello mancante.', px: 80, color: TEAL, gap: 36 }, { text: 'Interpretazione ministeriale', px: 44, gap: 60, bold: false }], t, 's5', H / 2 + 40, 1.1);
  },
  (g, t) => { // 6 closing: three blocks + reminder
    const B = [['Commenta: ti è mai successo? Scrivi SÌ', 0], ['Condividi con un collega', 1], ['Segui la pagina', 2]], y0 = 560, bh = 250, gap = 44;
    g.textAlign = 'center';
    B.forEach(([s, k]) => {
      const a = seg(t, .3 + k * .7, .7 + k * .7); if (a <= 0) return; const y = y0 + k * (bh + gap);
      g.save(); g.globalAlpha = clamp(a * 1.5); g.translate(W / 2, y + bh / 2); g.scale(back(a, 1.6), back(a, 1.6));
      g.fillStyle = 'rgba(0,0,0,.42)'; g.beginPath(); g.roundRect(-460, -bh / 2, 920, bh, 28); g.fill(); g.strokeStyle = TEAL; g.lineWidth = 5; g.stroke();
      g.fillStyle = TEAL; g.beginPath(); g.arc(-370, 0, 50, 0, 7); g.fill(); g.fillStyle = '#15171A'; g.font = `700 60px ${F}`; g.fillText(String(k + 1), -370, 21);
      g.font = `700 58px ${F}`; g.fillStyle = WHITE; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 12; g.shadowOffsetY = 4; const L = wrap(g, s, 640); L.forEach((l, j) => g.fillText(l, 60, (j - (L.length - 1) / 2) * 68 + 20)); g.restore();
      if (a >= 1) note('s6' + k, s, 80, y, W - 80, y + bh);
    });
    const c = seg(t, 2.8, 3.2); if (c > 0) { g.save(); g.globalAlpha = c; g.font = `700 66px ${F}`; g.fillStyle = TEAL; g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 18; g.shadowOffsetY = 5; g.fillText('Controlla il tuo CCNL.', W / 2, 1560); g.restore(); if (c >= 1) note('s6c', 'Controlla il tuo CCNL.', 150, 1490, 930, 1580); }
  },
];

// ---------- brand layer: bands, logo lockup, watermark ----------
function brand(g) {
  g.save(); g.translate(W / 2, H / 2); g.rotate(-Math.atan2(H, W) * .78); g.font = `700 150px ${F}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,.07)'; g.fillText('Riccardo Pilocane', 0, 0); g.restore();
  const lw = 820, lh = Math.round(lw * LOGO.height / LOGO.width); g.drawImage(LOGO, (W - lw) / 2, 70, lw, lh);
  g.fillStyle = TEAL; g.fillRect(0, 0, W, 12); g.fillRect(0, H - 12, W, 12);
}
function scene(g, i, t) { bg(g, i); SCENE[i](g, t); }
let OFF;
export function render(g, t) {
  TXT = []; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  const i = Math.min(SC.length - 1, T0.findLastIndex(x => t >= x)), lt = t - T0[i];
  scene(g, i, lt);
  if (i + 1 < SC.length && lt > SC[i] - XF) { // short dissolve into the next scene
    OFF = OFF || new OffscreenCanvas(W, H); const o = OFF.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; const keep = TXT; scene(o, i + 1, 0); TXT = [];
    g.globalAlpha = seg(lt, SC[i] - XF, SC[i]); g.drawImage(OFF, 0, 0); g.globalAlpha = 1;
  }
  brand(g);
}
export function texts(g, t) { render(g, t); return TXT; }
