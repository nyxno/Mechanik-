// KI-Anbindung mit zwei Wegen:
//  1. Artifact-Laufzeit auf claude.ai: `sample` (kein API-Schlüssel nötig, läuft auf dem Claude-Konto des Nutzers)
//  2. Eigenständig (GitHub Pages/lokal): Anthropic Messages API direkt aus dem Browser mit eigenem API-Schlüssel
import { platform } from './platform.js';
import { state } from './store.js';

export class AIError extends Error {
  constructor(code, message, text) { super(message); this.code = code; this.text = text; }
}

export function aiStatus() {
  if (platform.sample) return { ok: true, mode: 'artifact', label: 'KI aktiv (Claude)' };
  if (state.settings.apiKey) return { ok: true, mode: 'api', label: 'KI aktiv (eigener API-Schlüssel)' };
  if (platform.ready && platform.mode === 'artifact') return { ok: false, mode: 'artifact', label: 'KI nicht freigegeben' };
  return { ok: false, mode: 'none', label: 'KI: API-Schlüssel fehlt' };
}
export function canSendImages() {
  if (platform.sample) return !!(platform.sampleLimits && platform.sampleLimits.images);
  return !!state.settings.apiKey;
}
export function maxImages() {
  if (platform.sample) return (platform.sampleLimits && platform.sampleLimits.images && platform.sampleLimits.images.maxCount) || 1;
  return 10;
}

/**
 * Frage an die KI.
 * @param {object} o
 * @param {string} o.system   Anweisungen + Kontext (geht als erste Nutzer-Runde bzw. system-Feld)
 * @param {Array<{role:'user'|'assistant', content:string}>} o.turns  Gesprächsverlauf, endet mit user
 * @param {Blob[]} [o.images]
 * @param {(t:{text:string,delta:string})=>void} [o.onText]
 * @param {AbortSignal} [o.signal]
 * @param {boolean} [o.json]   Antwort als JSON parsen
 * @param {'quick'|'default'|'complex'} [o.tier]
 */
export async function ask(o) {
  const turns = (o.turns || []).filter((t) => t && t.content && t.content.trim());
  if (!turns.length || turns[turns.length - 1].role !== 'user') throw new AIError('invalid_request', 'Die Anfrage muss mit einer Nutzer-Nachricht enden.');
  if (platform.sample) return askSample(o, turns);
  if (state.settings.apiKey) return askApi(o, turns);
  throw new AIError('not_configured', 'Keine KI verfügbar. Öffne die App auf claude.ai oder hinterlege unter Einstellungen einen API-Schlüssel.');
}

async function askSample(o, turns) {
  const input = [{ role: 'user', content: o.system || 'Du bist ein Mechanik-Tutor.' }, ...turns];
  const opts = { cache: false };
  if (o.onText) opts.onText = o.onText;
  if (o.signal) opts.signal = o.signal;
  if (o.images && o.images.length) opts.images = o.images;
  if (o.tier) opts.modelTier = o.tier;
  try {
    if (o.json) {
      const data = await platform.sample.json(input, opts);
      return { json: data, text: JSON.stringify(data) };
    }
    const res = await platform.sample(input, opts);
    return { text: res.text, truncated: res.truncated };
  } catch (e) {
    throw new AIError(e && e.code || 'upstream_error', friendly(e && e.code, e && e.message), e && e.text);
  }
}

function friendly(code, msg) {
  switch (code) {
    case 'not_granted': return 'Du hast der KI-Nutzung nicht zugestimmt. Erlaube sie über das Menü des Artifacts.';
    case 'rate_limited': return 'Zu viele Anfragen in kurzer Zeit. Bitte kurz warten.';
    case 'prompt_too_large': return 'Die Anfrage ist zu groß (zu viel Dokumenttext). Bitte kürzer fassen.';
    case 'cancelled': return 'Abgebrochen.';
    case 'refused': return 'Die Anfrage wurde abgelehnt. Formuliere sie bitte anders.';
    case 'images_unavailable': return 'Bilder können hier nicht an die KI gesendet werden.';
    case 'auth': return 'API-Schlüssel ungültig oder abgelaufen. Prüfe die Einstellungen.';
    case 'network': return 'Keine Verbindung zur KI. Prüfe deine Internetverbindung.';
    default: return msg || 'Die KI hat nicht geantwortet. Bitte noch einmal versuchen.';
  }
}

// ---------------- Anthropic Messages API (eigener Schlüssel) ----------------
async function blobToBase64(blob) {
  const buf = await blob.arrayBuffer();
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function askApi(o, turns) {
  const model = state.settings.model || 'claude-opus-5-5';
  const messages = turns.map((t) => ({ role: t.role, content: t.content }));
  if (o.images && o.images.length) {
    const last = messages[messages.length - 1];
    const blocks = [];
    for (const img of o.images) {
      blocks.push({ type: 'image', source: { type: 'base64', media_type: img.type || 'image/png', data: await blobToBase64(img) } });
    }
    blocks.push({ type: 'text', text: last.content });
    last.content = blocks;
  }
  const body = { model, max_tokens: 8000, system: o.system || '', messages, stream: true };
  const headers = {
    'content-type': 'application/json',
    'x-api-key': state.settings.apiKey,
    'anthropic-version': '2026-10-21',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  if (/opus|sonnet|fable/.test(model)) {
    body.fallbacks = 'default';
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  }
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body), signal: o.signal });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new AIError('cancelled', friendly('cancelled'));
    throw new AIError('network', friendly('network'));
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = (j.error && j.error.message) || msg; } catch { /* ignore */ }
    if (res.status === 401 || res.status === 403) throw new AIError('auth', friendly('auth'));
    if (res.status === 429) throw new AIError('rate_limited', friendly('rate_limited'));
    throw new AIError('upstream_error', msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', text = '', stopReason = null;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop();
      for (const part of parts) {
        for (const line of part.split('\n')) {
          if (!line.startsWith('data:')) continue;
          let ev;
          try { ev = JSON.parse(line.slice(5).trim()); } catch { continue; }
          if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
            text += ev.delta.text;
            if (o.onText) { try { o.onText({ text, delta: ev.delta.text }); } catch { /* ignore */ } }
          } else if (ev.type === 'message_delta' && ev.delta && ev.delta.stop_reason) {
            stopReason = ev.delta.stop_reason;
          } else if (ev.type === 'error') {
            throw new AIError('upstream_error', (ev.error && ev.error.message) || 'Fehler im Datenstrom', text);
          }
        }
      }
    }
  } catch (e) {
    if (e instanceof AIError) throw e;
    if (e && e.name === 'AbortError') throw new AIError('cancelled', friendly('cancelled'), text);
    throw new AIError('network', friendly('network'), text);
  }
  if (stopReason === 'refusal' && !text.trim()) throw new AIError('refused', friendly('refused'));
  if (o.json) {
    const data = parseJsonLoose(text);
    if (data === undefined) throw new AIError('invalid_json', 'Die Antwort enthielt kein gültiges JSON.', text);
    return { json: data, text };
  }
  return { text, truncated: stopReason === 'max_tokens' };
}

export function parseJsonLoose(text) {
  const tries = [];
  tries.push(text.trim());
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) tries.push(fence[1].trim());
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a >= 0 && b > a) tries.push(text.slice(a, b + 1));
  const c = text.indexOf('['), d = text.lastIndexOf(']');
  if (c >= 0 && d > c) tries.push(text.slice(c, d + 1));
  for (const t of tries) { try { return JSON.parse(t); } catch { /* next */ } }
  return undefined;
}
