// Farben für Gebiete (Kategorien). Gut unterscheidbar, auch auf dem Handy in der Sonne.
export const GEBIETSFARBEN = [
  '#EA580C', // Orange
  '#DC2626', // Rot
  '#CA8A04', // Senfgelb
  '#2563EB', // Blau
  '#7C3AED', // Violett
  '#0D9488', // Türkis
  '#16A34A', // Grün
  '#DB2777', // Pink
  '#0284C7', // Himmelblau
  '#65A30D', // Hellgrün
  '#C026D3', // Magenta
  '#78716C', // Grau
];

/** Erste Farbe, die noch keine Kategorie hat (sonst reihum). */
export function freieFarbe(belegt: (string | null | undefined)[]): string {
  const frei = GEBIETSFARBEN.find((f) => !belegt.includes(f));
  return frei ?? GEBIETSFARBEN[belegt.length % GEBIETSFARBEN.length];
}
