"""Original score (synthesised: marimba, kalimba, glockenspiel, pizzicato bass, hand percussion), foley from events.json,
voice placement, ducking, master → out/mix.wav, plus the .srt.  Run: $LIB/.venv/bin/python mix.py"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, compress, limit, add, whoosh, thump, step as sstep, click as sclick

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']
N = int((DUR + 1.5) * SR)
rng = np.random.default_rng(11)
BEAT, BAR = .6, 2.4
def m2f(m): return 440 * 2 ** ((m - 69) / 12)

# ---------------- instruments ----------------
def marimba(m, v=1., d=1.2):
    f = m2f(m); tt = t_(d)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .45) + .35 * np.sin(2 * np.pi * f * 3.93 * tt) * np.exp(-tt / .09) + .12 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt / .03)
    x[:int(.003 * SR)] *= np.linspace(0, 1, int(.003 * SR))
    return x * v * .5
def kalimba(m, v=1., d=1.8):
    f = m2f(m); tt = t_(d)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .7) + .25 * np.sin(2 * np.pi * f * 5.95 * tt) * np.exp(-tt / .06) + .1 * np.sin(2 * np.pi * f * 2.01 * tt) * np.exp(-tt / .3)
    x[:int(.002 * SR)] *= np.linspace(0, 1, int(.002 * SR))
    return x * v * .45
def glock(m, v=1., d=2.0):
    f = m2f(m); tt = t_(d)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .9) + .3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / .25) + .12 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt / .08)
    return x * v * .3
def bass(m, v=1., d=.7):
    f = m2f(m); tt = t_(d)
    x = (np.sin(2 * np.pi * f * tt) + .35 * np.sin(2 * np.pi * 2 * f * tt) + .15 * np.sin(2 * np.pi * 3 * f * tt)) * np.exp(-tt / .28)
    x[:int(.004 * SR)] *= np.linspace(0, 1, int(.004 * SR))
    return lp(x, 900) * v * .38
def kick(v=1.):
    d = .25; tt = t_(d); f = 50 + 70 * np.exp(-tt / .03); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt / .08) * v * .45
def wood(v=1., f=1050):
    d = .08; tt = t_(d); return (np.sin(2 * np.pi * f * tt) * np.exp(-tt / .018) + bp(noise(d), 800, 3000) * np.exp(-tt / .006) * .3) * v * .35
def shaker(v=1.):
    d = .05; tt = t_(d); return hp(noise(d), 5000) * np.exp(-tt / .012) * v * .12
def pad(ms, d, v=1.):   # soft sustained chord (marimba-roll style tremolo, no strings)
    tt = t_(d); x = np.zeros(len(tt))
    for m in ms: f = m2f(m); x += np.sin(2 * np.pi * f * tt) + .2 * np.sin(2 * np.pi * 2 * f * tt)
    trem = .75 + .25 * np.sin(2 * np.pi * 8.33 * tt)
    e = np.minimum(1, tt / .25) * np.minimum(1, (d - tt) / .8)
    return x * trem * e * v * .07

# chords (MIDI): D, Bm, G, A ; root for bass
CH = {'D': [62, 66, 69], 'Bm': [59, 62, 66], 'G': [55, 59, 62], 'A': [57, 61, 64], 'Em': [52, 55, 59]}
ROOT = {'D': 38, 'Bm': 35, 'G': 31, 'A': 33, 'Em': 40}
PROG_A = ['Bm', 'G', 'D', 'A']; PROG_B = ['D', 'Bm', 'G', 'A']

music = np.zeros((N, 2))
def put(x, t, g=1., pan=0.): add(music, x, t, g, pan)

def groove(t0, t1, prog, drums=True, mar='eighth', kal=False, sh=True, dens=1.0):
    nb = int(round((t1 - t0) / BAR))
    for b in range(nb):
        ch = prog[b % len(prog)]; tb = t0 + b * BAR; notes = CH[ch]
        put(bass(ROOT[ch]), tb, .9); put(bass(ROOT[ch] + 7, .7), tb + 1.5 * BEAT, .6)
        if mar == 'eighth':
            pat = [0, 1, 2, 1, 2, 0, 1, 2]
            for i, p in enumerate(pat): put(marimba(notes[p] + 12, .8 if i % 2 == 0 else .55), tb + i * BEAT / 2, .8, -.3)
        elif mar == 'quarter':
            for i in range(4): put(marimba(notes[i % 3] + 12, .7), tb + i * BEAT, .7, -.3)
        if kal:
            for i in range(4): put(kalimba(notes[(i * 2) % 3] + 24, .6), tb + i * BEAT + BEAT / 2, .6, .35)
        if drums:
            put(kick(), tb, .8); put(kick(.7), tb + 2 * BEAT, .7)
            put(wood(.8), tb + BEAT, .6, .2); put(wood(.8), tb + 3 * BEAT, .6, .2)
        if sh:
            for i in range(16): put(shaker(1. if i % 4 == 2 else .6), tb + i * BEAT / 4, .9 * dens, .4)

# hook 0–12: B minor colour, marimba + shaker, bass
groove(0, 12.0, PROG_A, drums=False, mar='eighth', sh=True, dens=.7)
# number 12–20.7: sparse: bass + pad; the flips carry the melody (foley)
for b, ch in enumerate(['D', 'Bm', 'G']):
    tb = 12.0 + b * BAR; put(bass(ROOT[ch], .8, 1.2), tb, .8); put(pad(CH[ch], BAR + .2), tb, 1.)
put(pad(CH['A'], 1.5), 12.0 + 3 * BAR, .9)
# 20.7–21.6 silence. 21.6 click + chord: ready 21.6–34.2 kalimba, woodblock, no kick
put(kalimba(62 + 12, 1., 2.5), 21.6, .9); put(kalimba(66 + 12, .8, 2.5), 21.6, .7, .3); put(kalimba(69 + 12, .8, 2.5), 21.6, .7, -.3)
groove(22.2, 34.2, PROG_B, drums=False, mar=None, kal=True, sh=False)
for b in range(5):
    tb = 22.2 + b * BAR; put(wood(.7), tb + BEAT, .5, .2); put(wood(.7), tb + 3 * BEAT, .5, .2)
# moments 34.2–62.4: full groove
groove(34.2, 62.4, PROG_B, drums=True, mar='eighth', kal=False, sh=True)
# rub 62.4–76.2: groove; from the steps, chords change every two beats (acceleration)
groove(62.4, 67.2, PROG_B, drums=True, mar='eighth', sh=True)
for i in range(int((76.2 - 67.2) / (2 * BEAT))):
    ch = PROG_B[i % 4]; tb = 67.2 + i * 2 * BEAT; notes = CH[ch]
    put(bass(ROOT[ch]), tb, .9); put(kick(), tb, .8); put(wood(.8), tb + BEAT, .6, .2)
    for j in range(4): put(marimba(notes[[0, 2, 1, 2][j]] + 12, .7), tb + j * BEAT / 2, .8, -.3)
    for j in range(8): put(shaker(1. if j % 2 else .6), tb + j * BEAT / 4, 1., .4)
# wash 76.2–89.4: sparse marimba quarters + bass, no drums
groove(76.2, 88.2, PROG_B, drums=False, mar='quarter', sh=False)
put(pad(CH['D'], 1.4), 88.2, .6)
# 89.4–90 near silence. finale 90–102: marimba light, final chord at the card
groove(90.0, 97.2, PROG_B, drums=False, mar='quarter', kal=True, sh=False)
put(bass(38, 1., 3.0), 97.8, 1.); put(pad([62, 66, 69, 74], 4.2), 97.8, 1.3)
for i, m in enumerate([74, 78, 81, 86]): put(glock(m, .8, 3), 97.8 + i * .15, .8, -.2 + i * .13)
# hard silences
def silence(buf, a, b, fade=.08):
    i0, i1 = int(a * SR), int(b * SR); f = int(fade * SR)
    buf[i0 - f:i0] *= np.linspace(1, 0, f)[:, None]; buf[i0:i1] = 0
silence(music, 20.7, 21.6); silence(music, 89.4, 90.0)

# ---------------- foley ----------------
fx = np.zeros((N, 2)); amb = np.zeros((N, 2))
PENTA = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95]
def ceramic(f=2400, v=1.):
    d = .5; tt = t_(d); return sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / tau) for r, a, tau in [(1, 1, .12), (2.32, .5, .06), (4.1, .3, .03)]) * v * .3
def germblip(v=1.):
    d = .14; tt = t_(d); f = 420 * np.exp(-tt / .05) + 180; ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-tt / .04) + lp(noise(d), 1500) * np.exp(-tt / .02) * .3) * v * .5
def rubnoise(d, wet=0):
    tt = t_(d); x = bp(noise(d), 1200 if wet else 2200, 5000 if wet else 7000)
    mod = .55 + .45 * np.abs(np.sin(2 * np.pi * (100 / 60) * 2 * tt))   # strokes on eighth notes
    e = np.minimum(1, tt / .1) * np.minimum(1, (d - tt) / .15)
    return x * mod * e * (.14 if not wet else .2)
    d = .25; tt = t_(d); f = 1800 * np.exp(-tt / .03) + 600; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .05) * v * .4
def drip(v=1.):
    d = .25; tt = t_(d); f = 1800 * np.exp(-tt / .03) + 600; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .05) * v * .4
def water(d):
    x = bp(noise(d), 400, 5000) * .25 + lp(noise(d), 600) * .15; tt = t_(d)
    return x * np.minimum(1, tt / .15) * np.minimum(1, (d - tt) / .2)
def paper(v=1.):
    d = .45; tt = t_(d); return bp(noise(d), 1500, 6000) * (np.abs(np.sin(tt * 40)) ** 2) * np.exp(-tt / .2) * v * .5
def snap(v=1.):
    d = .12; tt = t_(d); return (bp(noise(d), 900, 3500) * np.exp(-tt / .015) + np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / .03) * .4) * v * .6
def pour(d):
    tt = t_(d); fc = 700 + 900 * tt / d; x = np.zeros(len(tt))
    for i in range(0, len(tt), 2400): seg_ = bp(noise(2400 / SR), fc[i] * .8, fc[i] * 1.4); x[i:i + len(seg_)] += seg_[:len(x) - i]
    return x * .25 * np.minimum(1, tt / .1) * np.minimum(1, (d - tt) / .2)
def roomtone(d): x = lp(noise(d), 300) * .05 + bp(noise(d), 300, 1200) * .015; return x
def wardbed(d):
    tt = t_(d); x = lp(noise(d), 500) * .05 + .012 * np.sin(2 * np.pi * 120 * tt)   # a quiet ward: air + monitor hum
    for k in np.arange(.8, d, 3.1): i = int(k * SR); b = .02 * np.sin(2 * np.pi * 1320 * t_(.09)) * np.exp(-t_(.09) / .03); x[i:i + len(b)] += b[:len(x) - i]   # distant monitor beep
    return x * np.minimum(1, tt / .5) * np.minimum(1, (d - tt) / .5)
def stroke(d, v=1.): return bp(noise(d), 2000, 6000) * np.minimum(1, t_(d) / .05) * np.minimum(1, (d - t_(d)) / .1) * .06 * v

for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'step': add(fx, lp(sstep(.5), 2500), t, .35, -.1)
    elif ty == 'germ': add(fx, germblip(e.get('g', 1)), t, .9, .1)
    elif ty == 'whoosh': add(fx, whoosh(e.get('d', .6), .6), t, .5)
    elif ty == 'board': add(fx, whoosh(.5, .5), t, .4); add(fx, thump(.6, 80), t + .55, .55)
    elif ty == 'flip': add(fx, glock(PENTA[e['i'] % 10] - 12 + 12 * (e['i'] // 25), .5, .8), t, .55, -.4 + .8 * (e['i'] % 10) / 9); add(fx, sclick(1.4, .3), t, .15)
    elif ty == 'click': add(fx, sclick(.6, 1.) * (1.3 if e.get('big') else 1), t, .9 if e.get('big') else .6); add(fx, lp(noise(.12), 1200) * env_exp(.12, .03), t + .03, .35)
    elif ty == 'snip': add(fx, sclick(2.2, .7), t, .5)
    elif ty == 'plink': add(fx, ceramic([2600, 3100, 2200][e['p']]), t, .7, .3)
    elif ty == 'tray': add(fx, ceramic(1800, .7), t, .5, .4)
    elif ty == 'snap': add(fx, snap(), t, .8)
    elif ty == 'thud': add(fx, thump(.8, 60), t, .7)
    elif ty == 'draw': add(fx, stroke(e['d'], 1.), t, 1.)
    elif ty == 'motif':
        for j, m in enumerate([74, 78, 81]): add(fx, glock(m, .8, 1.5), t + j * BEAT / 2, .65, .2)
    elif ty == 'rub': add(fx, rubnoise(e['d'], e.get('wet', 0)), t, 1.)
    elif ty == 'swab': add(fx, stroke(e['d'], 1.5), t, 1.)
    elif ty == 'pour': add(fx, pour(e['d']), t, 1.)
    elif ty == 'cloth': add(fx, lp(noise(.3), 2500) * env_exp(.3, .08) * .3, t, 1.)
    elif ty == 'cup': add(fx, ceramic(3000, .6), t, .5)
    elif ty == 'stepcue': add(fx, wood(.6, 1500), t, .5, -.2); add(fx, whoosh(.18, .3), t - .05, .3)
    elif ty == 'squelch': add(fx, germblip(.6) * .7, t, .6)
    elif ty == 'roomtone': add(amb, roomtone(e['d']), t, 1.)
    elif ty == 'waterbed': add(fx, water(e['d']), t, .9)
    elif ty == 'tap': add(fx, sclick(.45, 1.), t, .6); add(fx, thump(.4, 220), t, .3)
    elif ty == 'pump': add(fx, sclick(.7, 1.) * .5, t, .6); add(fx, lp(noise(.25), 900) * env_exp(.25, .05), t + .05, .4)
    elif ty == 'paper': add(fx, paper(), t, .8)
    elif ty == 'drip': add(fx, drip(), t, .7)
    elif ty == 'light': add(fx, glock([74, 76, 78, 81, 83, 86][e['i']], .8, 1.6), t, .7, -.5 + e['i'] * .2)
    elif ty == 'ward': add(amb, wardbed(e['d']), t, 1.)

# ---------------- voice ----------------
voice = np.zeros((N, 2)); vmask = np.zeros(N)
for e in [x for x in EV if x['type'] == 'vo']:
    w, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    if w.ndim > 1: w = w.mean(1)
    w = soxr.resample(w, sr, SR)
    w = hp(w, 80); w = compress(norm(w, .9), thr=.25, ratio=3.0)
    add(voice, w, e['t'], 1.0)
    i0 = int(e['t'] * SR); vmask[i0:i0 + len(w)] = 1
# ducking envelope (smooth)
from scipy.ndimage import uniform_filter1d, maximum_filter1d
vm = maximum_filter1d(vmask, int(.15 * SR)); vm = uniform_filter1d(vm, int(.2 * SR))
rms = lambda x: np.sqrt(np.mean(x[np.abs(x).sum(1) > 1e-6] ** 2)) if np.any(np.abs(x) > 1e-6) else 1e-9
vr = rms(voice); mr = rms(music)
music *= (vr / mr) * 10 ** (-10 / 20)                 # music ~10 dB under the voice by RMS
duck_m = 1 - vm * (1 - 10 ** (-8 / 20)); duck_a = 1 - vm * (1 - 10 ** (-7 / 20))
music *= duck_m[:, None]; amb *= duck_a[:, None]
fxr = rms(fx); fx *= (vr / fxr) * 10 ** (-12 / 20)
mix = voice + music + fx * (1 - vm[:, None] * .3) + amb * 1.0
# keep the two silences clean (only the click / the drip may sound there)
for a, b in [(20.7, 21.6), (89.4, 90.0)]:
    i0, i1 = int(a * SR), int(b * SR); keep = fx[i0:i1] + voice[i0:i1]; mix[i0:i1] = keep
mix = np.stack([limit(mix[:, 0], .9), limit(mix[:, 1], .9)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
mix = mix[:int(DUR * SR)]
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
# low-end check (20–120 Hz vs rest)
from scipy.signal import welch
f, P = welch(mix.mean(1), SR, nperseg=8192)
lo = 10 * np.log10(P[(f > 20) & (f < 120)].mean()); mid = 10 * np.log10(P[(f > 200) & (f < 4000)].mean())
print(f'mix.wav {DUR:.1f}s  peak {np.abs(mix).max():.2f}  low-band vs mid {lo - mid:+.1f} dB')
