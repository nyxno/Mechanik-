// Eigene Unterlagen: Speichern (IndexedDB, optional Artifact-db/assets), Text auslesen (PDF, PPTX, DOCX, Bilder, Text),
// Volltextsuche über Abschnitte und Verknüpfung mit den Lernthemen.
import { platform, onPlatformReady } from './platform.js';
import { ask, canSendImages, maxImages } from './ai.js';
import { uuid } from '../util/dom.js';

const DB_NAME = 'mechanik-docs';
let idb = null;
const listeners = new Set();
let cache = [];

function openIdb() {
  if (idb) return Promise.resolve(idb);
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('docs', { keyPath: 'id' }); };
    req.onsuccess = () => { idb = req.result; res(idb); };
    req.onerror = () => rej(req.error);
  });
}
function tx(mode, fn) {
  return openIdb().then((db) => new Promise((res, rej) => {
    const t = db.transaction('docs', mode);
    const store = t.objectStore('docs');
    const r = fn(store);
    t.oncomplete = () => res(r && r.result !== undefined ? r.result : undefined);
    t.onerror = () => rej(t.error);
  }));
}

export function onDocsChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { for (const fn of listeners) { try { fn(cache); } catch (e) { console.error(e); } } }

export async function loadDocs() {
  try {
    const all = await tx('readonly', (s) => s.getAll());
    cache = (all || []).sort((a, b) => b.addedAt - a.addedAt);
  } catch (e) { console.warn('IndexedDB nicht verfügbar', e); cache = []; }
  rebuildIndex();
  emit();
  return cache;
}
export function docs() { return cache; }
export function getDoc(id) { return cache.find((d) => d.id === id); }

export async function saveDoc(doc) {
  doc.updatedAt = Date.now();
  try { await tx('readwrite', (s) => s.put(doc)); } catch (e) { console.warn(e); }
  const i = cache.findIndex((d) => d.id === doc.id);
  if (i >= 0) cache[i] = doc; else cache.unshift(doc);
  rebuildIndex();
  emit();
  mirrorRemote(doc).catch(() => {});
  return doc;
}
export async function removeDoc(id) {
  try { await tx('readwrite', (s) => s.delete(id)); } catch (e) { console.warn(e); }
  const d = getDoc(id);
  cache = cache.filter((x) => x.id !== id);
  rebuildIndex();
  emit();
  if (d) removeRemote(d).catch(() => {});
}

// ---------------- Artifact-Speicher (gleiche Unterlagen auf allen Geräten) ----------------
const PART = 150000; // Zeichen je Dokument im db-Speicher (Limit 256 KiB je Dokument)
function remoteCol() {
  if (!platform.db || !platform.uid) return null;
  return platform.db.doc('data/users/' + platform.uid + '/profile').collection('docs');
}
async function mirrorRemote(doc) {
  const col = remoteCol();
  if (!col) return;
  const text = doc.text || '';
  const parts = [];
  for (let i = 0; i < Math.max(1, Math.ceil(text.length / PART)); i++) parts.push(text.slice(i * PART, (i + 1) * PART));
  const meta = { ...doc, text: parts[0], parts: parts.length, blob: undefined, thumb: undefined };
  delete meta.blob; delete meta.thumb;
  await col.doc(doc.id).set(meta);
  for (let i = 1; i < parts.length; i++) await col.doc(doc.id + '__p' + i).set({ part: i, text: parts[i], of: doc.id });
}
async function removeRemote(doc) {
  const col = remoteCol();
  if (!col) return;
  await col.doc(doc.id).delete();
  for (let i = 1; i < (doc.parts || 1); i++) await col.doc(doc.id + '__p' + i).delete().catch(() => {});
}
onPlatformReady(async () => {
  const col = remoteCol();
  if (!col) return;
  try {
    const snap = await col.get();
    const rows = (snap && snap.docs) ? snap.docs.map((d) => d.data()) : [];
    const mains = rows.filter((r) => r && r.id && !r.of);
    const parts = rows.filter((r) => r && r.of);
    let changed = false;
    for (const m of mains) {
      const local = getDoc(m.id);
      if (local && (local.updatedAt || 0) >= (m.updatedAt || 0)) continue;
      let text = m.text || '';
      for (let i = 1; i < (m.parts || 1); i++) {
        const p = parts.find((x) => x.of === m.id && x.part === i);
        if (p) text += p.text;
      }
      const doc = { ...m, text };
      try { await tx('readwrite', (s) => s.put(doc)); } catch { /* ignore */ }
      const i = cache.findIndex((d) => d.id === doc.id);
      if (i >= 0) cache[i] = doc; else cache.push(doc);
      changed = true;
    }
    if (changed) { cache.sort((a, b) => b.addedAt - a.addedAt); rebuildIndex(); emit(); }
  } catch (e) { console.warn('Dokumente konnten nicht geladen werden', e); }
});

// ---------------- Externe Bibliotheken bei Bedarf laden ----------------
const loaded = {};
function loadScript(url) {
  if (loaded[url]) return loaded[url];
  loaded[url] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url; s.async = true;
    s.onload = () => res();
    s.onerror = () => rej(new Error('Bibliothek konnte nicht geladen werden: ' + url));
    document.head.append(s);
  });
  return loaded[url];
}
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const JSZIP = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

// ---------------- Text auslesen ----------------
/**
 * @returns {Promise<{text:string, pages:number, kind:string, images?:Blob[], scanned?:boolean}>}
 */
export async function extractText(file, onProgress = () => {}) {
  const name = (file.name || '').toLowerCase();
  const type = file.type || '';
  if (type.startsWith('image/')) {
    return { text: '', pages: 1, kind: 'image', images: [file], scanned: true };
  }
  if (type === 'application/pdf' || name.endsWith('.pdf')) return extractPdf(file, onProgress);
  if (name.endsWith('.pptx')) return extractOffice(file, 'pptx');
  if (name.endsWith('.docx')) return extractOffice(file, 'docx');
  if (type.startsWith('text/') || /\.(txt|md|csv)$/.test(name)) {
    return { text: await file.text(), pages: 1, kind: 'text' };
  }
  throw new Error('Dateityp wird nicht unterstützt. Möglich: PDF, PPTX, DOCX, Bilder (JPG/PNG), Textdateien.');
}

async function extractPdf(file, onProgress) {
  await loadScript(PDFJS);
  const lib = window.pdfjsLib;
  lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await lib.getDocument({ data }).promise;
  let text = '';
  const pageTexts = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    onProgress(`Seite ${p} von ${pdf.numPages} wird gelesen …`);
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let last = null, s = '';
    for (const it of content.items) {
      if (last && Math.abs((it.transform[5] || 0) - (last.transform[5] || 0)) > 3) s += '\n';
      else if (last && it.str && !/^\s/.test(it.str) && !/\s$/.test(last.str)) s += ' ';
      s += it.str; last = it;
    }
    pageTexts.push(s.trim());
  }
  const avg = pageTexts.reduce((a, b) => a + b.length, 0) / Math.max(1, pageTexts.length);
  const scanned = avg < 60;
  let images = [];
  if (scanned) {
    // Gescannte Seiten: als Bilder rendern, Text liest dann die KI (OCR)
    const maxPages = Math.min(pdf.numPages, 12);
    for (let p = 1; p <= maxPages; p++) {
      onProgress(`Seite ${p} wird als Bild vorbereitet …`);
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 1.4 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      images.push(blob);
    }
  }
  text = pageTexts.map((t, i) => `[Seite ${i + 1}]\n${t}`).join('\n\n');
  return { text, pages: pdf.numPages, kind: 'pdf', images, scanned };
}

async function extractOffice(file, kind) {
  await loadScript(JSZIP);
  const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
  const strip = (xml) => xml.replace(/<a:br\s*\/>/g, '\n').replace(/<\/a:p>|<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
  if (kind === 'docx') {
    const f = zip.file('word/document.xml');
    if (!f) throw new Error('Kein Dokumenttext gefunden.');
    const xml = await f.async('string');
    return { text: strip(xml).replace(/\n{3,}/g, '\n\n').trim(), pages: 1, kind: 'docx' };
  }
  const slides = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => parseInt(a.match(/\d+/g).pop()) - parseInt(b.match(/\d+/g).pop()));
  let out = '';
  for (let i = 0; i < slides.length; i++) {
    const xml = await zip.file(slides[i]).async('string');
    const texts = Array.from(xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)).map((m) => m[1]);
    const t = strip(texts.join(' | '));
    out += `[Folie ${i + 1}]\n${t}\n\n`;
  }
  return { text: out.trim(), pages: slides.length, kind: 'pptx' };
}

/** Bilder/Scans über die KI in Text übertragen (Formeln, Zahlen, Skizzenbeschreibung). */
export async function transcribeImages(images, onProgress = () => {}) {
  if (!canSendImages()) throw new Error('Bilder können mit der aktuellen KI-Einstellung nicht gelesen werden.');
  const per = Math.max(1, Math.min(maxImages(), 4));
  let text = '';
  for (let i = 0; i < images.length; i += per) {
    const batch = images.slice(i, i + per);
    onProgress(`KI liest Bild ${i + 1}–${Math.min(images.length, i + per)} von ${images.length} …`);
    const res = await ask({
      system: 'Du bist ein sorgfältiger Transkriptionsassistent für Lernunterlagen aus Mechanik/Technik (Werkmeisterschule, deutsch).',
      turns: [{ role: 'user', content: `Übertrage den gesamten Inhalt der ${batch.length === 1 ? 'Abbildung' : batch.length + ' Abbildungen'} in Text: alle Überschriften, Texte, Formeln (in Klartext wie F = m * a), Zahlenwerte mit Einheiten und Ergebnisse. Beschreibe Skizzen kurz in eckigen Klammern (z. B. [Skizze: Träger auf zwei Stützen, Last F1 bei 500 mm]). Handschrift so gut wie möglich lesen. Keine Kommentare, nur der Inhalt. Trenne mehrere Bilder mit einer Zeile "---".` }],
      images: batch,
    });
    text += (text ? '\n\n---\n\n' : '') + res.text;
  }
  return text;
}

// ---------------- Analyse: Zusammenfassung, Themen, Formeln ----------------
export async function analyzeDoc(doc, topics) {
  const topicList = topics.map((t) => `${t.id}: ${t.title}`).join('\n');
  const text = (doc.text || '').slice(0, 60000);
  const res = await ask({
    system: 'Du analysierst Lernunterlagen für Mechanik und technische Grundlagen (Werkmeisterschule, Österreich). Antworte ausschließlich mit JSON.',
    turns: [{ role: 'user', content: `Analysiere die Unterlage "${doc.name}" und liefere genau dieses JSON:
{
 "title": "kurzer sprechender Titel",
 "summary": "3-5 Sätze: Was wird behandelt, welche Methode wird verwendet",
 "topicIds": ["ids aus der Themenliste, die inhaltlich passen (1-4)"],
 "formulas": ["Formel in Klartext – kurze Bedeutung", "..."],
 "keyPoints": ["wichtige Regel/Merksatz", "..."],
 "examples": [{"title":"Name des Beispiels in der Unterlage","given":"gegeben…","wanted":"gesucht…","result":"Ergebnis falls vorhanden"}],
 "exercises": [{"question":"neue Übungsaufgabe im Stil der Unterlage mit konkreten Zahlen","solution":"Lösungsweg Schritt für Schritt mit Ergebnis"}]
}
Liefere 2-4 Übungsaufgaben. Themenliste:
${topicList}

Inhalt der Unterlage:
${text}` }],
    json: true,
    tier: 'default',
  });
  const j = res.json || {};
  return {
    title: typeof j.title === 'string' ? j.title : doc.name,
    summary: typeof j.summary === 'string' ? j.summary : '',
    topicIds: Array.isArray(j.topicIds) ? j.topicIds.filter((id) => topics.some((t) => t.id === id)) : [],
    formulas: Array.isArray(j.formulas) ? j.formulas.map(String).slice(0, 20) : [],
    keyPoints: Array.isArray(j.keyPoints) ? j.keyPoints.map(String).slice(0, 15) : [],
    examples: Array.isArray(j.examples) ? j.examples.slice(0, 10) : [],
    exercises: Array.isArray(j.exercises) ? j.exercises.filter((e) => e && e.question).slice(0, 6) : [],
  };
}

/** Themen-Zuordnung ohne KI über Schlüsselwörter (Fallback). */
export function guessTopics(text, topics) {
  const t = (text || '').toLowerCase();
  const hits = [];
  for (const tp of topics) {
    let score = 0;
    for (const kw of tp.keywords || []) {
      const n = t.split(kw.toLowerCase()).length - 1;
      score += n;
    }
    if (score > 0) hits.push({ id: tp.id, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 4).map((h) => h.id);
}

// ---------------- Suche ----------------
let index = [];
function tokenize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, ' ').split(' ').filter((w) => w.length > 2);
}
function rebuildIndex() {
  index = [];
  for (const d of cache) {
    const text = d.text || '';
    const paras = text.split(/\n\s*\n|\[(?:Seite|Folie) \d+\]/).map((p) => p.trim()).filter(Boolean);
    let page = 1;
    const pageMarks = Array.from(text.matchAll(/\[(?:Seite|Folie) (\d+)\]/g));
    for (const p of paras) {
      const pos = text.indexOf(p);
      for (const m of pageMarks) if (m.index < pos) page = +m[1];
      const chunk = p.length > 900 ? p.slice(0, 900) : p;
      index.push({ docId: d.id, docName: d.title || d.name, page, text: chunk, tokens: new Set(tokenize(chunk)) });
    }
  }
}
export function searchDocs(query, k = 6, topicIds = null) {
  const q = tokenize(query);
  if (!q.length) return [];
  const out = [];
  for (const c of index) {
    if (topicIds && topicIds.length) {
      const d = getDoc(c.docId);
      if (d && d.topicIds && d.topicIds.length && !d.topicIds.some((id) => topicIds.includes(id))) continue;
    }
    let s = 0;
    for (const w of q) {
      if (c.tokens.has(w)) s += 2;
      else for (const t of c.tokens) { if (t.startsWith(w) || w.startsWith(t) && t.length > 3) { s += 1; break; } }
    }
    if (s > 0) out.push({ ...c, score: s / Math.sqrt(c.text.length / 200 + 1) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, k);
}
export function chunksForTopic(topicId, k = 8) {
  return cache.filter((d) => (d.topicIds || []).includes(topicId)).slice(0, 4).flatMap((d) =>
    index.filter((c) => c.docId === d.id).slice(0, Math.ceil(k / 2)));
}

export function newDocRecord(file) {
  return { id: uuid(), name: file.name, title: file.name.replace(/\.[^.]+$/, ''), size: file.size, mime: file.type, addedAt: Date.now(), text: '', pages: 0, kind: '', status: 'neu', topicIds: [], summary: '', formulas: [], keyPoints: [], examples: [], exercises: [], assetId: null };
}

/** Originaldatei im Artifact-Speicher ablegen (nur für Besitzer verfügbar). */
export async function storeAsset(file) {
  if (!platform.assets) return null;
  try {
    const r = await platform.assets.upload(file, file.type ? undefined : { type: 'application/octet-stream' });
    return r && r.id ? r.id : null;
  } catch (e) { console.warn('Asset-Upload fehlgeschlagen', e); return null; }
}
export const assetUrl = (id) => (id ? '/_blob/' + id : null);
