"""Storyboard sheet with captions: python tools/storyboard.py out.jpg"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(HERE)
SHOTS = [
 (2.5,  '1 · Gancio', 'Wide, camera ferma → follow', '0–8 s', 'Le mani di chi assiste sono il primo strumento di cura. / I germi viaggiano sulla mano (scia corallo).'),
 (10.8, '2 · Gancio', 'Push-in sulla mano, focus + context', '8–12 s', 'Ma possono anche portare i germi da un paziente all\'altro.'),
 (19.8, '3 · Il numero', 'Tavola Isotype, lenta spinta', '12–21.6 s', 'OMS: fino al 50% delle infezioni evitabili. Poi silenzio, e il clic dell\'erogatore.'),
 (27.6, '4 · Mani pronte', 'Wide + riquadro circolare', '21.6–29 s', 'Unghie corte e senza smalto, niente anelli, bracciali o orologio.'),
 (32.2, '5 · I guanti', 'Riquadro circolare', '29–34 s', 'I guanti non sostituiscono l\'igiene delle mani.'),
 (61.0, '6 · I 5 momenti', 'Medium, pan che segue l\'OSS', '34–62 s', 'Zona paziente tratteggiata; i 5 pin si accumulano: la stanza diventa l\'infografica.'),
 (71.6, '7 · Frizione', 'Push sull\'OSS + riquadro', '62–76 s', 'Gel 20–30 s: 6 movimenti, timer che si riempie.'),
 (87.8, '8 · Acqua e sapone', 'Cambio tavola: lavandino', '76–90 s', '40–60 s: bagna, sapone, strofina, risciacqua, asciuga, chiudi con la salvietta.'),
 (100.5,'9 · Finale', 'Pull-out logaritmico sul reparto', '90–102 s', 'La scia si ferma all\'erogatore; erogatori teal in ogni stanza; legenda.'),
]
def font(sz, bold=False):
    p = os.path.join(D, 'fonts', 'Jost.ttf'); f = ImageFont.truetype(p, sz)
    try: f.set_variation_by_axes([600 if bold else 400])
    except Exception: pass
    return f
W, cols = 620, 3; H = W * 1080 // 1920; cap = 96
rows = (len(SHOTS) + cols - 1) // cols
S = Image.new('RGB', (cols * W + (cols + 1) * 16, 90 + rows * (H + cap + 16)), (236, 238, 240)); d = ImageDraw.Draw(S)
d.text((16, 24), 'Mani pulite, cura sicura — storyboard (frame renderizzati con il codice reale)', fill=(42, 39, 51), font=font(30, True))
for i, (t, name, frame, dur, line) in enumerate(SHOTS):
    im = Image.open(os.path.join(D, 'stills', f'sb_{t}.jpg')).convert('RGB').resize((W, H))
    x = 16 + (i % cols) * (W + 16); y = 90 + (i // cols) * (H + cap + 16)
    S.paste(im, (x, y))
    d.text((x, y + H + 8), f'{name}   ·   {dur}', fill=(42, 39, 51), font=font(22, True))
    d.text((x, y + H + 36), frame, fill=(47, 163, 154), font=font(18, True))
    # wrap line
    words, L, cur = line.split(' '), [], ''
    for w_ in words:
        n = (cur + ' ' + w_).strip()
        if d.textlength(n, font=font(18)) > W: L.append(cur); cur = w_
        else: cur = n
    L.append(cur)
    for j, l in enumerate(L[:2]): d.text((x, y + H + 58 + j * 20), l, fill=(70, 66, 80), font=font(18))
S.save(sys.argv[1], quality=90); print(sys.argv[1], S.size)
