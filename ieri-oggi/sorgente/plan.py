"""Edit plan shared by overlays.py, music.py and edit.py. Beat = 0.5 s (120 bpm)."""
TOPICS = ['La cartella', 'Il corridoio', 'La temperatura', 'La stanza', 'La pressione']
SEGS = []          # (clip index, start inside the clip, duration, overlay name)
t = 0.0
for p in range(5):                       # round 1: each pair, 1.5 s + 1.5 s
    for k in (0, 1): SEGS.append((p * 2 + k, 0.4, 1.5, f'r1_{p}_{k}'))
for p in range(5):                       # round 2: fast recap, 0.5 s each
    for k in (0, 1): SEGS.append((p * 2 + k, 1.9, 0.5, f'r2_{k}'))
SEGS.append((2, 0.2, 1.25, 'end1'))     # closing line over the two corridors
SEGS.append((3, 0.2, 1.75, 'end2'))
BODY = sum(s[2] for s in SEGS); ENDCARD = 2.5; DUR = BODY + ENDCARD
