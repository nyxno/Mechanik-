# Verbesserungsrunden (Simulation)

Jede Runde: Die App wird in einer Browser-Vorschau mit realistischen Testdaten durchgeklickt
(wie ein Handwerker im Alltag), Bildschirmfotos werden geprüft, Schwachstellen werden behoben.

So läuft die Vorschau (nur für Entwickler): `npm run web` – im Browser startet die App mit
Testdaten (Datenbank nur im Speicher). Am Handy ändert sich dadurch nichts.

## Runde 1 – 22.11.2026, 22:22 (Version 0.9)

**Gefunden & behoben**
- **Fehler:** Automatische Zuordnung hat „Therme Büro“ zu *Feuerlöscher* gesteckt, weil das Ortswort
  „Büro“ übereinstimmte. → Ortsangaben (Büro, Halle, Keller, Lager …) zählen bei der Zuordnung nicht mehr.
- **Untere Leiste:** „Einstellungen“ war abgeschnitten → Schrift passt jetzt.
- Taste „⚙ Kategorien“ auf der Startseite: technischer Fehler im Entwicklungsmodus behoben.

**Neu**
- **Ampel antippen = filtern:** Auf der Startseite die rote, gelbe oder grüne Kachel antippen →
  nur diese Einträge. Nochmal antippen → alle.
- **Datum oben:** Statt „Übersicht“ steht oben „Heute · So, 22.11.2026“.
- **Kalender-Tagesansicht:** Datum zwischen den Pfeilen; Taste „⏱ Zulagen für diesen Tag eintragen“
  öffnet die Zulagen direkt für den gewählten Tag.
