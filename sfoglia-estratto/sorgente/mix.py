"""Original West-Coast cool-jazz score (synthesised vibraphone, walking pizzicato bass, brushes, ride, celesta),
foley from events.json, voice, ducking, two hard silences → out/mix.wav.   Run: $LIB/.venv/bin/python mix.py"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
from scipy.ndimage import uniform_filter1d, maximum_filter1d
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, compress, limit, add, whoosh, thump, click as sclick

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']
N = int((DUR + 1) * SR); BEAT = .5; SW = .62           # 120 bpm, swung eighths (2:1-ish)
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)
def fade_in(x, n): n = min(n, len(x)); x[:n] *= np.linspace(0, 1, n); return x

# ---------------- instruments ----------------
def vibe(m, v=1., d=2.2, trem=True):
    f = m2f(m); tt = t_(d)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 1.1) + .3 * np.sin(2 * np.pi * f * 4 * tt) * np.exp(-tt / .25) + .08 * np.sin(2 * np.pi * f * 10 * tt) * np.exp(-tt / .05)
    if trem: x *= .82 + .18 * np.sin(2 * np.pi * 5.5 * tt)
    return fade_in(x, 60) * v * .22
def celesta(m, v=1., d=1.2):
    f = m2f(m); tt = t_(d); x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .45) + .4 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt / .2) + .15 * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt / .1)
    return fade_in(x, 40) * v * .18
def bass(m, v=1., d=.55):
    f = m2f(m); tt = t_(d)
    x = (np.sin(2 * np.pi * f * tt) + .45 * np.sin(2 * np.pi * 2 * f * tt) + .2 * np.sin(2 * np.pi * 3 * f * tt)) * np.exp(-tt / .3)
    x += hp(noise(d), 1500) * np.exp(-tt / .008) * .15     # the pluck
    return lp(fade_in(x, 30), 1100) * v * .13
def brush_tap(v=1.): d = .18; return bp(noise(d), 1500, 7000) * np.exp(-t_(d) / .05) * v * .12
def swish(d=.5, v=1.): tt = t_(d); return bp(noise(d), 2500, 8000) * np.sin(np.pi * tt / d) ** 2 * v * .035
def ride(v=1.): d = .5; tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) for f in [5200, 6340, 7810, 9120]) / 4 * np.exp(-tt / .18) + hp(noise(d), 7000) * np.exp(-tt / .05) * .5; return x * v * .025
def kickb(v=1.): d = .2; tt = t_(d); f = 55 + 45 * np.exp(-tt / .03); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .07) * v * .14

CH = {'Dm7': [62, 65, 69, 72], 'G7': [59, 62, 65, 69], 'Cmaj7': [60, 64, 67, 71], 'A7': [61, 64, 67, 70], 'Fmaj7': [60, 64, 65, 69], 'Em7': [59, 62, 64, 67]}
ROOT = {'Dm7': 38, 'G7': 43, 'Cmaj7': 36, 'A7': 45, 'Fmaj7': 41, 'Em7': 40}
PROG = ['Dm7', 'G7', 'Cmaj7', 'A7']
music = np.zeros((N, 2))
def put(x, t, g=1., pan=0.): add(music, x, t, g, pan)

def combo(t0, t1, vibes=True, drums=True, walk=True, ride_on=True, dens=1.):
    nbar = int(round((t1 - t0) / (4 * BEAT)))
    for b in range(nbar):
        ch = PROG[b % 4]; tb = t0 + b * 4 * BEAT; notes = CH[ch]; r = ROOT[ch]
        if walk:
            line = [r, r + 4 if 'maj' in ch or ch in ('G7', 'A7') else r + 3, r + 7, r + 9 if b % 2 else r + 5]
            for i, m in enumerate(line): put(bass(m, .95 if i == 0 else .8), tb + i * BEAT, 1., -.1)
        if vibes:   # comping on the "and" of 2 and on 4
            for off, v in [(1 + SW, .8), (3, .6)]:
                for k, m in enumerate(notes): put(vibe(m + 12 * (k == 0), v * .55, 1.4), tb + off * BEAT, 1., .25 - k * .12)
        if drums:
            for i in range(4): put(swish(BEAT, dens), tb + i * BEAT, 1., .3)
            put(brush_tap(.9 * dens), tb + BEAT, 1., .2); put(brush_tap(.9 * dens), tb + 3 * BEAT, 1., .2)
            put(kickb(.6), tb, 1.)
        if ride_on:
            for i in range(4):
                put(ride(.9), tb + i * BEAT, 1., .45)
                if i in (1, 3): put(ride(.55), tb + (i + SW) * BEAT, 1., .45)

META = next(e for e in EV if e['type'] == 'meta'); END = META['end']
combo(.6, END - .4, dens=.8)
for k, m in enumerate([62, 65, 69, 72, 76]): put(vibe(m, .9, 3.0), END + k * .06, 1., -.3 + k * .15)
put(bass(38, 1., 2.5), END, 1.)
for k, m in enumerate([84, 88, 91, 96]): put(celesta(m, .8), END + .2 + k * .15, 1., .3)
SIL = []

# ---------------- foley ----------------
fx = np.zeros((N, 2)); amb = np.zeros((N, 2))
def glassy(f=2600, v=1., d=.6): tt = t_(d); return sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / tau) for r, a, tau in [(1, 1, .15), (2.71, .5, .07), (5.2, .3, .03)]) * v * .3
def crack():
    d = .7; tt = t_(d); x = hp(noise(d), 2500) * np.exp(-tt / .015) * .8
    for k in range(9): i = int((.01 + k * .035 + np.random.default_rng(k).random() * .02) * SR); b = hp(noise(.02), 3000) * np.exp(-t_(.02) / .004); x[i:i + len(b)] += b * (1 - k / 10)
    return x * .6 + glassy(3100, .6, d)
def sip(): d = .35; tt = t_(d); return bp(noise(d), 300, 1500) * np.sin(np.pi * tt / d) ** 2 * .25
def cough(g=1.):   # two soft bursts with a vowel-ish formant, cartoonish not harsh
    out = np.zeros(int(.6 * SR))
    for k, at in enumerate([0, .22]):
        d = .2; tt = t_(d); f0 = 180 - k * 20
        x = (bp(noise(d), 500, 1800) * .7 + np.sin(2 * np.pi * f0 * tt) * .5) * np.exp(-tt / .06) * np.minimum(1, tt / .005)
        i = int(at * SR); out[i:i + len(x)] += x * (1 - .3 * k)
    return out * g * .55
def gurgle(d):
    x = np.zeros(int(d * SR)); r = np.random.default_rng(5)
    for k in np.arange(0, d, .07):
        f = 300 + r.random() * 500; dd = .06; tt = t_(dd); b = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * tt / dd)) / SR) * np.exp(-tt / .02)
        i = int(k * SR); x[i:i + len(b)] += b[:len(x) - i] * (.5 + .5 * r.random())
    return lp(x, 2500) * .25
def stamp(big=0):
    x = thump(.8 + .3 * big, 90) * .6; n = lp(noise(.08), 2500) * env_exp(.08, .015) * .5; x[:len(n)] += n; return x
def paper(): d = .3; tt = t_(d); return bp(noise(d), 1200, 6000) * np.sin(np.pi * tt / d) ** 2 * .18
def pop(): d = .12; tt = t_(d); f = 500 + 900 * tt / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .04) * .35
def gulp(): d = .22; tt = t_(d); f = 260 - 140 * tt / d; return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .07) + lp(noise(d), 600) * np.exp(-tt / .03) * .3) * .55
def bell(): d = 1.6; tt = t_(d); return sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau) for f, a, tau in [(1760, 1, .7), (4400, .5, .3), (2640, .4, .5), (6100, .2, .12)]) * .22
def tick(): return sclick(1.3, .6) * .4
def drop_fall(d):
    tt = t_(d); f = 1400 * np.exp(-tt / (d * .5)) + 300; return np.sin(2 * np.pi * np.cumsum(f) / SR) * .08 * np.exp(-tt / d)
def typekey(): return sclick(2.0, .5) * .25
def roomtone(d): return lp(noise(d), 280) * .04
STEPCH = [[62, 65, 69], [64, 67, 71], [65, 69, 72], [67, 71, 74], [69, 72, 76], [71, 74, 77], [72, 76, 79], [74, 77, 81], [76, 79, 83]]
def pageflip():
    d = .5; tt = t_(d); return bp(noise(d), 900, 6500) * (np.sin(np.pi * tt / d) ** 1.5) * (.6 + .4 * np.abs(np.sin(tt * 45))) * .32
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'flip': add(fx, pageflip(), t, 1.)
    elif ty == 'pop': add(fx, pop(), t, .6)
    elif ty == 'whoosh': add(fx, whoosh(.5, .5), t, .4)
    elif ty == 'tick': add(fx, tick(), t, .35)
    elif ty == 'chord':
        for k, m in enumerate(STEPCH[e['i'] % len(STEPCH)]): add(fx, vibe(m + 12, .9, 1.6, False), t, .4, -.2 + k * .2)
add(amb, roomtone(DUR), 0, 1.)

# ---------------- voice ----------------
voice = np.zeros((N, 2)); vmask = np.zeros(N)
for e in [x for x in EV if x['type'] == 'vo']:
    w, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    if w.ndim > 1: w = w.mean(1)
    w = compress(norm(hp(soxr.resample(w, sr, SR), 80), .9), thr=.25, ratio=3.)
    add(voice, w, e['t'], 1.); i0 = int(e['t'] * SR); vmask[i0:i0 + len(w)] = 1
vm = uniform_filter1d(maximum_filter1d(vmask, int(.15 * SR)), int(.2 * SR))
def rms(x): m = np.abs(x).sum(1) > 1e-6; return np.sqrt(np.mean(x[m] ** 2)) if m.any() else 1e-9
vr = rms(voice)
music *= (vr / rms(music)) * 10 ** (-11 / 20); music *= (1 - vm * (1 - 10 ** (-8 / 20)))[:, None]
fx *= (vr / rms(fx)) * 10 ** (-9 / 20)
amb *= (1 - vm * (1 - 10 ** (-7 / 20)))[:, None]
mix = voice + music + fx + amb
for a, b in SIL: mix[int(a * SR):int(b * SR)] = 0    # digital silence
mix = np.stack([limit(mix[:, 0], .9), limit(mix[:, 1], .9)], 1)[:int(DUR * SR)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
from scipy.signal import welch
f, P = welch(mix.mean(1), SR, nperseg=8192); lo = 10 * np.log10(P[(f > 20) & (f < 120)].mean()); mid = 10 * np.log10(P[(f > 200) & (f < 4000)].mean())
print(f'mix.wav {DUR:.1f}s peak {np.abs(mix).max():.2f} low vs mid {lo - mid:+.1f} dB')
