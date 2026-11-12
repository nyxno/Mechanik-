// Einstieg: Plattform erkennen, Zustand laden, Routen rendern.
import { initPlatform, onPlatformReady } from './platform/platform.js';
import { state, update, subscribe } from './platform/store.js';
import { loadDocs } from './platform/docs.js';
import { aiStatus } from './platform/ai.js';
import { $, $$ } from './util/dom.js';
import * as dashboard from './views/dashboard.js';
import * as plan from './views/plan.js';
import * as topic from './views/topic.js';
import * as practice from './views/practice.js';
import * as tutor from './views/tutor.js';
import * as docsView from './views/docs.js';
import * as settings from './views/settings.js';

const ROUTES = { start: dashboard, lernplan: plan, thema: topic, ueben: practice, tutor, unterlagen: docsView, einstellungen: settings };
const VALID = Object.keys(ROUTES);
let cleanup = null;

export function go(route, patch) {
  if (patch) update((s) => Object.assign(s, patch), 'nav');
  if (location.hash === '#' + route) render(); else location.hash = route;
}

function currentRoute() {
  const h = location.hash.replace(/^#/, '');
  if (VALID.includes(h)) return h;
  return VALID.includes(state.lastRoute) ? state.lastRoute : 'start';
}

function render() {
  const route = currentRoute();
  if (typeof cleanup === 'function') { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  const main = $('#main');
  main.innerHTML = '';
  main.scrollTop = 0; window.scrollTo(0, 0);
  $$('[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === route));
  try {
    cleanup = ROUTES[route].render(main, { go });
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="notice bad">Diese Seite konnte nicht geladen werden: ${e && e.message}</div>`;
  }
  if (state.lastRoute !== route) update((s) => { s.lastRoute = route; }, 'route');
}

function applyTheme() {
  const t = state.settings.theme;
  const root = document.documentElement;
  if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t);
  else if (root.getAttribute('data-theme') && root.dataset.themeByApp) root.removeAttribute('data-theme');
  root.dataset.themeByApp = t === 'system' ? '' : '1';
}

function updateAiPill() {
  const st = aiStatus();
  const pill = $('#ai-pill');
  if (!pill) return;
  pill.className = 'ai-pill ' + (st.ok ? 'on' : st.mode === 'artifact' ? 'warn' : '');
  pill.querySelector('span').textContent = st.label;
}

window.addEventListener('hashchange', render);
subscribe((s, what) => {
  if (what === 'settings' || what === 'remote' || what === 'import' || what === 'reset') { applyTheme(); updateAiPill(); }
  if (what === 'remote' || what === 'import' || what === 'reset') render();
});
onPlatformReady(() => { updateAiPill(); });

initPlatform();
loadDocs();
applyTheme();
updateAiPill();
if (!location.hash) location.hash = currentRoute();
render();
