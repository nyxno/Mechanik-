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

export const groessen = {
  tasteHoehe: 64,
  tasteHoeheKlein: 52,
  radius: 14,
  abstand: 16,
  schrift: 18,
  schriftKlein: 15,
  schriftGross: 22,
  titel: 26,
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
