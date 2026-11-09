"""Italian TTS with Kokoro, with the phonemes corrected before synthesis.
Kokoro's espeak-ng Italian front end writes unstressed i/u as the English lax vowels ɪ/ʊ (as in "bit", "book"),
which gives the voice an English accent. This script phonemizes in Italian, replaces them with the pure vowels,
applies per-word fixes, and synthesises from the phonemes.   python tools/tts_it.py lines.json out_dir"""
import sys, os, json, re
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(LIB, 'core/tts/kokoro-v1.0.onnx'), os.path.join(LIB, 'core/tts/voices-v1.0.bin'))
TEXT_FIX = [(r"\bPAI\b", "pài"), (r"l'équipe", "l'ekìp"), (r"\bOSS\b", "o esse esse")]
PH_FIX = [('ɪ', 'i'), ('ʊ', 'u')]          # pure Italian vowels
lines, out = json.load(open(sys.argv[1], encoding='utf-8')), sys.argv[2]
os.makedirs(out, exist_ok=True); dur, phon = {}, {}
for L in lines:
    t = L['text']
    for a, b in TEXT_FIX: t = re.sub(a, b, t)
    p = k.tokenizer.phonemize(t, 'it')
    for a, b in PH_FIX: p = p.replace(a, b)
    p = re.sub(r'([bcdfɡɟjklmnɲpɾrstvwzʃʒʎθðŋ])ː', r'\1\1', p)   # geminate consonant: written doubled
    p = p.replace('ː', '')                                          # vowel length: dropped (English habit)
    a, sr = k.create(p, voice=L.get('voice', 'if_sara'), speed=L.get('speed', 1.0), lang='it', is_phonemes=True)
    nz = np.where(np.abs(a) > np.abs(a).max() * .02)[0]
    a = a[max(0, nz[0] - int(.03 * sr)): nz[-1] + int(.08 * sr)]
    sf.write(os.path.join(out, L['id'] + '.wav'), a, sr); dur[L['id']] = round(len(a) / sr, 3); phon[L['id']] = p
    print(L['id'], dur[L['id']], p)
json.dump(dur, open(os.path.join(out, 'dur.json'), 'w'), indent=1)
json.dump(phon, open(os.path.join(out, 'phonemes.json'), 'w'), indent=1, ensure_ascii=False)
