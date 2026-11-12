import { h, esc, toast, relTime } from '../util/dom.js';
import { docs, onDocsChange, newDocRecord, saveDoc, removeDoc, extractText, transcribeImages, analyzeDoc, guessTopics, searchDocs, storeAsset, assetUrl } from '../platform/docs.js';
import { TOPICS, topicById } from '../content/topics.js';
import { aiStatus, canSendImages } from '../platform/ai.js';
import { platform } from '../platform/platform.js';

export function render(main, { go }) {
  const st = aiStatus();
  main.append(h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Eigene Unterlagen'), h('h1', {}, 'Dein Kursmaterial in der App'), h('p', { class: 'muted' }, 'PDF, PowerPoint, Word, Fotos von Mitschriften oder Textdateien hochladen. Der Text wird ausgelesen, von der KI zusammengefasst, den Lernthemen zugeordnet und in Übungsaufgaben verwandelt. Alles bleibt durchsuchbar und steht dem Tutor zur Verfügung.'))));

  const fileIn = h('input', { type: 'file', multiple: true, accept: '.pdf,.pptx,.docx,.txt,.md,image/*', hidden: true, id: 'file-input', onChange: (e) => handleFiles(Array.from(e.target.files)) });
  const drop = h('div', { class: 'drop', tabindex: 0, role: 'button', onClick: () => fileIn.click(), onKeydown: (e) => { if (e.key === 'Enter') fileIn.click(); } }, h('b', {}, 'Dateien hierher ziehen oder klicken'), h('div', { class: 'small' }, 'PDF · PPTX · DOCX · JPG/PNG (Fotos, Scans) · TXT'), fileIn);
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); handleFiles(Array.from(e.dataTransfer.files)); });
  const progress = h('div', { class: 'stack', style: { gap: '6px' } });
  main.append(h('div', { class: 'card' }, drop, h('p', { class: 'small', style: { marginTop: '10px', marginBottom: 0 } }, st.ok ? (canSendImages() ? 'KI aktiv: Fotos und Scans werden gelesen, Inhalte zusammengefasst und Aufgaben erstellt.' : 'KI aktiv (ohne Bildanalyse): Text wird ausgewertet, Fotos können nicht gelesen werden.') : 'Ohne KI wird nur der Text ausgelesen und per Stichwort zugeordnet. Zusammenfassung, Fotos und Aufgaben brauchen die KI.'), progress));

  // Suche
  const q = h('input', { type: 'search', id: 'doc-search', placeholder: 'In allen Unterlagen suchen, z. B. „Sinussatz“ oder „Kragarm“' , style: { width: '100%' } });
  const results = h('div');
  q.addEventListener('input', () => {
    results.innerHTML = '';
    const hits = searchDocs(q.value, 10);
    if (!q.value.trim()) return;
    if (!hits.length) { results.append(h('p', { class: 'small' }, 'Keine Treffer.')); return; }
    for (const x of hits) results.append(h('div', { class: 'hit' }, h('div', { class: 'small' }, `${x.docName} · Seite/Folie ${x.page}`), h('div', { html: highlight(x.text.slice(0, 400), q.value) })));
  });
  main.append(h('div', { class: 'card' }, h('h3', {}, 'Durchsuchen'), q, results));

  const list = h('div', { class: 'stack' });
  main.append(list);
  const draw = () => {
    list.innerHTML = '';
    if (!docs().length) { list.append(h('div', { class: 'notice' }, 'Noch keine Unterlagen. Ein guter Anfang: die Kursfolien Z05/Z10/Z30 (Kräfte), DM10/DM20 (Drehmoment) und T10/T20 (Träger) sowie Fotos deiner Mitschriften.')); return; }
    for (const d of docs()) list.append(docCard(d, go, draw));
  };
  draw();
  const off = onDocsChange(draw);

  async function handleFiles(files) {
    for (const f of files) {
      const rec = newDocRecord(f);
      const line = h('div', { class: 'small' }, h('span', { class: 'spin' }), ' ', h('span', {}, `${f.name}: wird gelesen …`));
      progress.append(line);
      const setMsg = (m) => { line.lastChild.textContent = `${f.name}: ${m}`; };
      try {
        if (f.size > 40 * 1024 * 1024) throw new Error('Datei größer als 40 MB.');
        const ext = await extractText(f, setMsg);
        rec.kind = ext.kind; rec.pages = ext.pages; rec.text = ext.text || '';
        if (f.type.startsWith('image/')) rec.thumb = await thumbnail(f);
        if (ext.scanned && ext.images && ext.images.length) {
          if (canSendImages()) {
            setMsg('KI liest Handschrift/Scan …');
            const t = await transcribeImages(ext.images, setMsg);
            rec.text = (rec.text && rec.text.replace(/\[Seite \d+\]\s*/g, '').trim().length > 20 ? rec.text + '\n\n' : '') + t;
            rec.ocr = true;
          } else {
            rec.note = 'Bild/Scan: Text konnte ohne KI nicht gelesen werden.';
          }
        }
        rec.status = 'gelesen';
        await saveDoc(rec);
        if (platform.assets) { setMsg('Original wird gespeichert …'); rec.assetId = await storeAsset(f); }
        if (aiStatus().ok && rec.text.trim().length > 30) {
          setMsg('KI analysiert Inhalt und erstellt Aufgaben …');
          try {
            const a = await analyzeDoc(rec, TOPICS);
            Object.assign(rec, a);
            if (!rec.topicIds.length) rec.topicIds = guessTopics(rec.text, TOPICS);
            rec.status = 'analysiert';
          } catch (e) { rec.topicIds = guessTopics(rec.text, TOPICS); rec.status = 'gelesen'; rec.note = 'Analyse fehlgeschlagen: ' + (e.message || e.code); }
        } else {
          rec.topicIds = guessTopics(rec.text, TOPICS);
        }
        await saveDoc(rec);
        line.remove();
        toast(`${f.name} eingelesen`, 'good');
      } catch (e) {
        console.error(e);
        line.innerHTML = `<span style="color:var(--bad)">${esc(f.name)}: ${esc(e.message || 'Fehler')}</span>`;
      }
    }
  }
  return off;
}

function docCard(d, go, redraw) {
  const kind = (d.kind || d.name.split('.').pop() || '?').toUpperCase().slice(0, 4);
  const body = h('div', { style: { minWidth: 0 } },
    h('div', { class: 'row between' }, h('b', {}, d.title || d.name), h('span', { class: `pill ${d.status === 'analysiert' ? 'strong' : 'progress'}` }, d.status || 'neu')),
    h('div', { class: 'small' }, `${d.name} · ${d.pages ? d.pages + (d.kind === 'pptx' ? ' Folien' : ' Seiten') + ' · ' : ''}${Math.round((d.text || '').length / 1000)} k Zeichen · ${relTime(d.addedAt)}${d.ocr ? ' · per KI gelesen' : ''}`),
    d.note ? h('div', { class: 'notice warn', style: { marginTop: '6px' } }, d.note) : null,
    d.summary ? h('p', { style: { marginTop: '8px' } }, d.summary) : null,
    h('div', { class: 'chips', style: { marginTop: '6px' } }, (d.topicIds || []).map((id) => { const t = topicById(id); return t ? h('button', { class: 'chip', onClick: () => go('thema', { currentTopic: id }) }, t.title) : null; })),
    d.thumb ? h('img', { src: d.thumb, alt: d.name, style: { maxHeight: '160px', borderRadius: '8px', marginTop: '8px' } }) : null,
    h('details', { style: { marginTop: '8px' } }, h('summary', {}, 'Details'),
      d.keyPoints && d.keyPoints.length ? h('div', {}, h('b', {}, 'Merksätze'), h('ul', {}, d.keyPoints.map((k) => h('li', {}, k)))) : null,
      d.formulas && d.formulas.length ? h('div', {}, h('b', {}, 'Formeln'), h('div', { class: 'chips', style: { margin: '6px 0' } }, d.formulas.map((f) => h('span', { class: 'formula' }, f)))) : null,
      d.examples && d.examples.length ? h('div', {}, h('b', {}, 'Beispiele in der Unterlage'), h('ul', {}, d.examples.map((e) => h('li', {}, h('b', {}, e.title || 'Beispiel'), e.given ? ` – geg.: ${e.given}` : '', e.wanted ? `; ges.: ${e.wanted}` : '', e.result ? ` ⇒ ${e.result}` : '')))) : null,
      d.exercises && d.exercises.length ? h('div', {}, h('b', {}, 'Übungsaufgaben aus dieser Unterlage'), d.exercises.map((e) => h('div', { class: 'example' }, h('p', {}, e.question), h('details', {}, h('summary', {}, 'Lösung'), h('div', { class: 'solution', html: esc(e.solution || '').replace(/\n/g, '<br>') }))))) : null,
      h('details', { style: { marginTop: '6px' } }, h('summary', {}, 'Ausgelesener Text'), h('pre', { class: 'code', style: { maxHeight: '300px', whiteSpace: 'pre-wrap' } }, (d.text || '').slice(0, 12000) + ((d.text || '').length > 12000 ? '\n…' : '')))),
    h('div', { class: 'row', style: { marginTop: '8px' } },
      h('button', { class: 'btn small', onClick: () => go('tutor', { currentTopic: (d.topicIds || [])[0] || null, tutorIntent: 'docs' }) }, 'Mit dem Tutor besprechen'),
      d.assetId && platform.mode === 'artifact' ? h('a', { class: 'btn small', href: assetUrl(d.assetId), target: '_blank', rel: 'noopener' }, 'Original öffnen') : null,
      h('button', { class: 'btn small ghost', onClick: async () => { await reanalyze(d); redraw(); } }, 'Neu analysieren'),
      confirmDelete(d)));
  return h('div', { class: 'card doc' }, h('div', { class: 'icon' }, kind), body, h('div'));
}

function confirmDelete(d) {
  const wrap = h('span');
  const ask1 = h('button', { class: 'btn small ghost danger', onClick: () => { wrap.innerHTML = ''; wrap.append(h('span', { class: 'small' }, 'Wirklich löschen? '), h('button', { class: 'btn small danger', onClick: () => removeDoc(d.id) }, 'Ja, löschen'), ' ', h('button', { class: 'btn small ghost', onClick: () => { wrap.innerHTML = ''; wrap.append(ask1); } }, 'Nein')); } }, 'Löschen');
  wrap.append(ask1);
  return wrap;
}

async function reanalyze(d) {
  if (!aiStatus().ok) { toast('Dafür wird die KI gebraucht.', 'bad'); return; }
  toast('Analyse läuft …');
  try {
    const a = await analyzeDoc(d, TOPICS);
    Object.assign(d, a, { status: 'analysiert', note: '' });
    await saveDoc(d);
    toast('Analyse aktualisiert', 'good');
  } catch (e) { toast(e.message || 'Analyse fehlgeschlagen', 'bad'); }
}

function highlight(text, q) {
  let out = esc(text);
  for (const w of q.toLowerCase().split(/\s+/).filter((x) => x.length > 2)) out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
  return out;
}

function thumbnail(file) {
  return new Promise((res) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 480; const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}
