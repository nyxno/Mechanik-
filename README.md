# Wartung & Prüfung – App

Android-App, mit der wiederkehrende **Prüfungen und Wartungen** an einem Ort verwaltet werden:
Thermen, Heizungen, Leitern, Feuerlöscher, Anschlagmittel, Druckbehälter, Maschinen …

Alles auf Deutsch, große Tasten, funktioniert komplett **ohne Internet**.

## Was die App kann (Version 0.3)

- **Kategorien** anlegen, umbenennen, löschen (z. B. Heizung, Brandschutz, Leitern)
- **Einträge** je Kategorie: Name, Aufgabe, Intervall (frei wählbar), Zusatzinfo, Fotos
- **Durchführungen** erfassen: Datum, Beschreibung, Fotos – der Verlauf bleibt sichtbar
- **Fälligkeit** wird automatisch berechnet (letzte Durchführung + Intervall) – oder du gibst das
  **Fälligkeitsdatum direkt ein** (Kalender antippen)
- **Übersicht** mit Ampel: rot = überfällig, gelb = bald fällig, grün = in Ordnung; Filter und Suche
- **Erinnerungen** aufs Handy mit eigenem Signalton: Vorwarnung (z. B. 1 Woche vorher) und am Tag
  der Fälligkeit, zur gewählten **Uhrzeit** (pro Eintrag oder Standard). Überfälliges wird täglich gemeldet.
  Einstellungen über „🔔 Erinnerungen“ oben rechts.

- **Einmalige Termine** – nach dem Erledigen im Ordner **„Erledigt“**
- **Wochenende**: Termine am Samstag → Freitag, am Sonntag → Montag
- **Diese & nächste Woche**: Liste, was ansteht
- **Schlummern** („Morgen erinnern“) in der App und in der Benachrichtigung – die echte Prüffrist bleibt
- **Ergebnis** jeder Durchführung (In Ordnung / Mängel / Außer Betrieb) mit kurzer Mängel-Notiz;
  offene Mängel bleiben sichtbar bis „behoben“
- **Schnell abhaken** direkt in der Übersicht, mit Rückgängig
- **Name des Prüfers** bei jeder Durchführung
- **Kategorien sortieren** mit ▲ ▼
- **Lernende Vorschläge** beim Schreiben und Suchen (nur am Handy, ohne Internet)

Noch nicht enthalten: Benutzerkonten, Abgleich zwischen Geräten, PDF-Export.
Die Datenstruktur ist dafür aber schon vorbereitet (siehe `docs/ARCHITEKTUR.md`).

## App aufs Handy bekommen

Du brauchst **keinen Computer**. GitHub baut die App automatisch.

1. Oben im Repository auf **„Releases“** klicken (rechte Seite).
2. Die neueste **„Testversion …“** öffnen und die Datei `wartungsapp-build-….apk` antippen.
3. Am Handy: Datei herunterladen und öffnen. Beim ersten Mal fragt Android, ob der Browser
   Apps installieren darf → **erlauben**. Dann **Installieren**.
4. Neue Version später: einfach die neue APK installieren, die Daten bleiben erhalten.

Hinweis: Weil die App nicht aus dem Play Store kommt, warnt Android einmalig vor „unbekannten Quellen“.
Das ist bei selbst gebauten Apps normal.

## Technik (kurz erklärt)

| Baustein | Was es ist | Warum |
| --- | --- | --- |
| **Expo / React Native** | Baukasten für Handy-Apps | Ein Code für Android und später iPhone |
| **TypeScript** | Programmiersprache | Findet Tippfehler schon vor dem Bauen |
| **Expo Router** | Navigation | Jede Datei im Ordner `app/` ist ein Bildschirm |
| **SQLite** (`expo-sqlite`) | Datenbank am Handy | Funktioniert ohne Internet, sehr robust |
| **GitHub Actions** | Automatischer Bau | Baut nach jeder Änderung die APK |

## Ordner

```
app/                    Bildschirme (eine Datei = eine Seite)
  index.tsx             Übersicht (Startseite)
  kategorien.tsx        Kategorien verwalten
  eintrag/neu.tsx       Neuer Eintrag
  eintrag/[id]/         Eintrag anzeigen, bearbeiten, Durchführung erfassen
src/components/         Wiederverwendbare Bausteine (Taste, Eingabe, Fotoleiste …)
src/db/                 Datenbank: Aufbau (schema.ts) und Zugriffe (repo.ts)
src/lib/                Rechenlogik: Datum, Intervall, Fälligkeit (mit Tests)
src/theme.ts            Farben und Größen
docs/                   Doku zu Aufbau und Weiterentwicklung
.github/workflows/      Automatischer APK-Bau
android-signing/        Test-Signierschlüssel für die APK (siehe docs)
```

## Für Entwickler

```bash
npm install --legacy-peer-deps   # Abhängigkeiten
npm test                          # Logik-Tests (Fälligkeit, Datum)
npm run typecheck                 # Typen prüfen
npx expo start                    # Entwicklungsserver (mit Expo Go am Handy testen*)
```

\* Kamera und Datenbank laufen auch in Expo Go. Für die fertige APK siehe Workflow `android-apk.yml`.
