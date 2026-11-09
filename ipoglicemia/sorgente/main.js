const cv = document.getElementById('c'); cv.width = 1080; cv.height = 1920; const g = cv.getContext('2d');
for (const f of ['700 40px Oleo', '40px Slab', '400 40px Jost', '500 40px Jost', '600 40px Jost', '700 40px Jost']) await document.fonts.load(f);
const dur = await (await fetch('voices/dur.json')).json();
const film = await import('./film.js');
film.init(dur); await film.loadImages();
window.DUR = film.DUR; window.EV = film.events();
window.render = t => film.render(g, t);
window.TEXTS = t => film.texts(g, t);
window.READY = true;
