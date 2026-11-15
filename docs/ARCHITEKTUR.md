# Aufbau der App und Vorbereitung auf später

## Datenmodell

```
betriebe ──< kategorien ──< eintraege ──< durchfuehrungen
                               │                 │
                               └──< fotos >──────┘
```

| Tabelle | Inhalt |
| --- | --- |
| `betriebe` | Ein Betrieb (Firma). Heute gibt es nur den lokalen Betrieb `lokal`. |
| `kategorien` | Heizung, Brandschutz, … |
| `eintraege` | Ein Gerät/Objekt mit Aufgabe, Intervall (`intervall_wert` + `intervall_einheit`), Zusatzinfo |
| `durchfuehrungen` | Jede erledigte Prüfung/Wartung: Datum, Beschreibung, später `benutzer_id` |
| `fotos` | Dateiname im App-Ordner `fotos/`; gehört zu einem Eintrag **oder** einer Durchführung |
| `einstellungen` | Schlüssel/Wert, z. B. später Vorwarnzeit |

### Bereits eingebaut für Konten, mehrere Nutzer, mehrere Betriebe und Abgleich

- **UUIDs** als IDs: zwei Handys können gleichzeitig Daten anlegen, ohne dass IDs kollidieren.
- **`betrieb_id`** auf jeder Tabelle: Daten mehrerer Betriebe lassen sich sauber trennen
  (auf dem Server später per „Row Level Security“ erzwingbar).
- **`created_at` / `updated_at`**: nötig, um beim Abgleich zu entscheiden, welche Version neuer ist.
- **`deleted_at`** (Soft Delete): Löschen wird nur markiert, damit es beim Abgleich auf andere Geräte
  übertragen werden kann. Alle Abfragen filtern `deleted_at IS NULL`.
- **`synced_at`**: noch leer; markiert später, was schon zum Server übertragen wurde.
- **Alle Datenbankzugriffe** liegen in `src/db/repo.ts`. Die Bildschirme kennen kein SQL.
  Ein Abgleich-Modul kann später dort ansetzen.

### Fälligkeit

`src/lib/faelligkeit.ts`: nächster Termin = letzte Durchführung + Intervall.

- **rot** (überfällig): Termin liegt in der Vergangenheit, oder noch nie durchgeführt
- **gelb** (bald fällig): innerhalb der Vorwarnzeit – 14 Tage, bei kurzen Intervallen ein Drittel des Intervalls
- **grün**: alles andere

Monate werden kalendarisch addiert (31.01. + 1 Monat = 28.02.).

## Geplante Schritte (Reihenfolge-Vorschlag)

1. **Erinnerungen** – `expo-notifications`, lokal am Handy geplant, kein Server nötig.
2. **Konten + Abgleich** – Vorschlag: [Supabase](https://supabase.com) (Postgres, Login, Dateispeicher),
   Region EU (Frankfurt) für die DSGVO. Die App bleibt offline-fähig; ein Sync-Modul überträgt
   geänderte Zeilen (`updated_at > synced_at`) in beide Richtungen.
3. **Mehrere Betriebe** – Tabelle `betriebe` + Zuordnung Benutzer↔Betrieb; `betrieb_id` ist schon überall.
4. **PDF-Export** – `expo-print`: Verlauf eines Eintrags oder einer Kategorie als Prüfnachweis.
5. **Bezahlmodell** – pro Betrieb, z. B. über RevenueCat oder Stripe, Status am Betrieb gespeichert.

## Signierung der APK

`android-signing/debug.keystore` ist ein **Test-Schlüssel** (Passwort „android“). Er ist absichtlich
eingecheckt, damit jede automatisch gebaute Testversion mit demselben Schlüssel signiert ist – nur so
lässt sich eine neue Version über die alte installieren, ohne Daten zu verlieren.

**Vor einer Veröffentlichung im Play Store** muss ein eigener, geheimer Schlüssel erzeugt und als
GitHub-Secret hinterlegt werden; der Workflow wird dann angepasst.

## DSGVO-Hinweise

- Aktuell liegen alle Daten nur lokal am Handy (App-Speicher, für andere Apps nicht lesbar).
- Fotos werden in den App-Ordner kopiert, nicht in die öffentliche Galerie.
- Es werden keine Daten an Dritte gesendet; es gibt keine Analyse-/Tracking-Bausteine.
- Beim späteren Server: EU-Region, Verschlüsselung, Auftragsverarbeitungsvertrag mit dem Anbieter,
  Löschkonzept (Soft Delete → endgültiges Löschen nach Frist).
