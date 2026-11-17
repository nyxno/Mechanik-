// Farben für Gebiete (Kategorien): kräftige Signalfarben, auch draußen gut unterscheidbar.
export const GEBIETSFARBEN = [
  '#FF6D00', // Orange
  '#FF1744', // Rot
  '#FFD600', // Gelb
  '#2979FF', // Blau
  '#AA00FF', // Violett
  '#00BFA5', // Türkis
  '#00C853', // Grün
  '#F50057', // Pink
  '#00B0FF', // Himmelblau
  '#76FF03', // Neongrün
  '#D500F9', // Magenta
  '#546E7A', // Blaugrau
  '#FFAB00', // Bernstein
  '#651FFF', // Lila
  '#00E5FF', // Cyan
  '#C51162', // Weinrot
  '#304FFE', // Königsblau
  '#64DD17', // Hellgrün
  '#FF3D00', // Signalrot-Orange
  '#1DE9B6', // Mint
  '#AEEA00', // Limette
  '#FF4081', // Rosa
  '#6200EA', // Indigo
  '#8D6E63', // Braun
];

/** Alte (dunklere) Farben aus Version 0.4 -> grelle Variante derselben Farbe. */
export const ALTE_FARBEN: Record<string, string> = {
  '#EA580C': '#FF6D00', '#DC2626': '#FF1744', '#CA8A04': '#FFD600', '#2563EB': '#2979FF',
  '#7C3AED': '#AA00FF', '#0D9488': '#00BFA5', '#16A34A': '#00C853', '#DB2777': '#F50057',
  '#0284C7': '#00B0FF', '#65A30D': '#76FF03', '#C026D3': '#D500F9', '#78716C': '#546E7A',
};

/** Erste Farbe, die noch keine Kategorie hat (sonst reihum). */
export function freieFarbe(belegt: (string | null | undefined)[]): string {
  const frei = GEBIETSFARBEN.find((f) => !belegt.includes(f));
  return frei ?? GEBIETSFARBEN[belegt.length % GEBIETSFARBEN.length];
}

/** Schriftfarbe, die auf der Hintergrundfarbe gut lesbar ist: dunkel auf hellen, weiß auf dunklen Farben. */
export function textFarbe(hinter: string | null | undefined): string {
  const m = (hinter ?? '').match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return '#FFFFFF';
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => {
    const c = parseInt(x, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const helligkeit = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Weiß, solange der Kontrast für fette Schrift reicht (≥ 3:1), sonst dunkle Schrift
  const kontrastWeiss = 1.05 / (helligkeit + 0.05);
  return kontrastWeiss >= 3 ? '#FFFFFF' : '#111827';
}
