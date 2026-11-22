import { Platform } from 'react-native';
import { openDatabaseSync } from 'expo-sqlite';
import { DB_NAME } from './db/schema';
// Farben und Größen an einem Ort. Große Tasten und Schrift: bedienbar mit Handschuhen.
export const farben = {
  hintergrund: '#F3F4F6',
  karte: '#FFFFFF',
  text: '#111827',
  textLeicht: '#4B5563',
  rahmen: '#D1D5DB',
  primaer: '#1D4ED8',
  primaerText: '#FFFFFF',
  gefahr: '#B91C1C',
  // Ampel
  rot: '#DC2626',
  rotHell: '#FEE2E2',
  gelb: '#D97706',
  gelbHell: '#FEF3C7',
  gruen: '#15803D',
  gruenHell: '#DCFCE7',
  grau: '#6B7280',
  grauHell: '#E5E7EB',
};

// Schriftgröße (Einstellung "Normal / Groß / Sehr groß"). Wird beim Start der App gelesen.
export const SCHRIFT_STUFEN = [
  { faktor: 1, text: 'Normal' },
  { faktor: 1.2, text: 'Groß' },
  { faktor: 1.4, text: 'Sehr groß' },
];

function schriftFaktorLesen(): number {
  if (Platform.OS === 'web') return 1; // Browser-Vorschau: Datenbank wird dort nur einmal geöffnet
  try {
    const db = openDatabaseSync(DB_NAME);
    const r = db.getFirstSync<{ wert: string }>("SELECT wert FROM einstellungen WHERE schluessel = 'schrift_faktor'");
    db.closeSync();
    const f = parseFloat(r?.wert ?? '1');
    return SCHRIFT_STUFEN.some((x) => x.faktor === f) ? f : 1;
  } catch {
    return 1; // z. B. beim allerersten Start, bevor es die Tabelle gibt
  }
}

export const SCHRIFT_FAKTOR = schriftFaktorLesen();
/** Größe passend zur gewählten Schriftstufe. */
export const sz = (n: number) => Math.round(n * SCHRIFT_FAKTOR);
const hoehe = (n: number) => Math.round(n * (1 + (SCHRIFT_FAKTOR - 1) * 0.6));

export const groessen = {
  tasteHoehe: hoehe(64),
  tasteHoeheKlein: hoehe(52),
  radius: 14,
  abstand: 16,
  schrift: sz(18),
  schriftKlein: sz(15),
  schriftGross: sz(22),
  titel: sz(26),
};

import type { Status } from './lib/faelligkeit';
import type { Ergebnis } from './db/typen';

export function ergebnisFarben(e: Ergebnis): { hinter: string; vorder: string; label: string; symbol: string } {
  switch (e) {
    case 'ok': return { hinter: farben.gruenHell, vorder: farben.gruen, label: 'In Ordnung', symbol: '✓' };
    case 'maengel': return { hinter: farben.gelbHell, vorder: farben.gelb, label: 'Mängel', symbol: '⚠' };
    case 'ausser_betrieb': return { hinter: farben.rotHell, vorder: farben.rot, label: 'Außer Betrieb', symbol: '⛔' };
  }
}

export function statusFarben(status: Status): { hinter: string; vorder: string; label: string } {
  switch (status) {
    case 'ueberfaellig': return { hinter: farben.rotHell, vorder: farben.rot, label: 'Überfällig' };
    case 'nie': return { hinter: farben.rotHell, vorder: farben.rot, label: 'Noch nie' };
    case 'bald': return { hinter: farben.gelbHell, vorder: farben.gelb, label: 'Bald fällig' };
    case 'ok': return { hinter: farben.gruenHell, vorder: farben.gruen, label: 'In Ordnung' };
    case 'erledigt': return { hinter: farben.gruenHell, vorder: farben.gruen, label: 'Erledigt' };
  }
}
