# Sorgente del video

Pagina web (`index.html` + `film.js`) disegnata fotogramma per fotogramma, renderizzata con la libreria [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar).

```sh
git clone https://github.com/lemomo-ai/lemo-opuscar.git
cd lemo-opuscar && sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice
cp -r <questa cartella> films/disfagia
# font (OFL): Alfa Slab One, Oleo Script Bold, Jost → films/disfagia/fonts/ (vedi styles/midcentury-toon/demo/tools/fonts.sh)
sh films/disfagia/build.sh
```
Serve ffmpeg 7+.
