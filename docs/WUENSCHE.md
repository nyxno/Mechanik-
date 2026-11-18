# Wünsche

Gesammelte Änderungswünsche. Erst programmieren, wenn der Nutzer das Go gibt.

**Stand:** Punkte 1–9 in Version 0.3, 10–13 in Version 0.4, 14–19 in Version 0.5 umgesetzt (✅). Punkte 20–22 sind offen.

## ✅ 1. Reihenfolge der Kategorien ändern
- Die Kategorien (Heizung, Druckbehälter, Brandschutz …) sollen sich verschieben lassen,
  damit man selbst bestimmt, welche wo steht.
- Gilt für die Kategorie-Leiste auf der Startseite und für die Kategorien-Seite.
- Technisch vorbereitet: Spalte `kategorien.sortierung` gibt es schon.
- Bedienung: große Tasten ▲ / ▼ (handschuhtauglich) statt nur Ziehen mit dem Finger.

## ✅ 2. Intervall „Einmalig“ + Ordner „Erledigt“
- Zusätzlich zu „alle X Tage/Wochen/Monate/Jahre“ eine Auswahl **„Einmalig“**.
- Ein einmaliger Eintrag braucht ein Fälligkeitsdatum und wiederholt sich nicht.
- **Nach der Durchführung** wandert der Eintrag in einen Bereich **„Erledigt“**
  (neu anlegen, gibt es noch nicht). Dort grün mit „Erledigt am …“, keine Erinnerungen mehr,
  Verlauf und Fotos bleiben sichtbar.
- Erledigte Einträge erscheinen nicht mehr in der normalen Übersicht.

## ✅ 3. Wochenende vermeiden
- Fällt ein Termin auf **Samstag oder Sonntag**, wird er automatisch auf einen Werktag verschoben.
- **Entschieden:** Samstag → Freitag davor, Sonntag → Montag danach.
- Gilt für berechnete Termine; Erinnerung kommt dann am verschobenen Tag.
- Später denkbar: Feiertage ebenfalls berücksichtigen.

## ✅ 4. Liste „Diese Woche / Nächste Woche“
- Eigene Ansicht: was steht **diese Woche** an, was **nächste Woche** (Montag bis Sonntag).
- Überfälliges oben dabei, damit nichts untergeht.
- Erreichbar von der Startseite mit einer großen Taste.

## ✅ 5. Schlummer-Taste („Snooze“)
- Einen Termin mit einer Taste **auf den nächsten Tag verschieben**.
- Sowohl direkt in der Benachrichtigung („Morgen erinnern“) als auch in der App beim Eintrag.
- **Entschieden:** Nur die Erinnerung wird verschoben. Die echte Prüffrist bleibt sichtbar
  (Ampel und Datum ändern sich durch Schlummern nicht).
- **Entschieden:** Nach Erledigung der Arbeit startet die neue Prüffrist ab dem Erledigungsdatum
  (Durchführungsdatum + Intervall, Wochenend-Regel aus Punkt 3 angewendet). Die Schlummer-Verschiebung
  ist damit hinfällig.
- Fällt der nächste Tag aufs Wochenende → Samstag auf Freitag geht beim Schlummern nicht (wäre heute),
  daher beim Schlummern Wochenende immer auf Montag.

## ✅ 6. Ergebnis bei jeder Durchführung
- Drei große Tasten: **In Ordnung** (grün) · **Mängel** (gelb/rot) · **Außer Betrieb** (rot).
- Bei „Mängel“ oder „Außer Betrieb“: Feld für eine **kurze Notiz** (optional, nur wenn nötig).
- Offene Mängel bleiben am Eintrag sichtbar, bis sie als behoben markiert werden.
- Ergebnis erscheint im Verlauf und später im PDF-Prüfnachweis.

## ✅ 7. Schnell abhaken
- In der Übersicht pro Eintrag eine Taste **„✓ Heute erledigt“**, ohne den Eintrag zu öffnen.
- Speichert Durchführung mit heutigem Datum und Ergebnis „In Ordnung“.
- Kurze Rückfrage oder „Rückgängig“-Taste gegen versehentliches Tippen.

## ✅ 8. Name des Prüfers
- Bei jeder Durchführung wird gespeichert, **wer** geprüft hat.
- Name einmal in den Einstellungen eintragen, wird automatisch vorausgefüllt, änderbar.
- **Keine Unterschrift.**
- Später mit Benutzerkonten: Name kommt automatisch aus dem Konto (`durchfuehrungen.benutzer_id` ist vorbereitet).

## ✅ 9. Lernende Vorschläge
- Die App merkt sich, was oft geschrieben und gesucht wird, und **schlägt es beim Tippen vor**
  (große Vorschlags-Tasten über der Tastatur, antippen = übernehmen).
- Gilt für: Beschreibung der Durchführung, Mängel-Notiz, Aufgabe, Suche in der Übersicht.
- Vorschläge passend zum Eintrag zuerst (was bei genau diesem Gerät früher geschrieben wurde),
  danach die häufigsten allgemein.
- Läuft komplett **am Handy, ohne Internet und ohne KI-Dienst** → keine Daten an Dritte (DSGVO).
- Einzelne Vorschläge löschbar (lange drücken).

## ✅ 10. Übersicht „Alle“ nur die nächsten 3 Monate
- Unter „Alle“ erscheinen nur Arbeiten, die in den **nächsten 3 Monaten** fällig werden.
- Überfälliges und „noch nie gemacht“ bleiben immer sichtbar.
- Vorschlag: Unten eine Taste „Später fällig (n) anzeigen“, damit nichts verloren wirkt.
- **Entschieden:** Beim Filtern nach Kategorie und bei der Suche wird alles gezeigt.

## ✅ 11. Kalender (Monatsansicht)
- Monatskalender, in dem man auf einen Blick sieht, was wann eingeplant ist.
- An jedem Tag farbige Punkte bzw. Balken in der Farbe des Gebiets (siehe Punkt 12).
- Tag antippen → Liste der Arbeiten an diesem Tag. Mit ◀ ▶ Monate wechseln.
- Überfällige Tage rot markiert, heute hervorgehoben.

## ✅ 12. Farben für Gebiete
- Jedes Gebiet (Kategorie) bekommt eine eigene Farbe, z. B. Heizung rot, Brandschutz orange.
- Farbe sichtbar in Übersicht, Kalender, Wochenliste und Kategorie-Leiste.
- Farbe selbst wählbar (große Farbfelder), neue Kategorien bekommen automatisch eine freie Farbe.

## ✅ 13. Muster erkennen / automatisch zuordnen
- Beim Anlegen eines Eintrags schlägt die App **Gebiet (Kategorie)** und **Intervall** vor,
  anhand ähnlicher Namen, z. B. „Therme Keller“ → Heizung, jährlich, weil „Therme Halle 2“ so eingetragen ist.
- Läuft nur am Handy, ohne Internet und ohne KI-Dienst, lernt aus den eigenen Einträgen.
- **Entschieden: alles umsetzen:**
  - wiederkehrende Mängel am selben Gerät („3× Dichtung undicht in einem Jahr“),
  - Arbeiten am selben Standort zusammenlegen („2 Termine im gleichen Gebäude diese Woche“),
  - übliche Wochentage/Uhrzeiten, an denen du prüfst, als Standard vorschlagen.

## ✅ 14. Mehr und grellere Gebietsfarben
- Mehr Farben zur Auswahl (statt 12 z. B. 20–24).
- Kräftiger / greller (Signalfarben), damit die Gebiete auch draußen gut unterscheidbar sind.
- Weiße Schrift auf den Farben muss lesbar bleiben (bei sehr hellen Farben ggf. dunkle Schrift).
- Bestehende Kategorien behalten ihre Farbe oder bekommen die grellere Variante derselben Farbe.

## ✅ 15. „Einmalig“: Fälligkeitsdatum automatisch auf heute
- Wird „1× Einmalig“ angetippt und ist noch kein Datum eingetragen, setzt die App automatisch **heute** ein.
- Ist heute **Samstag oder Sonntag → automatisch Montag** (hier bewusst auch Samstag → Montag,
  weil der Freitag davor schon vorbei wäre).
- Das Datum kann wie gewohnt per Kalender von Hand geändert werden.

## ✅ 16. Untere Leiste mit 4 großen Tasten
- Feste Leiste unten: **Start · Woche · Kalender · Einstellungen** (große Symbole + Text, handschuhtauglich).
- Dafür fallen die Tasten-Reihe (Woche/Kalender/Erledigt) und „⚙ Einstellungen“ oben weg → mehr Platz für die Liste.
- „Erledigt“ und „Kategorien“ bleiben erreichbar (z. B. Erledigt auf der Startseite klein, Kategorien in den Einstellungen).
- „＋ Neuer Eintrag“ bleibt groß auf der Startseite (über der Leiste).

## ✅ 17. „In Ordnung“ einklappen
- Grüne Einträge (in Ordnung) werden auf der Startseite zusammengefasst: **„12 in Ordnung ▼“**.
- Antippen klappt sie auf/zu. Sichtbar ist zuerst nur, was zu tun ist (rot/gelb).
- Bei Suche oder Kategorie-Filter alles aufgeklappt zeigen.

## ✅ 18. Größere Schrift (Schalter)
- In den Einstellungen: Schriftgröße **Normal / Groß / Sehr groß**.
- Gilt für die ganze App; Tasten wachsen mit.
- Umgesetzt: wirkt nach einem Neustart der App (App ganz schließen und neu öffnen).

## ✅ 19. Eintrag kopieren
- Beim Eintrag eine Taste **„⧉ Kopieren“**: öffnet „Neuer Eintrag“ mit allem vorausgefüllt
  (Gebiet, Aufgabe, Intervall, Uhrzeit, Zusatzinfo), Name mit „(Kopie)“.
- Nicht übernommen: Fotos, Verlauf, fester Termin.
- Praktisch bei vielen gleichen Geräten (z. B. 20 Feuerlöscher): nur Name/Standort ändern.

## 20. Hitze- und Staubstunden eintragen (Zulagen)
- **Hitzestunden** und **Staubstunden** getrennt eintragen, jeweils beim Eintrag/Projekt.
- So wenig Aufwand wie möglich: große Tasten **＋½ h / ＋1 h / ＋2 h** (und von Hand korrigierbar),
  direkt beim Erfassen der Durchführung und als Schnelltaste beim Eintrag.
- Gespeichert mit Datum, damit sie dem richtigen Monat zugeordnet werden.
- Offen: Sind „Projekte“ die bestehenden Einträge (Geräte), oder braucht es etwas Neues
  (z. B. Baustelle/Kunde)? Vorschlag: die bestehenden Einträge.
- Offen: Auch Stunden ohne Durchführung eintragen können (z. B. nur Arbeit an einem Gerät)? Vorschlag: ja.

## 21. Monatsübersicht der Zulagenstunden
- Am Monatsende eine grobe Übersicht: Summe Hitzestunden, Summe Staubstunden,
  wo am meisten (nach Eintrag und Gebiet), Anzahl erledigter Arbeiten im Monat.
- Benachrichtigung am **letzten Tag des Monats**; fällt der auf **Samstag oder Sonntag → einen Tag vorher**.
  Offen: Bei Sonntag „einen Tag vorher“ wäre Samstag – oder lieber immer der letzte Werktag (Freitag)?
  Vorschlag: letzter Werktag (Freitag).
- Übersicht jederzeit auch für frühere Monate aufrufbar.

## 22. Kalender: heute Erledigtes anzeigen
- Im Kalender steht beim heutigen Tag immer, **was heute schon gemacht wurde** (✓ Liste).
- Vorschlag: auch bei vergangenen Tagen anzeigen, was an dem Tag erledigt wurde.

