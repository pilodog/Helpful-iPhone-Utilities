"""Rhythmic original track (synthesised): four-on-the-floor kick, clap on 2 and 4, shaker, bass, vibraphone stabs.
Vintage segments are low-passed like an old radio; modern ones open up. A click on every cut.  → out/mix.wav"""
import os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from plan import SEGS, BODY, DUR
SR = 48000; N = int((DUR + .5) * SR); BEAT = .5
t_ = lambda d: np.arange(int(round(d * SR))) / SR
rng = np.random.default_rng(3); noise = lambda d: rng.standard_normal(int(round(d * SR)))
bp = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
lp = lambda x, f: sosfilt(butter(4, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)
def put(buf, x, t, g=1.):
    i = int(t * SR)
    if i >= len(buf): return
    e = min(len(buf), i + len(x)); buf[i:e] += x[:e - i] * g
def kick(): tt = t_(.3); f = 48 + 90 * np.exp(-tt / .035); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .11)
def clap(): tt = t_(.2); return bp(noise(.2), 900, 3500) * (np.exp(-tt / .05) + .5 * np.exp(-((tt - .012) ** 2) / 2e-5))
def hat(): tt = t_(.06); return hp(noise(.06), 7000) * np.exp(-tt / .015)
def bass(m, d=.42): tt = t_(d); f = m2f(m); return (np.sin(2 * np.pi * f * tt) + .4 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / .22) * np.minimum(1, tt / .005)
def vibe(m, d=1.2): tt = t_(d); f = m2f(m); return (np.sin(2 * np.pi * f * tt) * np.exp(-tt / .5) + .3 * np.sin(8 * np.pi * f * tt) * np.exp(-tt / .12)) * np.minimum(1, tt / .003)
PROG = [([57, 60, 64, 67], 45), ([53, 57, 60, 64], 41), ([48, 52, 55, 59], 36), ([55, 59, 62, 65], 43)]   # Am7 Fmaj7 Cmaj7 G7
drums = np.zeros(N); mus = np.zeros(N)
nb = int(BODY / BEAT)
for b in range(nb):
    t = b * BEAT; ch, root = PROG[(b // 4) % 4]; fast = 15.0 <= t < 20.0
    put(drums, kick(), t, .9)
    if b % 2 == 1: put(drums, clap(), t, .45)
    for k in range(4 if fast else 2): put(drums, hat(), t + k * BEAT / (4 if fast else 2), .16 if k % 2 == 0 else .1)
    put(mus, bass(root if b % 2 == 0 else root + 12), t, .5); put(mus, bass(root + 7, .2), t + BEAT * .75, .3)
    if b % 4 in (0, 3) or fast:
        for m in ch: put(mus, vibe(m + 12), t + (BEAT / 2 if b % 4 == 3 else 0), .12)
x = drums + mus
# per-segment colour: vintage = old radio (band-limited), modern = full range; a click on each cut
old = bp(x, 250, 2600) * 1.5 + bp(noise(N / SR), 2000, 6000)[:N] * .006
y = np.zeros(N); t = 0; fade = int(.01 * SR)
for i, (clip, s, d, name) in enumerate(SEGS):
    a, b = int(t * SR), int((t + d) * SR); vintage = clip % 2 == 0 and not name.startswith('end')
    seg = (old if vintage else x)[a:b].copy(); seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade); y[a:b] += seg
    tt = t_(.05); put(y, hp(noise(.05), 3000) * np.exp(-tt / .008), t, .25); t += d
# end card: a held chord and a soft thump
for k, m in enumerate([57, 60, 64, 67, 72]): put(y, vibe(m + 12, 2.4), BODY + k * .04, .16)
put(y, kick(), BODY, .9); put(y, bass(33, 1.5), BODY, .5)
y = np.tanh(y * 1.3) * .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), np.stack([y, y], 1)[:int(DUR * SR)].astype(np.float32), SR); print('mix', DUR)
