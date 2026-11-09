# Sorgente del video

Il film è una pagina web (`index.html` + `film.js`) che disegna ogni fotogramma in funzione del tempo, renderizzata con gli strumenti della libreria [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar).

Per ricostruirlo:

```sh
git clone https://github.com/lemomo-ai/lemo-opuscar.git
cd lemo-opuscar && sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice
cp -r <questa cartella> films/igiene-mani
sh films/igiene-mani/build.sh      # voce → eventi → mix → sottotitoli → render → mux
```

Il font Jost viene scaricato automaticamente da `build.sh`. Serve ffmpeg 7+.
