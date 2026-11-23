# Verbesserungsrunden (Simulation)

Jede Runde: Die App wird in einer Browser-Vorschau mit realistischen Testdaten durchgeklickt
(wie ein Handwerker im Alltag), Bildschirmfotos werden geprüft, Schwachstellen werden behoben.

So läuft die Vorschau (nur für Entwickler): `npm run web` – im Browser startet die App mit
Testdaten (Datenbank nur im Speicher). Am Handy ändert sich dadurch nichts.

**Regel:** Eine Runde dauert höchstens **20 Minuten**. Was nicht fertig wird, kommt unten in
„Übernahme in die nächste Runde“ und wird dort zuerst erledigt.

## Übernahme in die nächste Runde
- (nichts offen)

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

## Runde 2 – 22.11.2026, 23:22 (Version 0.10)

**Aus Runde 1 übernommen – erledigt**
- **Startseite kompakter:** Zulagen, Material, Erledigt und Hinweise in einer Reihe, Ampel flacher →
  die Liste beginnt deutlich weiter oben.
- **Kalender:** Tage mit Zulagenstunden zeigen ein orangenes ⏱ (neben ✓ für erledigte Arbeiten).

**Gefunden & behoben**
- **Hinweis „gleicher Standort“** hat wöchentliche Arbeiten (z. B. Drehbank schmieren) mitgezählt –
  die sind ohnehin ständig fällig. → Arbeiten mit Intervall unter 3 Wochen zählen dort nicht mehr.

**Neu**
- **Fotos direkt beim Gerät:** Auf der Geräteseite gibt es jetzt „📷 Kamera“ und „🖼 Galerie“ –
  kein Umweg über „Bearbeiten“ mehr.

## Runde 3 – 23.11.2026, 0:22 (Version 0.11)

**Neu (wichtigster offener Punkt): Datensicherung**
- Einstellungen → **„💾 Sicherung erstellen“**: alle Daten als eine Datei; Android fragt, wohin
  (z. B. Google Drive, E-Mail an dich selbst, Downloads).
- **„📥 Sicherung einspielen“**: Datei auswählen → nach Rückfrage werden die Daten wiederhergestellt
  (z. B. auf einem neuen Handy). Sicherungen aus älteren App-Versionen funktionieren.
- Anzeige **„Letzte Sicherung: …“** bzw. Warnung „Noch nie gesichert“.
- Hinweis: **Fotos sind noch nicht in der Sicherung** – kommt in einer späteren Runde.

## Runde 4 – 23.11.2026, 1:22 (Version 0.12)

**Aus Runde 3 übernommen – erledigt**
- **Sicherung mit Fotos:** Beim Erstellen wählen: „Nur Daten“ (klein) oder „Mit Fotos“ (groß).
  Beim Einspielen werden die Fotos wiederhergestellt. Die Datei wird stückweise geschrieben,
  damit auch viele Fotos das Handy nicht überlasten.

**Gefunden & behoben**
- Kategorien-Seite: Lange Unterkategorie-Namen (z. B. „Feuerlöscher“) brachen mitten im Wort um.

**Neu**
- **Statistik: Säulen-Grafik „📈 Zulagen pro Tag“** – auf einen Blick, an welchen Tagen viele
  Hitze-/Staubstunden anfielen; der heutige Tag ist umrandet.

