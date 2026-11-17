// Two vertical reels (1080×1920): A = last-minute shift changes, B = the break after six hours.
// Mixed style: photoreal clips (frame sequences in clips/cN/) alternating with graphic cards. ?reel=a | b
export const W = 1080, H = 1920;
const TEAL = '#00D5CD', TEALD = '#0A8F8A', WHITE = '#F5F4F0', RED = '#EB573C', AMBER = '#F0B43C', INK = '#15171A', SOFT = '#B9BEC4', F = 'Jost';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t, seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - clamp(t), 3), back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
const REELS = {
  a: [
    { kind: 'clip', clip: 0, lines: ['A1'], tail: 1.0, draw: hookA },
    { kind: 'card', lines: ['A2'], tail: 1.2, draw: calendar },
    { kind: 'clip', clip: 1, lines: ['A3'], tail: 1.4, draw: commitment },
    { kind: 'card', lines: ['A4', 'A5'], tail: 1.2, draw: yesNo },
    { kind: 'card', lines: ['A6'], tail: 1.0, draw: rests },
    { kind: 'card', lines: ['A7', 'A8', 'A9'], tail: 1.9, draw: checklist },
    { kind: 'clip', clip: 2, lines: ['A10'], tail: 1.4, draw: ctaA },
  ],
  b: [
    { kind: 'clip', clip: 3, lines: ['B1'], tail: 1.4, draw: hookB },
    { kind: 'card', lines: ['B2'], tail: 1.0, draw: sixHours },
    { kind: 'card', lines: ['B3'], tail: 1.3, draw: thirty },
    { kind: 'card', lines: ['B4', 'B5'], tail: 1.4, draw: detail },
    { kind: 'clip', clip: 3, lines: ['B6'], tail: 1.4, draw: ctaB },
  ],
};
export const SUB = {
  A1: "Ti cambiano il turno all'ultimo momento?", A2: 'Nella sanità pubblica, il contratto dice che i turni del mese vanno fissati entro il giorno 20 del mese prima.', A3: "Quindi il turno non è solo indicativo: è un impegno anche per l'azienda.",
  A4: "Può cambiare? Sì, ma come eccezione: per un'emergenza vera, con una motivazione, e rispettando i riposi.", A5: 'No, se i cambi continui diventano il modo di organizzare il reparto.', A6: "E i riposi restano: 11 ore tra un turno e l'altro, e 35 ore di riposo settimanale.",
  A7: 'Cosa puoi fare? Chiedi la motivazione per iscritto.', A8: 'Fotografa il turno pubblicato, e segna ogni cambio.', A9: 'E se succede spesso, contatta le associazioni di categoria.', A10: 'A te è mai successo? Scrivilo nei commenti.',
  B1: 'Lavori più di 6 ore di fila? Ti spetta una pausa.', B2: "Lo prevede la legge sull'orario di lavoro: oltre le 6 ore, una pausa per recuperare.", B3: 'Nella sanità pubblica, per chi lavora a giornata, il contratto parla di almeno 30 minuti.',
  B4: 'Il dettaglio che pochi conoscono: questa regola vale per chi non è in turno.', B5: 'Se fai i turni, controlla cosa prevedono il contratto e gli accordi della tua azienda.', B6: 'Nel tuo reparto, la pausa si riesce a fare davvero? Scrivilo nei commenti.',
};
let PLAN = [], T0 = [], SC = [], DURS = {}; export let VO = {}, END = 60, DUR = 63; const XF = .3, ENDCARD = 3;
export function init(reel, dur) {
  PLAN = REELS[reel]; DURS = dur; let t = 0; T0 = []; SC = []; VO = {};
  for (const s of PLAN) { T0.push(t); let tl = t + .5; for (const id of s.lines) { VO[id] = +tl.toFixed(2); tl += dur[id] + .3; } const e = tl - .3 + s.tail; SC.push(e - t); t = e; }
  END = +t.toFixed(2); DUR = +(END + ENDCARD).toFixed(2);
}
export const subtitleCues = () => Object.keys(VO).map(id => ({ t0: VO[id], t1: +(VO[id] + DURS[id] + .3).toFixed(2), text: SUB[id] }));
const IMG = { clips: {} };
export async function loadImages() {
  const ld = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = s; });
  IMG.logo = await ld('logo.png'); IMG.fin = await ld('finale.png');
  for (const c of new Set(PLAN.filter(s => s.kind === 'clip').map(s => s.clip))) IMG.clips[c] = await Promise.all([...Array(72)].map((_, k) => ld(`clips/c${c}/f_${String(k + 1).padStart(3, '0')}.jpg`)));
}
let TXT = []; const note = (id, text, x0, y0, x1, y1) => TXT.push({ id, text, x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1) });

// ---------- text helpers ----------
function wrap(g, s, max) { const out = []; let cur = ''; for (const w of s.split(' ')) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > max && cur) { out.push(cur); cur = w; } else cur = n; } if (cur) out.push(cur); return out; }
function say(g, id, text, t, at, y, o = {}) { // one centred paragraph appearing at `at`; returns its bottom y
  const px = o.px || 80, wt = o.wt || 700, max = o.max || 940; g.font = `${wt} ${px}px ${F}`; const L = wrap(g, text, max), lh = px * 1.16, a = seg(t, at - .12, at + .25);
  if (a > 0) { g.save(); g.globalAlpha = clamp(a * 1.5); g.translate(0, (1 - eo(a)) * 28); g.textAlign = 'center'; g.fillStyle = o.color || WHITE; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = o.shadow ?? 18; g.shadowOffsetY = 5; L.forEach((l, k) => g.fillText(l, W / 2 + (o.dx || 0), y + lh * (k + .82))); g.restore(); if (a >= 1) note(id, text, 50, y, W - 50, y + L.length * lh); }
  return y + L.length * lh;
}
function cite(g, text, t, at) { const a = seg(t, at, at + .3); if (a <= 0) return; g.save(); g.globalAlpha = a; g.translate(W / 2, 1640); g.rotate(-.03); g.font = `600 34px ${F}`; g.textAlign = 'center'; const w = g.measureText(text).width + 60; g.fillStyle = 'rgba(245,244,240,.95)'; g.beginPath(); g.roundRect(-w / 2, -40, w, 64, 8); g.fill(); g.fillStyle = TEALD; g.fillText(text, 0, 4); g.restore(); if (a >= 1) note('cite' + text.slice(0, 6), text, W / 2 - w / 2, 1596, W / 2 + w / 2, 1668); }
function kicker(g, text, t, y = 470, color = TEAL) { const a = seg(t, .15, .45); if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `700 ${text.length > 24 ? 32 : 40}px ${F}`; g.textAlign = 'center'; g.letterSpacing = text.length > 24 ? '4px' : '8px'; g.fillStyle = color; g.fillText(text, W / 2, y); g.restore(); }
function cardBg(g, tint = 0) { const r = g.createRadialGradient(W / 2, 760, 0, W / 2, 1000, 1400); const c = [['#3E4348', '#1F2226'], ['#0F4A48', '#122A2C'], ['#463036', '#241A1E']][tint]; r.addColorStop(0, c[0]); r.addColorStop(1, c[1]); g.fillStyle = r; g.fillRect(0, 0, W, H); }
function clipBg(g, c, t, zoom = .04) { // frame sequence played at 60 % speed, ping-pong, cover-fitted, with a slow push
  const fr = IMG.clips[c], n = fr.length, p = (t * 24 * .6) % (2 * (n - 1)), k = Math.round(p < n ? p : 2 * (n - 1) - p), im = fr[clamp(k, 0, n - 1)] || fr[0];
  const s = Math.max(W / im.width, H / im.height) * (1 + zoom * t / 6), w = im.width * s, h = im.height * s; g.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  let gr = g.createLinearGradient(0, 0, 0, 520); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 520);
  gr = g.createLinearGradient(0, 760, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.55, 'rgba(0,0,0,.72)'); gr.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = gr; g.fillRect(0, 760, W, H - 760);
}
function tick(g, x, y, r, a, col = TEAL) { g.save(); g.translate(x, y); g.scale(back(a, 2), back(a, 2)); g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = r * .22; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-r * .45, 0); g.lineTo(-r * .1, r * .35); g.lineTo(r * .5, -r * .35); g.stroke(); g.restore(); }
function cross(g, x, y, r, a) { g.save(); g.translate(x, y); g.scale(back(a, 2), back(a, 2)); g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = RED; g.fill(); g.strokeStyle = WHITE; g.lineWidth = r * .22; g.lineCap = 'round'; g.beginPath(); g.moveTo(-r * .38, -r * .38); g.lineTo(r * .38, r * .38); g.moveTo(r * .38, -r * .38); g.lineTo(-r * .38, r * .38); g.stroke(); g.restore(); }

// ---------- reel A ----------
function hookA(g, t, v) { let y = say(g, 'h1', 'Ti cambiano il turno', t, v.A1, 1180, { px: 96 }); say(g, 'h2', "all'ultimo momento?", t, v.A1 + .5, y + 4, { px: 96, color: TEAL }); }
function calendar(g, t, v) {
  cardBg(g, 0); kicker(g, 'TURNI DEL MESE', t, 500);
  const cols = 7, rows = 4, cs = 112, gap = 14, x0 = (W - cols * cs - (cols - 1) * gap) / 2, y0 = 580, L = 'MPNSRMPPNSRRMMPNSRMPPNSRRMMP';
  g.textAlign = 'center';
  for (let i = 0; i < cols * rows; i++) { const a = seg(t, v.A2 + .1 + i * .07, v.A2 + .3 + i * .07); if (a <= 0) continue; const x = x0 + (i % cols) * (cs + gap), y = y0 + Math.floor(i / cols) * (cs + gap), ch = L[i];
    g.save(); g.translate(x + cs / 2, y + cs / 2); g.scale(back(a, 2), back(a, 2)); g.fillStyle = ch === 'N' ? '#0A5E5B' : ch === 'R' ? 'rgba(255,255,255,.12)' : ch === 'S' ? '#7FD9D4' : WHITE; g.beginPath(); g.roundRect(-cs / 2, -cs / 2, cs, cs, 14); g.fill();
    g.font = `700 50px ${F}`; g.fillStyle = ch === 'N' ? WHITE : ch === 'R' ? 'rgba(255,255,255,.4)' : INK; g.fillText(ch, 0, 18); g.restore(); }
  const p = seg(t, v.A2 + 5.2, v.A2 + 5.6); if (p > 0) { g.save(); g.translate(W / 2, 1180); g.scale(back(p, 2), back(p, 2)); g.font = `700 54px ${F}`; const s = 'fissati entro il giorno 20', w = g.measureText(s).width + 90; g.fillStyle = AMBER; g.beginPath(); g.roundRect(-w / 2, -58, w, 100, 50); g.fill(); g.fillStyle = INK; g.fillText(s, 0, 10); g.restore(); if (p >= 1) note('pill', 'fissati entro il giorno 20', 150, 1120, 930, 1225); }
  say(g, 'c2', 'del mese prima', t, v.A2 + 6.6, 1250, { px: 60, wt: 600 });
  cite(g, 'CCNL Comparto Sanità 2022-2024 · art. 27', t, v.A2 + 1.2);
}
function commitment(g, t, v) { let y = say(g, 'm1', 'Non è «solo indicativo».', t, v.A3, 1140, { px: 84 }); say(g, 'm2', "È un impegno anche per l'azienda.", t, v.A3 + 2.6, y + 16, { px: 84, color: TEAL }); }
function yesNo(g, t, v) {
  cardBg(g, 0);
  const panel = (y, h, col, a) => { g.save(); g.globalAlpha = clamp(a * 1.5); g.translate(0, (1 - eo(a)) * 40); g.fillStyle = col; g.beginPath(); g.roundRect(60, y, W - 120, h, 34); g.fill(); g.restore(); };
  const a1 = seg(t, v.A4 + .4, v.A4 + .8); panel(440, 640, 'rgba(10,143,138,.55)', a1);
  if (a1 > 0) { g.save(); g.globalAlpha = clamp(a1 * 1.5); g.textAlign = 'left'; g.font = `700 110px ${F}`; g.fillStyle = WHITE; g.fillText('Sì', 120, 570); g.font = `600 48px ${F}`; g.fillStyle = TEAL; g.fillText('ma come eccezione', 260, 560); g.restore(); if (a1 >= 1) note('si', 'Sì ma come eccezione', 120, 470, 760, 590); }
  [['emergenza vera', 3.6], ['cambio motivato', 5.4], ['riposi rispettati', 6.6]].forEach(([s, at], k) => { const a = seg(t, v.A4 + at, v.A4 + at + .3); if (a <= 0) return; const y = 700 + k * 120; tick(g, 160, y - 18, 36, a); g.save(); g.globalAlpha = a; g.textAlign = 'left'; g.font = `600 62px ${F}`; g.fillStyle = WHITE; g.fillText(s, 230, y); g.restore(); if (a >= 1) note('y' + k, s, 120, y - 60, 900, y + 20); });
  const a2 = seg(t, v.A5, v.A5 + .4); panel(1120, 420, 'rgba(235,87,60,.5)', a2);
  if (a2 > 0) { g.save(); g.globalAlpha = clamp(a2 * 1.5); g.textAlign = 'left'; g.font = `700 110px ${F}`; g.fillStyle = WHITE; g.fillText('No', 120, 1250); g.restore(); cross(g, 160, 1372, 36, seg(t, v.A5 + 1.2, v.A5 + 1.5));
    g.save(); g.globalAlpha = seg(t, v.A5 + 1.2, v.A5 + 1.5); g.textAlign = 'left'; g.font = `600 56px ${F}`; g.fillStyle = WHITE; wrap(g, 'cambi continui come modo di organizzare il reparto', 720).forEach((l, k) => g.fillText(l, 230, 1390 + k * 66)); g.restore(); if (seg(t, v.A5 + 1.2, v.A5 + 1.5) >= 1) note('no', 'No cambi continui come modo di organizzare il reparto', 120, 1160, 980, 1500); }
}
function rests(g, t, v) {
  cardBg(g, 1); kicker(g, 'I RIPOSI RESTANO', t, 480);
  const big = (num, lab, at, y) => { const a = seg(t, at, at + .35); if (a <= 0) return; g.save(); g.translate(W / 2, y); g.scale(back(a, 1.8), back(a, 1.8)); g.textAlign = 'center'; g.font = `700 260px ${F}`; g.fillStyle = TEAL; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 20; g.fillText(num, 0, 0); g.restore(); g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = `600 56px ${F}`; g.fillStyle = WHITE; g.fillText(lab, W / 2, y + 80); g.restore(); if (a >= 1) note('n' + num, num + ' ' + lab, 100, y - 220, 980, y + 100); };
  big('11', "ore tra un turno e l'altro", v.A6 + 1.6, 820); big('35', 'ore di riposo settimanale', v.A6 + 3.9, 1300);
  cite(g, 'D.Lgs. 66/2003, artt. 7 e 9', t, v.A6 + 1.4);
}
function checklist(g, t, v) {
  cardBg(g, 0); kicker(g, 'COSA PUOI FARE', t, 480);
  [['Chiedi la motivazione per iscritto', v.A7 + 1.3], ['Fotografa il turno pubblicato', v.A8], ['Segna ogni cambio', v.A8 + 1.9], ['Contatta le associazioni di categoria', v.A9 + 1.5]].forEach(([s, at], k) => {
    const a = seg(t, at, at + .3); if (a <= 0) return; const y = 600 + k * 250; g.save(); g.globalAlpha = clamp(a * 1.5); g.translate((1 - eo(a)) * 60, 0); g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(60, y, W - 120, 210, 28); g.fill(); g.strokeStyle = 'rgba(0,213,205,.5)'; g.lineWidth = 3; g.stroke();
    g.textAlign = 'left'; g.font = `600 56px ${F}`; g.fillStyle = WHITE; const L = wrap(g, s, 720); L.forEach((l, j) => g.fillText(l, 230, y + 105 + (j - (L.length - 1) / 2) * 66 + 18)); g.restore(); tick(g, 150, y + 105, 44, seg(t, at + .15, at + .45)); if (a >= 1) note('k' + k, s, 60, y, W - 60, y + 210); });
}
function ctaA(g, t, v) { let y = say(g, 'q1', 'A te è mai successo?', t, v.A10, 1160, { px: 96 }); say(g, 'q2', 'Scrivilo nei commenti', t, v.A10 + 1.7, y + 20, { px: 72, color: TEAL }); }

// ---------- reel B ----------
function hookB(g, t, v) { let y = say(g, 'h1', 'Più di 6 ore di fila?', t, v.B1, 1180, { px: 96 }); say(g, 'h2', 'Ti spetta una pausa.', t, v.B1 + 1.7, y + 10, { px: 96, color: TEAL }); }
function sixHours(g, t, v) {
  cardBg(g, 0); kicker(g, 'ORARIO DI LAVORO', t, 520);
  const x0 = 110, x1 = W - 110, y = 900, u = eo(seg(t, v.B2 + .4, v.B2 + 3.6)) * (7.2 / 8), hx = h => lerp(x0, x1, h / 8);
  g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.roundRect(x0, y, x1 - x0, 70, 35); g.fill(); g.fillStyle = TEAL; g.beginPath(); g.roundRect(x0, y, Math.max(70, (x1 - x0) * u), 70, 35); g.fill();
  g.textAlign = 'center'; g.font = `500 36px ${F}`; g.fillStyle = SOFT; for (const h of [0, 2, 4, 6, 8]) g.fillText(h + ' h', hx(h), y + 130);
  g.font = `700 150px ${F}`; g.fillStyle = WHITE; const hh = u * 8, s = `${Math.floor(hh)} h ${String(Math.round((hh % 1) * 60)).padStart(2, '0')}′`; g.fillText(s, W / 2, 780);
  const m = seg(t, v.B2 + 2.6, v.B2 + 2.9); if (m > 0) { g.save(); g.globalAlpha = m; g.fillStyle = AMBER; g.fillRect(hx(6) - 4, y - 60, 8, 190); g.restore(); say(g, 'six', 'oltre 6 ore: pausa', t, v.B2 + 2.7, 1120, { px: 84, color: AMBER }); }
  cite(g, 'D.Lgs. 66/2003, art. 8', t, v.B2 + 1.0);
}
function thirty(g, t, v) {
  cardBg(g, 1); kicker(g, 'SANITÀ PUBBLICA · A GIORNATA', t, 520);
  const a = seg(t, v.B3 + 4.2, v.B3 + 4.6); if (a > 0) { g.save(); g.translate(W / 2, 960); g.scale(back(a, 1.8), back(a, 1.8)); g.textAlign = 'center'; g.font = `700 420px ${F}`; g.fillStyle = TEAL; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 24; g.fillText('30', 0, 0); g.restore(); if (a >= 1) note('30', '30', 250, 640, 830, 980); }
  say(g, 't2', 'minuti di pausa', t, v.B3 + 4.6, 1040, { px: 84 }); say(g, 't3', 'almeno', t, v.B3 + 3.8, 566, { px: 60, wt: 600, color: SOFT });
  cite(g, 'CCNL Comparto Sanità 2022-2024 · art. 27, c. 5', t, v.B3 + 1.0);
}
function detail(g, t, v) {
  cardBg(g, 0); kicker(g, 'IL DETTAGLIO CHE POCHI CONOSCONO', t, 520, AMBER);
  let y = say(g, 'd1', 'Vale per chi', t, v.B4 + 2.6, 660, { px: 84, shadow: 0 }); const y2 = say(g, 'd2', 'non è in turno', t, v.B4 + 3.3, y + 20, { px: 96, color: TEAL, shadow: 0 });
  const c = seg(t, v.B4 + 4.0, v.B4 + 4.6); if (c > 0) { g.save(); g.strokeStyle = TEAL; g.lineWidth = 6; g.beginPath(); g.ellipse(W / 2, y + 86, 400, 92, -.02, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * eo(c)); g.stroke(); g.restore(); }
  const b = seg(t, v.B5, v.B5 + .35); if (b > 0) { g.save(); g.globalAlpha = clamp(b * 1.5); g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(60, 1080, W - 120, 360, 30); g.fill(); g.strokeStyle = 'rgba(240,180,60,.7)'; g.lineWidth = 3; g.stroke(); g.restore(); let yy = say(g, 'd3', 'Fai i turni?', t, v.B5, 1120, { px: 76, color: AMBER, shadow: 0 }); say(g, 'd4', 'Controlla contratto e accordi aziendali', t, v.B5 + 1.2, yy + 10, { px: 62, wt: 600, shadow: 0, max: 860 }); }
  cite(g, 'CCNL Sanità 2022-2024 · Dichiarazione congiunta n. 2', t, v.B4 + 2.2);
}
function ctaB(g, t, v) { let y = say(g, 'q1', 'Nel tuo reparto la pausa si riesce a fare davvero?', t, v.B6, 1080, { px: 84 }); say(g, 'q2', 'Scrivilo nei commenti', t, v.B6 + 3.0, y + 24, { px: 72, color: TEAL }); }

// ---------- frame ----------
function logo(g) { const lw = 700, lh = Math.round(lw * IMG.logo.height / IMG.logo.width); g.drawImage(IMG.logo, (W - lw) / 2, 110, lw, lh); }
function scene(g, i, lt) { const s = PLAN[i], v = {}; for (const id of s.lines) v[id] = VO[id] - T0[i]; if (s.kind === 'clip') clipBg(g, s.clip, lt); s.draw(g, lt, v); if (s.kind === 'card') { const gr = g.createLinearGradient(0, 0, 0, 380); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 380); } }
let OFF;
export function render(g, t) {
  TXT = []; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  if (t >= END) { g.drawImage(IMG.fin, 0, 0, W, H); return; }
  const i = Math.min(SC.length - 1, T0.findLastIndex(x => t >= x)), lt = t - T0[i];
  scene(g, i, lt);
  if (i + 1 < SC.length && lt > SC[i] - XF) { OFF = OFF || new OffscreenCanvas(W, H); const o = OFF.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; const keep = TXT; scene(o, i + 1, 0); TXT = keep; g.globalAlpha = seg(lt, SC[i] - XF, SC[i]); g.drawImage(OFF, 0, 0); g.globalAlpha = 1; }
  logo(g);
  const fo = seg(t, END - .35, END); if (fo > 0) { g.globalAlpha = fo; g.drawImage(IMG.fin, 0, 0, W, H); g.globalAlpha = 1; }
}
export function texts(g, t) { render(g, t); return TXT; }
export function events() { const E = []; Object.entries(VO).forEach(([id, t]) => E.push({ t, type: 'vo', id })); T0.slice(1).forEach(t => E.push({ t: +t.toFixed(2), type: 'cut' })); E.push({ t: END, type: 'end' }); E.push({ t: 0, type: 'meta', dur: DUR, end: END }); return E.sort((a, b) => a.t - b.t); }
