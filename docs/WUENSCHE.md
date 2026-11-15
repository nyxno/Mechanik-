# Offene Wünsche (noch nicht umgesetzt)

Gesammelte Änderungswünsche. Erst programmieren, wenn der Nutzer das Go gibt.

## 1. Reihenfolge der Kategorien ändern
- Die Kategorien (Heizung, Druckbehälter, Brandschutz …) sollen sich verschieben lassen,
  damit man selbst bestimmt, welche wo steht.
- Gilt für die Kategorie-Leiste auf der Startseite und für die Kategorien-Seite.
- Technisch vorbereitet: Spalte `kategorien.sortierung` gibt es schon.
- Bedienung: große Tasten ▲ / ▼ (handschuhtauglich) statt nur Ziehen mit dem Finger.

## 2. Intervall „Einmalig“ + Ordner „Erledigt“
- Zusätzlich zu „alle X Tage/Wochen/Monate/Jahre“ eine Auswahl **„Einmalig“**.
- Ein einmaliger Eintrag braucht ein Fälligkeitsdatum und wiederholt sich nicht.
- **Nach der Durchführung** wandert der Eintrag in einen Bereich **„Erledigt“**
  (neu anlegen, gibt es noch nicht). Dort grün mit „Erledigt am …“, keine Erinnerungen mehr,
  Verlauf und Fotos bleiben sichtbar.
- Erledigte Einträge erscheinen nicht mehr in der normalen Übersicht.

## 3. Wochenende vermeiden
- Fällt ein Termin auf **Samstag oder Sonntag**, wird er automatisch auf einen Werktag verschoben.
- **Entschieden:** Samstag → Freitag davor, Sonntag → Montag danach.
- Gilt für berechnete Termine; Erinnerung kommt dann am verschobenen Tag.
- Später denkbar: Feiertage ebenfalls berücksichtigen.

## 4. Liste „Diese Woche / Nächste Woche“
- Eigene Ansicht: was steht **diese Woche** an, was **nächste Woche** (Montag bis Sonntag).
- Überfälliges oben dabei, damit nichts untergeht.
- Erreichbar von der Startseite mit einer großen Taste.

## 5. Schlummer-Taste („Snooze“)
- Einen Termin mit einer Taste **auf den nächsten Tag verschieben**.
- Sowohl direkt in der Benachrichtigung („Morgen erinnern“) als auch in der App beim Eintrag.
- **Entschieden:** Nur die Erinnerung wird verschoben. Die echte Prüffrist bleibt sichtbar
  (Ampel und Datum ändern sich durch Schlummern nicht).
- **Entschieden:** Nach Erledigung der Arbeit startet die neue Prüffrist ab dem Erledigungsdatum
  (Durchführungsdatum + Intervall, Wochenend-Regel aus Punkt 3 angewendet). Die Schlummer-Verschiebung
  ist damit hinfällig.
- Fällt der nächste Tag aufs Wochenende → Samstag auf Freitag geht beim Schlummern nicht (wäre heute),
  daher beim Schlummern Wochenende immer auf Montag.
