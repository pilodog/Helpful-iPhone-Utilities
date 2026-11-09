// Export subtitle cues [{t0,t1,text}] from film.js (same timing as the burned-in captions).
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const film = await import(path.join(HERE, 'film.js'));
film.init(JSON.parse(fs.readFileSync(path.join(HERE, 'voices/dur.json'), 'utf8')));
fs.mkdirSync(path.dirname(process.argv[2]), { recursive: true });
fs.writeFileSync(process.argv[2], JSON.stringify(film.subtitleCues(), null, 1));
console.log('cues', film.subtitleCues().length, '→', process.argv[2]);
