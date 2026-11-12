// Kurs-Kontext: Methode, Schreibweisen und Vorzeichenregeln aus den Unterlagen der Werkmeisterschule
// (Zentrales Kraftsystem Z05/Z10/Z30, Drehmoment DM10/DM20, Träger T10/T20). Wird dem KI-Tutor mitgegeben,
// damit Erklärungen und Lösungswege zum Unterricht passen.

export const COURSE_FILES = [
  { code: 'Z05', name: 'Kraftbegriff – was ist ein zentrales Kraftsystem', topics: ['kraftbegriff', 'zerlegung'] },
  { code: 'Z10', name: 'Kraft zerlegen und zusammensetzen – Zentrales Kraftsystem 1', topics: ['zerlegung', 'resultierende', 'gleichgewicht', 'anwendungen'] },
  { code: 'Z30', name: 'Beispielsammlung Zentrales Kraftsystem (Spannrolle, Kurbeltrieb, Kippbühne, Kniehebelpresse, Förderkorb, Nietmaschine, Spannvorrichtung)', topics: ['gleichgewicht', 'anwendungen', 'winkelfunktionen'] },
  { code: 'DM10', name: 'Drehmoment – Beispiele Hebel 1 bis 4', topics: ['drehmoment', 'hebel'] },
  { code: 'DM20', name: 'Türblatt und Wandkran mit Eigengewicht', topics: ['auflager-anwendungen', 'allgemeines-kraftsystem'] },
  { code: 'T10', name: 'Träger auf 2 Stützen – Auflagerkräfte', topics: ['allgemeines-kraftsystem', 'traeger'] },
  { code: 'T20', name: 'Träger auf 2 Stützen – Biegemomentenverlauf', topics: ['biegemoment'] },
];

export const COURSE_METHOD = `
Schreibweisen und Methode des Kurses (bitte genau so verwenden):
- Kraft F in N oder kN; Winkel α in Grad; Längen in mm, Momente in Nm (mm vorher in m umrechnen, oder kNmm → kNm).
- Jede Kraft hat vier Bestimmungsstücke: Betrag, Angriffspunkt, Richtung, Wirkungslinie (WL).
- Zeichnerische Lösung immer mit Kräftemaßstab (KM), z. B. 1 cm ≙ 1 kN. Lageplan (wo greifen die Kräfte an) getrennt vom Krafteck (Kräfte Spitze an Fuß aneinanderhängen).
- Resultierende: Krafteck/Linienzug vom Anfangspunkt zum Endpunkt. Rechnerisch: Fx = F·cos α, Fy = F·sin α (Winkel zur x-Achse), ΣFx, ΣFy, Fr = √(ΣFx² + ΣFy²), tan αr = ΣFy/ΣFx. Vorzeichen über den Quadranten prüfen.
- Zentrales Kraftsystem (alle WL schneiden sich in einem Punkt): Gleichgewicht, wenn das Krafteck geschlossen ist und einen Umlaufsinn hat. Dann ΣFx = 0 und ΣFy = 0.
- Typische Lösungswege im Kurs: rechtwinkliges Dreieck mit sin/cos/tan (GK = Gegenkathete, AK = Ankathete, HY = Hypotenuse), symmetrische Aufhängung über F/2, sonst Sinussatz S1/sin β = S2/sin γ = F/sin(α1+α2). Bei mehreren Knoten: Zentren bilden und jedes Zentrum einzeln lösen (Kniehebel).
- Drehmoment: M = F · ln, ln = Normalabstand (senkrechter Abstand vom Drehpunkt zur Wirkungslinie). Alternativ Kraft in Fx und Fy zerlegen und mit den jeweiligen Hebelarmen multiplizieren.
- Allgemeines Kraftsystem (Kräfte schneiden sich nicht in einem Punkt): drei Gleichgewichtsbedingungen ΣFx = 0, ΣFy = 0, ΣM = 0.
- Vorzeichenkonvention im Kurs: Drehmoment nach rechts (im Uhrzeigersinn) = +, y-Richtung nach oben = +, x-Richtung nach rechts = +.
- Drehpunkt klug wählen: dort, wo eine unbekannte Kraft angreift (z. B. ΣM um B, dann fällt B heraus). Festlager nimmt Kräfte in x und y auf, Loslager nur senkrecht zur Lagerfläche.
- Negative Auflagerkraft bedeutet: die Annahme der Richtung stimmt nicht, die Kraft wirkt entgegengesetzt (Träger würde abheben/kippen).
- Resultierende Auflagerkraft: B = √(Bx² + By²), Winkel α = atan(By/Bx) bzw. atan(Bx/By) je nach Bezugsachse.
- Biegemoment an einer Stelle: Summe der Momente aller Kräfte links (oder rechts) der Stelle. Nullpunktdurchgang der Querkraft = Stelle des maximalen Biegemoments. Kontrolle: von links und rechts gerechnet muss derselbe Wert herauskommen.
- Probe immer: zweiter Drehpunkt, Krafteck schließt sich, Betrag mit Pythagoras.
`;

export const TEACHER_TIPS = [
  'Immer zuerst ein Freikörperbild: Skizze mit Achsen, Winkeln und allen Kräften.',
  'Winkel an der x-Achse → cos für x, sin für y. Winkel an der y-Achse → vertauscht!',
  'Tabelle Fx | Fy führen und Vorzeichen über den Quadranten prüfen (150° → Fx negativ).',
  'arctan liefert nur −90° bis +90°: bei Fx < 0 → 180° addieren.',
  'Gleichgewicht: ΣFx = 0, ΣFy = 0, bei Drehung zusätzlich ΣM = 0.',
  'Drehpunkt klug wählen: möglichst viele Unbekannte fallen raus.',
  'Hebelarm = senkrechter Abstand. Einheiten (mm → m) und DEG am Rechner prüfen.',
  'Probe: Krafteck schließt sich bzw. zweiter Drehpunkt liefert dasselbe Ergebnis.',
];
