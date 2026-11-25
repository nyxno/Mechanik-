# Wünsche

Gesammelte Änderungswünsche. Erst programmieren, wenn der Nutzer das Go gibt.

**Stand:** Punkte 1–9 in Version 0.3, 10–13 in Version 0.4, 14–19 in Version 0.5, 20–22 in Version 0.6, 23–25 in Version 0.7, 26–29 in Version 0.8 umgesetzt (✅). Punkte 30–34 sind offen.

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

## ✅ 20. Hitze- und Staubstunden eintragen (Zulagen)
- **Hitzestunden** und **Staubstunden** getrennt eintragen, jeweils beim Eintrag/Projekt.
- So wenig Aufwand wie möglich: große Tasten **＋½ h / ＋1 h / ＋2 h** (und von Hand korrigierbar),
  direkt beim Erfassen der Durchführung und als Schnelltaste beim Eintrag.
- Gespeichert mit Datum, damit sie dem richtigen Monat zugeordnet werden.
- **Entschieden:** Projekte = die bestehenden Einträge.
- **Entschieden:** Stunden nur zusammen mit einer Durchführung.

## ✅ 21. Monatsübersicht der Zulagenstunden
- Am Monatsende eine grobe Übersicht: Summe Hitzestunden, Summe Staubstunden,
  wo am meisten (nach Eintrag und Gebiet), Anzahl erledigter Arbeiten im Monat.
- Benachrichtigung am **letzten Tag des Monats**; fällt der auf **Samstag oder Sonntag → einen Tag vorher**.
  **Entschieden:** immer der letzte Werktag (Sa/So → Freitag). Benachrichtigung um 15:00 Uhr;
  zusätzlich öffnet sich die Übersicht automatisch beim nächsten Öffnen der App (ab dem Abschlusstag,
  bzw. in den ersten 7 Tagen des neuen Monats nachgeholt).
- Eigene Taste „📊 Monatsstatistik“ im Kalender und in den Einstellungen.
- Inhalt: Hitze/Staub/gesamt mit Vergleich Vormonat, Arbeiten erledigt, Rangliste nach Eintrag und Gebiet,
  Wochentage, Ergebnisse, Auffälliges, Tagesliste der Zulagen, Ausblick nächster Monat.
- Übersicht jederzeit auch für frühere Monate aufrufbar.

## ✅ 22. Kalender: heute Erledigtes anzeigen
- Im Kalender steht beim heutigen Tag immer, **was heute schon gemacht wurde** (✓ Liste).
- **Entschieden:** Bei allen vergangenen Tagen wird angezeigt, was erledigt wurde (✓ Zahl im Kalender).

## ✅ 23. Zulagen-Taste: Hitze-/Staubstunden direkt eintragen
- Eigene Taste (z. B. „⏱ Zulagen“ auf der Startseite), unabhängig von Einträgen/Durchführungen.
- Zwei Zeilen: **🔥 Hitze** und **🌫 Staub**, jeweils große **− / ＋** Tasten, Anzeige der Stunden für heute.
- Wird automatisch in der Monatsstatistik (Summen, Tagesliste) mitgerechnet.
- Umgesetzt: Standard ist heute, Tag kann mit ◀ ▶ gewechselt werden; Schrittweite ½ Stunde.
- Stunden aus Durchführungen zählen weiterhin zusätzlich mit.

## ✅ 24. Unterkategorien
- Unter einer Kategorie weitere Unterkategorien anlegen, z. B. Heizung → Thermen, Kessel;
  Brandschutz → Feuerlöscher, Rauchmelder.
- Umgesetzt: eine Ebene (Kategorie → Unterkategorie); Unterkategorie hat die Farbe der Hauptkategorie.
- Löschen einer Hauptkategorie: Unterkategorien werden zu Hauptkategorien (nichts geht verloren).
- Filter: Hauptkategorie zeigt alles inkl. Unterkategorien; Unterkategorie nur ihre Einträge.
- Statistik und automatische Zuordnung berücksichtigen Unterkategorien.

## ✅ 25. Materialliste mit Bildern
- Eigene Liste für Material / Ersatzteile: **Name, Menge + Einheit, Notiz** (z. B. Artikelnummer, Lieferant)
  und **mehrere Fotos** (Kamera oder Galerie).
- Abhaken „besorgt“ wie eine Einkaufsliste; erledigte Einträge ausblendbar.
- Optional einem Eintrag (Gerät) zuordnen – beim Gerät steht dann „📦 Material“ mit den passenden Teilen.
- Lernende Vorschläge beim Namen.

## ✅ 26. Erster Termin bei Intervall wählbar
- Beim Anlegen mit Intervall muss klar wählbar sein, **wann es das erste Mal fällig ist**.
- Feld „Erstes Mal fällig am“ zeigt immer ein Datum (Standard: heute bzw. Montag; mit „zuletzt gemacht“
  automatisch zuletzt + Intervall) und lässt sich per Kalender ändern.

## ✅ 27. Kalender: Tag antippen → was wurde gemacht
- Tag antippen öffnet eine große Tagesansicht: erledigte Arbeiten (Ergebnis, Zulagen),
  Stunden über die Zulagen-Taste, und was geplant/fällig war. Mit ◀ ▶ Tag wechseln.

## ✅ 28. Hinweise löschen
- Jeder Hinweis hat „✕ Ausblenden“. Kommt nur wieder, wenn sich etwas ändert (z. B. ein weiterer Mangel).
- „Ausgeblendete wieder zeigen“ als Taste.

## ✅ 29. Zulagen bei den jeweiligen Arbeiten
- Hitze-/Staubstunden auch **nachträglich** bei einer erledigten Arbeit eintragen (im Verlauf antippen).
- Nach „✓ Heute erledigt“ direkt eine Taste „⏱ Zulagen“ in der Rückgängig-Leiste.
- Im Formular „Durchführung erfassen“ stehen die Zulagen weiter oben.

## 30. FEHLER Kalender (gemeldet am Handy)
- Meldung: Kalender „macht gar nichts“ (Tag antippen, ✓/⏱-Markierungen) und **Datum/Wochentage falsch**.
- Vermutete Ursache Wochentage: Das Raster nutzt Zellen mit Breite 100/7 % in einer umbrechenden Reihe.
  Auf Android-Handys wird beim Runden auf ganze Bildpunkte die Summe größer als die Breite → nur
  6 Tage pro Zeile → alle Tage rutschen unter den falschen Wochentag. (Im Browser fällt das nicht auf.)
- Lösung: Raster fest in 7 Spalten je Woche aufbauen (eine Zeile pro Woche, Zellen mit flex: 1).
- Tagesansicht prüfen und robuster machen; App-Version in den Einstellungen anzeigen,
  damit klar ist, welche Version installiert ist.

## 31. App-Version anzeigen
- App-Version in den Einstellungen anzeigen (damit klar ist, was installiert ist).
- **Entschieden:** keine Update-Taste, kein Drive-Link.

## 32. Morgen-Übersicht
- Jeden Arbeitstag (Mo–Fr) zur Standard-Uhrzeit eine Benachrichtigung:
  „Heute: 3 Arbeiten, 1 überfällig“ (antippen → App öffnet die Startseite).
- Ein-/ausschaltbar in den Einstellungen.

## 33. Abteilungen + Unterkategorien direkt beim neuen Eintrag
- **Entschieden (Nutzer):** Ablauf beim neuen Eintrag:
  **Abteilung wählen** (z. B. KE, HE) → **wenn gewünscht Unterkategorie** (z. B. Kühlturm, Pumpe) → hinzufügen.
- Die bisherigen „Kategorien“ heißen in der App ab jetzt **Abteilungen**, ihre Unterkategorien bleiben Unterkategorien.
- Direkt im Formular: „＋ Neue Abteilung“ und „＋ Neue Unterkategorie“ anlegen, ohne Umweg über die Einstellungen.
- Unterkategorie ist freiwillig („ohne Unterkategorie“ möglich).
- Startseite: Filter nach Abteilung (mit Unterkategorien darunter) wie bisher.
- Kein zusätzliches, getrenntes Abteilungs-Feld.

## 34. Magazin
- Neue Taste **„🗄 Magazin“**: Lagerorte von Dingen nachschlagen.
- Je Eintrag: **Name** (z. B. Loctite 243), **Regal**, **Fach**, **Paternoster** (Nr./Ebene), Notiz, Fotos.
- Schnelle Suche („Wo ist …?“), lernende Vorschläge.

