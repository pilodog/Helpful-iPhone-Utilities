"""Italian TTS with a native Italian voice (Piper "paola", medium).
python tts_paola.py lines.json out_dir     lines = [{id, text, say?, speed?}]  → <id>.wav (trimmed) + dur.json"""
import sys, os, json, re, wave, io
import numpy as np, soundfile as sf
from piper import PiperVoice, SynthesisConfig
HERE = os.path.dirname(os.path.abspath(__file__)); M = os.path.join(HERE, 'vits-piper-it_IT-paola-medium', 'it_IT-paola-medium.onnx')
v = PiperVoice.load(M, config_path=M + '.json')
FIX = [(r"\bPAI\b", "pài"), (r"l'équipe", "l'echìp"), (r"mg/dl", "milligrammi per decilitro"), (r"\bOSS\b", "operatore socio sanitario")]
lines, out = json.load(open(sys.argv[1], encoding='utf-8')), sys.argv[2]
os.makedirs(out, exist_ok=True); dur = {}
for L in lines:
    t = L.get('say') or L['text']
    for a, b in FIX: t = re.sub(a, b, t)
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w: v.synthesize_wav(t, w, syn_config=SynthesisConfig(length_scale=1.0 / L.get('speed', 1.0)))
    buf.seek(0); a, sr = sf.read(buf); a = a.astype(np.float32)
    nz = np.where(np.abs(a) > np.abs(a).max() * .02)[0]; a = a[max(0, nz[0] - int(.03 * sr)): nz[-1] + int(.08 * sr)]
    sf.write(os.path.join(out, L['id'] + '.wav'), a, sr); dur[L['id']] = round(len(a) / sr, 3); print(L['id'], dur[L['id']], t)
json.dump(dur, open(os.path.join(out, 'dur.json'), 'w'), indent=1)
