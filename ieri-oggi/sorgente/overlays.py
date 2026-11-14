"""Draw the overlay PNGs (logo band + labels) at 1080×1920."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from plan import TOPICS
FD = os.path.join(HERE, '..', 'ipoglicemia', 'fonts')
def jost(px, wt=600):
    f = ImageFont.truetype(os.path.join(FD, 'Jost.ttf'), px); f.set_variation_by_axes([wt]); return f
slab = lambda px: ImageFont.truetype(os.path.join(FD, 'AlfaSlabOne-Regular.ttf'), px)
W, H, BAND = 1080, 1920, 384
AMBER, TEAL, WHITE, INK = (240, 180, 60), (0, 213, 205), (245, 244, 240), (21, 23, 26)
logo = Image.open(os.path.join(HERE, 'logo.png')).convert('RGBA')
def base():
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, BAND], fill=(36, 39, 42, 255)); d.rectangle([0, BAND - 6, W, BAND], fill=TEAL + (255,))
    lw = int(W * .83); lh = int(lw * logo.height / logo.width); im.alpha_composite(logo.resize((lw, lh), Image.LANCZOS), ((W - lw) // 2, (BAND - lh) // 2))
    # soft dark gradient at the bottom for legibility
    g = Image.new('RGBA', (W, 520), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
    for y in range(520): gd.line([(0, y), (W, y)], fill=(0, 0, 0, int(190 * (y / 520) ** 1.6)))
    im.alpha_composite(g, (0, H - 520)); return im, ImageDraw.Draw(im)
def pill(d, text, color, y=1600, px=120):
    f = slab(px); w = d.textlength(text, font=f); x = 70
    d.rounded_rectangle([x - 30, y - 20, x + w + 30, y + px + 40], radius=26, fill=color + (255,))
    d.text((x, y), text, font=f, fill=INK)
def save(im, name): im.save(os.path.join(HERE, 'ov', name + '.png'))
for p, topic in enumerate(TOPICS):
    for k, (lab, col) in enumerate([("ANNI '50", AMBER), ('OGGI', TEAL)]):
        im, d = base(); pill(d, lab, col); d.text((72, 1500), topic.upper(), font=jost(46, 700), fill=WHITE); save(im, f'r1_{p}_{k}')
for k, (lab, col) in enumerate([("ANNI '50", AMBER), ('OGGI', TEAL)]):
    im, d = base(); pill(d, lab, col); save(im, f'r2_{k}')
for name, lines, col in [('end1', ['Cambiano', 'gli strumenti.'], WHITE), ('end2', ['Non cambia', 'la cura.'], TEAL)]:
    im, d = base(); d.rectangle([0, BAND, W, H], fill=(0, 0, 0, 110))
    for i, l in enumerate(lines):
        f = slab(112); w = d.textlength(l, font=f); d.text(((W - w) / 2 + 4, 1000 + i * 130 + 5), l, font=f, fill=INK); d.text(((W - w) / 2, 1000 + i * 130), l, font=f, fill=col)
    save(im, name)
print('overlays ok')
