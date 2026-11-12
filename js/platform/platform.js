// Erkennt die Laufzeit: innerhalb von claude.ai (Artifact mit window.claude) oder eigenständig (GitHub Pages, lokal).
// Fähigkeiten werden asynchron aufgelöst; die App rendert sofort und schaltet Funktionen frei, sobald sie da sind.

export const platform = {
  mode: 'standalone',   // 'artifact' | 'standalone'
  sample: null,         // KI-Funktion der Artifact-Laufzeit
  sampleLimits: null,
  db: null,
  user: null,
  uid: null,
  assets: null,
  ready: null,
  listeners: new Set(),
};

function withTimeout(p, ms, fallback = null) {
  return Promise.race([p.catch(() => fallback), new Promise((res) => setTimeout(() => res(fallback), ms))]);
}

export function initPlatform() {
  const hasClaude = typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function';
  if (!hasClaude) {
    platform.ready = Promise.resolve(platform);
    return platform.ready;
  }
  platform.ready = (async () => {
    const [sample, db, user, assets] = await Promise.all([
      withTimeout(window.claude.use('sample'), 12000),
      withTimeout(window.claude.use('db'), 12000),
      withTimeout(window.claude.use('user'), 12000),
      withTimeout(window.claude.use('assets'), 12000),
    ]);
    if (sample || db || user) platform.mode = 'artifact';
    platform.sample = sample;
    platform.db = db;
    platform.user = user;
    platform.assets = assets;
    if (sample && sample.limits) platform.sampleLimits = await withTimeout(sample.limits(), 4000, null);
    if (user && user.id) platform.uid = await withTimeout(user.id(), 4000, null);
    for (const fn of platform.listeners) { try { fn(platform); } catch (e) { console.error(e); } }
    return platform;
  })();
  return platform.ready;
}

export function onPlatformReady(fn) {
  platform.listeners.add(fn);
  if (platform.ready) platform.ready.then(() => fn(platform));
}
