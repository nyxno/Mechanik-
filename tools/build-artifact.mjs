// Erzeugt dist/artifact.html: der Seiteninhalt ohne <!doctype>/<html>/<head>/<body>-Hülle,
// so wie ihn claude.ai-Artifacts erwarten (Titel und Styles zuerst). JS/CSS werden als Begleitdateien veröffentlicht.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = src.indexOf('<!-- artifact:start -->');
const end = src.indexOf('<!-- artifact:end -->');
if (start < 0 || end < 0) throw new Error('Marker fehlen in index.html');
let body = src.slice(start + '<!-- artifact:start -->'.length, end);
body = body.replace(/<\/head>\s*<body[^>]*>/i, '\n').replace(/<\/body>|<\/html>/gi, '').trim();
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist/artifact.html', import.meta.url), body + '\n');
console.log('dist/artifact.html geschrieben (' + body.length + ' Zeichen)');
