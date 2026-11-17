const reel = new URLSearchParams(location.search).get('reel') || 'a';
const cv = document.getElementById('c'); cv.width = 1080; cv.height = 1920; const g = cv.getContext('2d');
for (const f of ['500 40px Jost', '600 40px Jost', '700 40px Jost']) await document.fonts.load(f);
const dur = await (await fetch(`voices/dur_${reel}.json`)).json();
const film = await import('./film.js'); film.init(reel, dur); await film.loadImages();
window.DUR = film.DUR; window.EV = film.events();
window.render = t => film.render(g, t);
window.TEXTS = t => film.texts(g, t);
window.READY = true;
