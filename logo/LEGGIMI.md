# Logo «Una domanda al giorno… toglie il concorso di torno…»

Ricostruzione vettoriale del logo originale (`original.png`, 500×373) e della schermata finale (`finale-originale.jpg`, 768×1376): nitidi a qualsiasi dimensione.

## File

| File | Uso |
|---|---|
| `logo-3600.png` (3360×600), `logo-1800.png` (1680×300) | logo per sfondi chiari, PNG trasparente (titolo bianco con contorno grigio) |
| `finale-verticale.png` (1080×1920), `finale-orizzontale.png` (1920×1080) | schermata finale: sfondo ardesia scuro, logo in rilievo al centro |
| `logo.html` + `render.mjs`, `endcard.html` + `render-endcard.mjs` | sorgenti modificabili (SVG) e script che rigenerano i PNG |
| `fonts/` | Oxanium (titolo) e Arimo (sottotitolo), SIL Open Font License 1.1 |

## Regole per ogni video

1. **Logo in alto, al centro, per tutto il video.**
   - Verticale 1080×1920: logo largo l'**83 %** della larghezza (≈ 900 px), centrato nella fascia superiore alta 1/5 dello schermo (0–384 px). La fascia resta libera da titoli e scene.
   - Orizzontale 1920×1080: stessa fascia (1/5 dell'altezza, 0–216 px), logo largo ≈ 45 % (alto ≈ 150 px), centrato.
   - Su sfondi chiari si usa la versione con contorno; su sfondi scuri la versione piena (quella della schermata finale).
2. **Schermata finale alla fine di ogni video**: `finale-verticale.png` o `finale-orizzontale.png`, tenuta circa 3 secondi con dissolvenza in entrata, sull'accordo finale della musica. Nella versione verticale il logo è largo l'83 % (come nell'originale), in quella orizzontale il 60 %.

Differenza voluta rispetto all'originale: il contorno grigio del titolo è un po' più scuro, perché resti leggibile anche su sfondi chiari.
