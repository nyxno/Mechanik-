# Mechanik Lernwerkstatt

Interaktive Lern-App für das Fach **Mechanik und technische Grundlagen** (Werkmeisterschule).
Lernplan mit 16 Themen, Aufgaben mit Fehlerdiagnose, Formel-Rechner, interaktive Skizzen, KI-Tutor,
eigene Unterlagen, Fortschritts-Dashboard. Keine Build-Schritte: reines HTML, CSS und JavaScript (ES-Module).

## Inhalte

| Modul | Themen | Grundlage |
|---|---|---|
| 1 Kräfte und zentrales Kraftsystem | Kraftbegriff, Winkelfunktionen, Kräfte zerlegen, Resultierende, Gleichgewicht, Anwendungen (Kurbeltrieb, Kniehebel, Spannrolle, Keil) | Kursfolien Z05, Z10, Z30 |
| 2 Drehmoment, Hebel und Statik | Drehmoment, Hebelgesetz, allgemeines Kraftsystem, Träger auf 2 Stützen, Tür/Wandkran, Biegemomentenverlauf | Kursfolien DM10, DM20, T10, T20 |
| 3 Reibung, Arbeit, Leistung, Energie | Reibung und schiefe Ebene, einfache Maschinen, Arbeit/Leistung/Wirkungsgrad, Energieerhaltung | Lehrplan-Ergänzung |

Jedes Thema: Erklärung in Schritten, Skizzen, interaktive Labs (Schieberegler), Formelsammlung,
durchgerechnete Beispiele aus dem Kurs, typische Fehler, verknüpfte eigene Unterlagen.

## Funktionen

- **Üben**: über 50 Aufgabentypen mit zufälligen Zahlen in drei Stufen. Formeln können direkt eingegeben und
  ausgerechnet werden (`F*cos(alpha)`, Winkel in Grad). Die Prüfung erkennt typische Fehler
  (sin/cos vertauscht, Einheiten, Vorzeichen, F/2 vergessen, Hebelarm statt Normalabstand) und benennt sie.
- **Adaptiv**: Beherrschungsgrad je Thema, automatische Stufenwahl, zeitlich gestaffelte Wiederholung.
- **KI-Tutor**: erklärt, fragt ab, prüft eigene Rechenwege. Kennt Kursmethode, Lernstand und hochgeladene Unterlagen.
- **Unterlagen**: PDF, PPTX, DOCX, Fotos/Scans (per KI gelesen), Text. Zusammenfassung, Themenzuordnung,
  Formeln, Aufgaben aus der Unterlage, Volltextsuche.
- **Dashboard**: Fortschritt, fällige Wiederholungen, Empfehlung für den nächsten Schritt.

## Nutzung

### Auf claude.ai (empfohlen)
Als Artifact veröffentlicht läuft der Tutor über das eigene Claude-Konto, ohne API-Schlüssel.
Fortschritt und Unterlagen werden im Artifact-Speicher gesichert und sind am PC und Smartphone gleich.

### Eigenständig (GitHub Pages oder lokal)
```bash
python3 -m http.server 8080   # dann http://localhost:8080 öffnen
```
Lernplan, Aufgaben und Fortschritt funktionieren ohne weitere Einrichtung. Für Tutor und Unterlagen-Analyse
unter *Einstellungen* einen Anthropic-API-Schlüssel hinterlegen (bleibt nur im Browser).

## Entwicklung

```bash
node --test tests/content.test.mjs   # Formel-Rechner, Lernplan, alle Aufgaben-Generatoren, Prüf-Engine
node tools/build-artifact.mjs        # dist/artifact.html für die Veröffentlichung als Artifact
node tools/screenshot.mjs http://127.0.0.1:8080 shots   # Render-Check Desktop/Phone, hell/dunkel
```

Struktur: `js/content` (Themen, Skizzen, Aufgaben), `js/engine` (Prüfung, Lernfortschritt),
`js/platform` (Speicher, KI, Unterlagen), `js/views` (Seiten), `js/util` (Formel-Rechner, SVG, DOM).
