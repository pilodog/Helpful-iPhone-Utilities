"""Voice (Paola) + a calm original bed: soft sustained chords, a slow heartbeat pulse, a light bell on scene changes.
Music ducks under the voice.  → out/mix.wav"""
import os, json
import numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
from scipy.ndimage import uniform_filter1d, maximum_filter1d
HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']
SR = 48000; N = int((DUR + .5) * SR)
t_ = lambda d: np.arange(int(round(d * SR))) / SR
rng = np.random.default_rng(5)
lp = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)
def put(buf, x, t, g=1.):
    i = int(t * SR)
    if i < len(buf): e = min(len(buf), i + len(x)); buf[i:e] += x[:e - i] * g
def pad(ms, d):
    tt = t_(d); x = sum(np.sin(2 * np.pi * m2f(m) * tt + k) + .3 * np.sin(4 * np.pi * m2f(m) * tt) for k, m in enumerate(ms))
    return lp(x, 1800) * np.minimum(1, tt / 1.2) * np.minimum(1, (d - tt) / 1.5) * (.85 + .15 * np.sin(2 * np.pi * .25 * tt))
def keys(m, d=2.5): tt = t_(d); f = m2f(m); return (np.sin(2 * np.pi * f * tt) + .25 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / .9) * np.minimum(1, tt / .004)
def pulse(): tt = t_(.35); return np.sin(2 * np.pi * np.cumsum(46 + 30 * np.exp(-tt / .04)) / SR) * np.exp(-tt / .13)
def bell(m): tt = t_(2.0); f = m2f(m); return (np.sin(2 * np.pi * f * tt) * np.exp(-tt / .7) + .3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / .25))
PROG = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]]     # D, Bm, G, A — 4 s each
music = np.zeros(N); BAR = 4.0
for b in range(int(DUR / BAR) + 1):
    ch = PROG[b % 4]; t = b * BAR
    put(music, pad(ch, BAR + 1.5), t, .09)
    for k, m in enumerate([ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12]): put(music, keys(m), t + k, .1)
    for k in (0, 2): put(music, pulse(), t + k, .28)
for e in EV:
    if e['type'] == 'cut': put(music, bell(86), e['t'], .06)
voice = np.zeros(N); vm = np.zeros(N)
for e in EV:
    if e['type'] != 'vo': continue
    w, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    w = hp(soxr.resample(w, sr, SR), 80); w = w / np.abs(w).max() * .9
    put(voice, w, e['t']); i = int(e['t'] * SR); vm[i:i + len(w)] = 1
vm = uniform_filter1d(maximum_filter1d(vm, int(.2 * SR)), int(.25 * SR))
rms = lambda x: np.sqrt(np.mean(x[np.abs(x) > 1e-5] ** 2))
music *= rms(voice) / rms(music) * 10 ** (-9 / 20); music *= 1 - vm * (1 - 10 ** (-9 / 20))
mix = voice + music; f = int(1.2 * SR); n = int(DUR * SR); mix = mix[:n]; mix[-f:] *= np.linspace(1, 0, f) ** .5
mix = np.tanh(mix * 1.1) * .85
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); sf.write(os.path.join(HERE, 'out', 'mix.wav'), np.stack([mix, mix], 1).astype(np.float32), SR); print('mix', DUR)
