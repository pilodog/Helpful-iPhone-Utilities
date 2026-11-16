const cv = document.getElementById('c'); cv.width = 1080; cv.height = 1920; const g = cv.getContext('2d');
for (const f of ['400 40px DVC', '700 40px DVC']) await document.fonts.load(f);
const film = await import('./film.js'); await film.loadImages();
window.DUR = film.DUR; window.EV = [];
window.render = t => film.render(g, t);
window.TEXTS = t => film.texts(g, t);
window.READY = true;
