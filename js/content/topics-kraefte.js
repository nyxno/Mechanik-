// Modul 1: Kräfte und zentrales Kraftsystem (nach Z05, Z10, Z30)
import * as S from './sketches.js';

export const MODULE = { id: 'kraefte', title: 'Kräfte und zentrales Kraftsystem', order: 1 };

export const TOPICS = [
  {
    id: 'kraftbegriff', module: 'kraefte', order: 1, minutes: 20,
    title: 'Der Kraftbegriff', short: 'Was eine Kraft ist, ihre vier Bestimmungsstücke und der Kräftemaßstab.',
    keywords: ['kraft', 'bestimmungsstücke', 'angriffspunkt', 'wirkungslinie', 'kräftemaßstab', 'newton', 'betrag', 'richtung'],
    prereq: [], sources: ['Z05 Kraftbegriff'],
    intro: `Eine Kraft kann man nicht sehen, nur ihre Wirkung: Sie verformt einen Körper oder ändert seine Bewegung. In der Technik zeichnen wir Kräfte als Pfeile. Alles, was wir später rechnen (Zerlegen, Zusammensetzen, Gleichgewicht, Drehmoment), baut auf diesem Pfeil auf.`,
    steps: [
      { h: 'Kraft = Pfeil mit vier Bestimmungsstücken', html: `<p>Im Kurs werden genau vier Dinge verlangt, damit eine Kraft eindeutig ist:</p><ul><li><b>Betrag</b> – wie groß ist die Kraft? Einheit Newton (N), 1 kN = 1000 N. Im Bild ist der Betrag die Pfeillänge.</li><li><b>Angriffspunkt</b> – wo greift sie an?</li><li><b>Richtung</b> – wohin zeigt die Pfeilspitze?</li><li><b>Wirkungslinie (WL)</b> – die gedachte Gerade, auf der die Kraft liegt. Entlang der WL darf eine Kraft verschoben werden, ohne dass sich ihre Wirkung auf einen starren Körper ändert.</li></ul>`, sketch: () => S.sketchKraft() },
      { h: 'Der Kräftemaßstab (KM)', html: `<p>Für zeichnerische Lösungen wird festgelegt, wie viel Kraft einer Länge entspricht, zum Beispiel <span class="formula">KM: 1 cm ≙ 1 kN</span>. Eine Kraft von 10 kN wird dann 10 cm lang gezeichnet. Am Ende wird der gesuchte Pfeil abgemessen und mit dem KM zurück in Newton umgerechnet.</p><p>Beispiel aus Z10: „Fr abmessen = 87 mm und im KM umrechnen“ bei KM 1 mm ≙ 1 N ergibt Fr = 87 N.</p>` },
      { h: 'Winkel und Wirkungslinie angeben', html: `<p>Die Lage einer Wirkungslinie wird im Kurs über den Winkel zur x-Achse angegeben, gegen den Uhrzeigersinn positiv: <code>WL 1 = −10°</code>, <code>WL 2 = 100°</code>. Ein negativer Winkel liegt unterhalb der x-Achse. 180° zeigt nach links, 270° (oder −90°) nach unten.</p>` },
      { h: 'Gewichtskraft', html: `<p>Die häufigste Kraft in Aufgaben ist die Gewichtskraft einer Masse: <span class="formula">FG = m · g</span> mit g = 9,81 m/s². Eine Masse von 100 kg zieht also mit rund 981 N nach unten. In Zeichnungen greift FG im Schwerpunkt an und zeigt immer senkrecht nach unten.</p>` },
    ],
    formulas: [
      { name: 'Gewichtskraft', f: 'FG = m · g', note: 'm in kg, g = 9,81 m/s², FG in N' },
      { name: 'Umrechnung', f: '1 kN = 1000 N', note: 'Ergebnisse im Kurs meist in kN bei großen Lasten' },
      { name: 'Kräftemaßstab', f: 'F = gemessene Länge · KM', note: 'z. B. 87 mm · 1 N/mm = 87 N' },
    ],
    examples: [
      { title: 'Kraft F = 100 N unter 30° beschreiben', source: 'Z05, Beispiel 1', given: 'F = 100 N, Wirkungslinie 30°, Angriffspunkt im Ursprung', wanted: 'Bestimmungsstücke benennen', steps: ['Betrag: 100 N (bei KM 1 cm ≙ 10 N wird der Pfeil 10 cm lang).', 'Angriffspunkt: der Punkt, an dem der Pfeil beginnt.', 'Richtung: Pfeilspitze zeigt nach rechts oben.', 'Wirkungslinie: Gerade unter 30° zur x-Achse durch den Angriffspunkt.'], result: 'Alle vier Bestimmungsstücke sind damit festgelegt.' },
    ],
    mistakes: [
      { wrong: 'Masse (kg) und Kraft (N) verwechseln.', right: 'Masse ist Stoffmenge, Kraft entsteht erst über FG = m · g. 50 kg ⇒ 490,5 N.' },
      { wrong: 'Pfeil ohne Maßstab zeichnen und dann abmessen.', right: 'KM vorher festlegen und notieren, sonst ist der abgemessene Wert wertlos.' },
    ],
    tips: ['Schreib bei jeder Aufgabe zuerst „geg.:“ und „ges.:“ auf, so wie im Kurs. Das ordnet den Kopf.', 'Zeichne die Wirkungslinie gestrichelt über den Pfeil hinaus. Dann siehst du Schnittpunkte mit anderen Wirkungslinien sofort.'],
  },

  {
    id: 'winkelfunktionen', module: 'kraefte', order: 2, minutes: 25,
    title: 'Winkelfunktionen im rechtwinkligen Dreieck', short: 'sin, cos, tan mit GK, AK, HY. Das Werkzeug für alle Kraftrechnungen.',
    keywords: ['sinus', 'cosinus', 'tangens', 'gegenkathete', 'ankathete', 'hypotenuse', 'winkelfunktion', 'arctan', 'pythagoras'],
    prereq: ['kraftbegriff'], sources: ['Z30 Beispielsammlung (Folie Winkelfunktionen)'],
    intro: `Fast jede Rechnung im zentralen Kraftsystem ist ein rechtwinkliges Dreieck. Wer sin, cos und tan sicher zuordnet, hat die halbe Prüfung. Der Kurs schreibt dafür die Merkform <b>GK</b> (Gegenkathete), <b>AK</b> (Ankathete) und <b>HY</b> (Hypotenuse).`,
    steps: [
      { h: 'Die drei Seiten benennen', html: `<p>Die <b>Hypotenuse</b> liegt immer gegenüber dem rechten Winkel und ist die längste Seite. Die <b>Gegenkathete</b> liegt dem betrachteten Winkel α gegenüber, die <b>Ankathete</b> liegt an ihm an. Wichtig: GK und AK hängen davon ab, welchen Winkel du gerade betrachtest!</p>`, sketch: () => S.sketchDreieck(30) },
      { h: 'Die drei Formeln', html: `<p><span class="formula">sin α = GK / HY</span> <span class="formula">cos α = AK / HY</span> <span class="formula">tan α = GK / AK</span></p><p>Merkhilfe: <em>GAGA HühnerHof AG</em> – sin: G/H, cos: A/H, tan: G/A.</p><p>Umstellen nach der gesuchten Seite: <code>GK = HY · sin α</code>, <code>AK = HY · cos α</code>, <code>HY = GK / sin α = AK / cos α</code>.</p>` },
      { h: 'Winkel aus Längen: arctan', html: `<p>Oft ist der Winkel nicht gegeben, sondern zwei Längen. Dann: <span class="formula">α = arctan(GK / AK)</span>. Beispiel Kurbeltrieb (Z30, Bsp. 173): tan α = 450 / 2250 ⇒ α = 11,3°. Beispiel Kippbühne: tan α = 1160 / 4250 ⇒ α = 15,3°.</p><p>Taschenrechner: <b>DEG</b>-Modus prüfen! Im RAD-Modus kommt Unsinn heraus.</p>` },
      { h: 'Pythagoras als Probe', html: `<p><span class="formula">HY² = GK² + AK²</span>. Damit kontrollierst du jedes Ergebnis: F = √(Fx² + Fy²) muss wieder die Ausgangskraft ergeben.</p>` },
    ],
    formulas: [
      { name: 'Sinus', f: 'sin α = GK / HY', note: 'GK = HY · sin α' },
      { name: 'Cosinus', f: 'cos α = AK / HY', note: 'AK = HY · cos α' },
      { name: 'Tangens', f: 'tan α = GK / AK', note: 'α = arctan(GK / AK)' },
      { name: 'Pythagoras', f: 'HY = √(GK² + AK²)', note: 'Probe' },
      { name: 'Sinussatz', f: 'a / sin α = b / sin β = c / sin γ', note: 'für nicht-rechtwinklige Dreiecke (Krafteck mit 3 Kräften)' },
      { name: 'Winkelsumme', f: 'α + β + γ = 180°', note: 'fehlende Winkel im Krafteck' },
    ],
    examples: [
      { title: 'Winkel am Kurbeltrieb', source: 'Z30, Beispiel 173', given: 'Schubstange l = 2250 mm, Kurbelradius 450 mm, Kurbel steht senkrecht zur Schubstange', wanted: 'Winkel α der Schubstange', steps: ['Rechtwinkliges Dreieck: GK = 450 (Kurbel), AK = 2250 (Schubstange).', 'tan α = 450 / 2250 = 0,2', 'α = arctan(0,2) = 11,3°'], result: 'α = 11,3°' },
    ],
    mistakes: [
      { wrong: 'sin und cos vertauschen, weil der Winkel an der „falschen“ Achse liegt.', right: 'Immer fragen: Liegt die gesuchte Seite dem Winkel gegenüber (sin) oder an ihm an (cos)?' },
      { wrong: 'Rechner im RAD-Modus.', right: 'sin 30° muss 0,5 ergeben. Wenn nicht: Modus umstellen.' },
      { wrong: 'Bei arctan das Verhältnis verkehrt (AK/GK).', right: 'tan = Gegenkathete durch Ankathete. Kontrolle: kleiner Winkel ⇒ kleine Gegenkathete.' },
    ],
    tips: ['Prüfe Ergebnisse mit Grenzfällen: Bei α = 0° ist sin = 0 und cos = 1. Bei 90° umgekehrt.', 'Zeichne das Dreieck groß und beschrifte GK, AK, HY, bevor du rechnest.'],
  },

  {
    id: 'zerlegung', module: 'kraefte', order: 3, minutes: 35,
    title: 'Kräfte zerlegen', short: 'Eine Kraft in zwei Richtungen aufteilen: in x und y oder in zwei beliebige Wirkungslinien.',
    keywords: ['zerlegen', 'zerlegung', 'komponente', 'kräfteparallelogramm', 'fx', 'fy', 'wirkungslinie'],
    prereq: ['winkelfunktionen'], sources: ['Z05 Beispiele 1 und 2', 'Z10'],
    intro: `Zerlegen heißt: Eine Kraft wird durch zwei Kräfte ersetzt, die zusammen genau dieselbe Wirkung haben. Meistens zerlegen wir in die Koordinatenrichtungen x und y, weil man damit rechnen kann. Manchmal aber auch in zwei vorgegebene Wirkungslinien, etwa in eine Strebe und eine Säule.`,
    steps: [
      { h: 'Zerlegen in x und y (rechnerisch)', html: `<p>Liegt der Winkel α an der <b>x-Achse</b>: <span class="formula">Fx = F · cos α</span> und <span class="formula">Fy = F · sin α</span>.</p><p>Liegt der Winkel an der <b>y-Achse</b> (z. B. 30° zur Senkrechten), ist es vertauscht: Fy = F · cos α, Fx = F · sin α. Genau so rechnet Z10 bei F2: „F2y = F2 · cos 30° = 52 N, F2x = F2 · sin 30° = 30 N“.</p><p>Probe: √(Fx² + Fy²) = F.</p>`, sketch: () => S.sketchZerlegung(100, 30), lab: 'zerlegung' },
      { h: 'Zerlegen in zwei beliebige Wirkungslinien (zeichnerisch)', html: `<p>Lösungsweg aus Z05, Beispiel 2:</p><ol><li>F im Kräftemaßstab zeichnen.</li><li>Die beiden Wirkungslinien WL1 und WL2 durch den <b>Angriffspunkt</b> legen.</li><li>Beide WL <b>parallel</b> in den <b>Endpunkt</b> (Pfeilspitze) von F verschieben. Es entsteht ein Parallelogramm.</li><li>F1 und F2 vom Angriffspunkt bis zu den Ecken eintragen und abmessen.</li></ol><p>Ergebnis in Z05: F = 10 kN, α = 30°, WL1 = −10°, WL2 = 100° ⇒ F1 ≈ 9,8 kN, F2 ≈ 7 kN.</p>`, sketch: () => S.sketchResultierende(98, -10, 70, 100, 1.6) },
      { h: 'Zerlegen in zwei Wirkungslinien (rechnerisch)', html: `<p>Das Parallelogramm hat als halbes Dreieck die Innenwinkel aus den WL-Winkeln. Mit dem <b>Sinussatz</b>: <span class="formula">F1 / sin β = F2 / sin γ = F / sin(α1 + α2)</span>. Dabei ist α1 + α2 der Winkel zwischen den beiden Wirkungslinien, β und γ sind die Winkel gegenüber F1 bzw. F2 (aus der Winkelsumme 180°).</p><p>Stehen die beiden WL senkrecht aufeinander, reicht wieder sin/cos.</p>` },
      { h: 'Wofür braucht man das?', html: `<ul><li>Eine schräge Seilkraft in waagrechten und senkrechten Anteil aufteilen (Auflagerkräfte).</li><li>Kolbenkraft in Pleuelkraft und Normalkraft aufteilen (Kurbeltrieb).</li><li>Gewichtskraft auf der schiefen Ebene in Hangabtrieb und Normalkraft.</li><li>Schräge Kraft am Hebel in den Anteil, der dreht, und den, der nur zieht.</li></ul>` },
    ],
    formulas: [
      { name: 'Komponenten (Winkel an x)', f: 'Fx = F · cos α ;  Fy = F · sin α', note: 'α gegen die x-Achse' },
      { name: 'Komponenten (Winkel an y)', f: 'Fy = F · cos α ;  Fx = F · sin α', note: 'α gegen die Senkrechte' },
      { name: 'Betrag zurück', f: 'F = √(Fx² + Fy²)', note: 'Probe' },
      { name: 'Winkel zurück', f: 'tan α = Fy / Fx', note: 'Quadrant beachten' },
      { name: 'Zwei beliebige WL', f: 'F1 / sin β = F2 / sin γ = F / sin(α1 + α2)', note: 'Sinussatz im Kräftedreieck' },
    ],
    examples: [
      { title: 'F = 100 N unter 30° in Fx und Fy zerlegen', source: 'Z05, Beispiel 1', given: 'F = 100 N, α = 30° zur x-Achse', wanted: 'Fx, Fy', steps: ['Fx = F · cos α = 100 · cos 30° = 86,6 N', 'Fy = F · sin α = 100 · sin 30° = 50,0 N', 'Probe: √(86,6² + 50²) = 100 N ✓'], result: 'Fx = 86,6 N, Fy = 50 N' },
      { title: 'F2 = 60 N unter 120° zerlegen', source: 'Z10, Beispiel 2', given: 'F2 = 60 N, α2 = 120° (also 30° zur y-Achse, nach links oben)', wanted: 'F2x, F2y', steps: ['Winkel zur y-Achse ist 30°, daher vertauscht: F2y = F2 · cos 30° = 52 N', 'F2x = F2 · sin 30° = 30 N, zeigt nach links ⇒ in der Summe mit Minus: −30 N', 'Kontrolle über x-Achse: cos 120° = −0,5 ⇒ F2x = −30 N ✓'], result: 'F2x = −30 N, F2y = +52 N' },
    ],
    mistakes: [
      { wrong: 'Immer Fx = F·cos α schreiben, egal wo der Winkel liegt.', right: 'Schau, an welcher Achse α anliegt. Liegt er an der y-Achse, ist cos für Fy zuständig.' },
      { wrong: 'Vorzeichen vergessen: Kraft zeigt nach links, Fx wird positiv eingesetzt.', right: 'Vor dem Summieren jede Komponente mit Vorzeichen nach ihrer Richtung versehen (links/unten = minus).' },
    ],
    tips: ['Skizziere das Komponenten-Dreieck direkt an den Pfeil. Dann ist sofort klar, welche Seite GK und AK ist.', 'Bei Winkeln über 90° erst den spitzen Hilfswinkel zur nächsten Achse bilden (z. B. 120° ⇒ 60° zur negativen x-Achse bzw. 30° zur y-Achse).'],
  },

  {
    id: 'resultierende', module: 'kraefte', order: 4, minutes: 40,
    title: 'Kräfte zusammensetzen: die Resultierende', short: 'Mehrere Kräfte durch eine einzige ersetzen – mit Parallelogramm, Krafteck oder Komponenten.',
    keywords: ['resultierende', 'krafteck', 'linienzug', 'parallelogramm', 'zusammensetzen', 'summe fx', 'summe fy'],
    prereq: ['zerlegung'], sources: ['Z05 Beispiel 3', 'Z10 Beispiele 1–3'],
    intro: `Die Resultierende Fr ist die eine Kraft, die genauso wirkt wie alle Einzelkräfte zusammen. Im zentralen Kraftsystem schneiden sich alle Wirkungslinien in einem Punkt, deshalb greift auch Fr dort an. Es gibt drei Wege, und in der Prüfung sind meist zwei verlangt: zeichnerisch und rechnerisch.`,
    steps: [
      { h: 'Weg 1: Kräfteparallelogramm (2 Kräfte)', html: `<p>F1 und F2 vom gemeinsamen Angriffspunkt zeichnen, beide parallel an die Spitze der jeweils anderen verschieben, Diagonale vom Angriffspunkt zur gegenüberliegenden Ecke = Fr. Z10, Beispiel 1: F1 = 60 N (0°), F2 = 40 N (60°) ⇒ Fr = 87 N unter 23,5°.</p>`, sketch: () => S.sketchResultierende(60, 0, 40, 60, 2.4), lab: 'resultierende' },
      { h: 'Weg 2: Krafteck / Linienzug (beliebig viele Kräfte)', html: `<p>Kräfte im Maßstab <b>Spitze an Fuß</b> aneinanderhängen: „F1 zeichnen, F2 an F1 anhängen, F3 an F2 anhängen. Anfangspunkt mit Endpunkt verbinden ergibt Fr“ (Z10). Die Reihenfolge ist egal. Fr zeigt vom Anfang des ersten zum Ende des letzten Pfeils.</p>`, sketch: () => S.sketchKrafteck([{ F: 100, a: 0, name: 'F1 = 100 N' }, { F: 60, a: 120, name: 'F2 = 60 N' }, { F: 80, a: 180, name: 'F3 = 80 N' }], { scale: 1.5 }) },
      { h: 'Weg 3: Rechnerisch mit Komponenten', html: `<p>Jede Kraft in Fx und Fy zerlegen, mit Vorzeichen in eine Tabelle, dann summieren:</p><p><span class="formula">ΣFx = F1x + F2x + …</span> <span class="formula">ΣFy = F1y + F2y + …</span></p><p><span class="formula">Fr = √(ΣFx² + ΣFy²)</span> <span class="formula">tan αr = ΣFy / ΣFx</span></p><p>Z10, Beispiel 2: F1 = 100 N (0°), F2 = 60 N (120°), F3 = 80 N (180°): ΣFx = 100 − 30 − 80 = −10 N, ΣFy = 52 N ⇒ Fr = 53 N. Der Winkel: tan = 52/10 ⇒ 79° zur negativen x-Achse, also αr ≈ 101° (ΣFx negativ!).</p>` },
      { h: 'Den Winkel richtig deuten (Quadrant)', html: `<p>Der Taschenrechner liefert bei arctan nur Werte zwischen −90° und +90°. Darum:</p><ul><li>ΣFx > 0, ΣFy > 0 → Winkel so lassen (1. Quadrant)</li><li>ΣFx < 0 → 180° addieren (2./3. Quadrant)</li><li>ΣFx > 0, ΣFy < 0 → negativer Winkel bzw. 360° addieren (4. Quadrant)</li></ul><p>Immer mit der Skizze vergleichen: Zeigt Fr nach links oben, muss der Winkel zwischen 90° und 180° liegen.</p>` },
    ],
    formulas: [
      { name: 'Summen', f: 'ΣFx = Σ Fi · cos αi ;  ΣFy = Σ Fi · sin αi', note: 'αi jeweils zur x-Achse, Vorzeichen automatisch' },
      { name: 'Betrag', f: 'Fr = √(ΣFx² + ΣFy²)', note: '' },
      { name: 'Richtung', f: 'αr = arctan(ΣFy / ΣFx)', note: '+180° wenn ΣFx < 0' },
      { name: 'Zwei Kräfte (Cosinussatz)', f: 'Fr = √(F1² + F2² + 2·F1·F2·cos φ)', note: 'φ = Winkel zwischen F1 und F2' },
    ],
    examples: [
      { title: 'Vier Kräfte zusammensetzen', source: 'Z10, Beispiel 3 (Buch 1.76, S. 28)', given: 'F1 = 5,2 kN (30°), F2 = 3,7 kN (107°), F3 = 2,7 kN (201°), F4 = 2,5 kN (321°)', wanted: 'Fr rechnerisch und zeichnerisch', steps: ['Hilfswinkel zur nächsten Achse: 30°, 17° (zur y-Achse), 21° (zur −x-Achse), 39° (zur x-Achse nach unten).', 'F1x = 5,2·cos30° = 4,5 kN; F1y = 5,2·sin30° = 2,6 kN', 'F2x = −3,7·sin17° = −1,1 kN; F2y = 3,7·cos17° = 3,5 kN', 'F3x = −2,7·cos21° = −2,5 kN; F3y = −2,7·sin21° = −1,0 kN', 'F4x = 2,5·cos39° = 1,9 kN; F4y = −2,5·sin39° = −1,6 kN', 'ΣFx = 4,5 − 1,1 − 2,5 + 1,9 = 2,8 kN; ΣFy = 2,6 + 3,5 − 1,0 − 1,6 = 3,6 kN', 'Fr = √(2,8² + 3,6²) = 4,6 kN (Kurs: 4,7 kN gerundet); αr = arctan(3,6/2,8) = 52°'], result: 'Fr ≈ 4,6 kN unter 52°' },
      { title: 'Drei Kräfte zusammensetzen', source: 'Z10, Beispiel 2', given: 'F1 = 100 N (0°), F2 = 60 N (120°), F3 = 80 N (180°)', wanted: 'Fr', steps: ['F1x = 100 N, F1y = 0', 'F2x = −60·sin30° = −30 N, F2y = 60·cos30° = 52 N', 'F3x = −80 N, F3y = 0', 'ΣFx = 100 − 30 − 80 = −10 N; ΣFy = 52 N', 'Fr = √(10² + 52²) = 53 N', 'Winkel: arctan(52/−10) ⇒ 79° zur negativen x-Achse ⇒ αr ≈ 101°'], result: 'Fr = 53 N, zeigt nach links oben' },
    ],
    mistakes: [
      { wrong: 'Kräfte einfach addieren (100 + 60 + 80 = 240 N).', right: 'Beträge darf man nur addieren, wenn alle Kräfte auf einer Wirkungslinie in gleicher Richtung liegen. Sonst Komponenten!' },
      { wrong: 'Im Krafteck alle Pfeile vom selben Punkt starten lassen.', right: 'Im Krafteck Spitze an Fuß. Vom selben Punkt starten nur die Pfeile im Lageplan.' },
      { wrong: 'Winkel aus arctan ungeprüft übernehmen.', right: 'Vorzeichen von ΣFx und ΣFy ansehen und Quadrant bestimmen.' },
    ],
    tips: ['Lege immer eine Tabelle an: Kraft | Winkel | Fx | Fy. Fehler fallen in der Tabelle sofort auf.', 'Zeichnerische und rechnerische Lösung müssen zusammenpassen (±5 %). Wenn nicht, ist einer der beiden Wege falsch.'],
  },

  {
    id: 'gleichgewicht', module: 'kraefte', order: 5, minutes: 45,
    title: 'Gleichgewicht im zentralen Kraftsystem', short: 'Geschlossenes Krafteck mit Umlaufsinn, ΣFx = 0 und ΣFy = 0, Seilkräfte berechnen.',
    keywords: ['gleichgewicht', 'umlaufsinn', 'krafteck geschlossen', 'seilkraft', 'ampel', 'bogen', 'sinussatz', 'gleichgewichtskraft'],
    prereq: ['resultierende'], sources: ['Z10 Beispiele 4–8', 'Z30 Beispielsammlung'],
    intro: `Ein Körper ist im Gleichgewicht, wenn sich alle Kräfte gegenseitig aufheben. Im zentralen Kraftsystem heißt das: Das Krafteck schließt sich und hat einen <b>Umlaufsinn</b> (alle Pfeile laufen im Kreis hintereinander). Rechnerisch: ΣFx = 0 und ΣFy = 0. Mit diesen zwei Gleichungen können zwei Unbekannte bestimmt werden, zum Beispiel zwei Seilkräfte.`,
    steps: [
      { h: 'Resultierende und Gleichgewichtskraft', html: `<p>Die Gleichgewichtskraft G ist die Gegenkraft zur Resultierenden: gleicher Betrag, entgegengesetzte Richtung (Winkel + 180°). Hängt man G ans Krafteck an, schließt es sich: Anfang = Ende.</p><p>Z10 Beispiel 4 unterscheidet genau das: Beim Bogen mit zwei Sehnenkräften S = 700 N unter 35° ist das Krafteck <em>offen</em> und liefert die Resultierende F = 803 N. Im Gleichgewichtsfall (Handspannkraft) ist das Krafteck <em>geschlossen</em> und hat einen Umlaufsinn.</p>`, sketch: () => S.sketchKrafteck([{ F: 70, a: 35, name: 'S' }, { F: 70, a: -35, name: 'S' }, { F: 114.7, a: 180, name: 'F' }], { scale: 1.8 }) },
      { h: 'Lösungsweg des Kurses für Gleichgewicht', html: `<ol><li>Lageplan zeichnen (alle Kräfte am Knoten, Wirkungslinien gestrichelt).</li><li>Krafteck zeichnen: die <b>bekannte</b> Kraft im KM zeichnen.</li><li>Die beiden Wirkungslinien der gesuchten Kräfte je an ein Ende der bekannten Kraft anlegen.</li><li>Pfeilrichtungen so eintragen, dass ein Umlaufsinn entsteht.</li><li>Beträge abmessen, mit KM umrechnen und Pfeilrichtungen in den Lageplan übertragen.</li></ol>` },
      { h: 'Symmetrische Aufhängung: F/2', html: `<p>Hängt eine Last F an zwei gleichen Seilen mit gleichem Winkel α zur Waagrechten, trägt jedes Seil die halbe Last senkrecht: <span class="formula">S = (F/2) / sin α</span>.</p><p>Verkehrsampel (Z10, Bsp. 5): F = 400 N, α = 15° ⇒ S = 200 / sin 15° = 773 N. Die Seilkraft ist fast doppelt so groß wie die Last, weil die Seile so flach hängen!</p><p>Wird der Winkel zur <em>Senkrechten</em> angegeben (Spannrolle, Z30 Bsp. 158: 50°), steht cos: S = (FG/2) / cos 50° = 950 / cos 50° = 1478 N.</p>`, sketch: () => S.sketchAmpel(400, 15) },
      { h: 'Unterschiedliche Winkel: Sinussatz', html: `<p>Sind die Seilwinkel verschieden (Z10, Bsp. 5b: α1 = 15°, α2 = 25°), ist das Kräftedreieck nicht mehr gleichschenklig. Dann Sinussatz:</p><p><span class="formula">S1 / sin β = S2 / sin γ = F / sin(α1 + α2)</span></p><p>β und γ sind die Winkel gegenüber S1 bzw. S2; sie ergeben sich aus der Winkelsumme (β = 90° − α1, γ = 90° − α2, Probe: β + γ + (α1 + α2) = 180°). Ergebnis im Kurs: S2 = 400·sin 65°/sin 40° = 564 N, S1 = 400·sin 75°/sin 40° = 601 N.</p><p>Alternativ über die Gleichungen: ΣFx = 0: −S1·cos α1 + S2·cos α2 = 0 und ΣFy = 0: S1·sin α1 + S2·sin α2 − F = 0. Zwei Gleichungen, zwei Unbekannte.</p>` },
      { h: 'Kräfte am Kolben', html: `<p>Z10, Bsp. 6: Kolbenkraft FK = 2 kN, Pleuel unter αP = 40° zur Kolbenachse. Die Kolbenwand kann nur eine Normalkraft FN (senkrecht) aufnehmen. Rechtwinkliges Dreieck mit FK als Ankathete:</p><p><span class="formula">FN = FK · tan αP</span> = 2 · tan 40° = 1,7 kN, <span class="formula">FP = FK / cos αP</span> = 2 / cos 40° = 2,6 kN.</p>`, sketch: () => S.sketchKolben(40) },
    ],
    formulas: [
      { name: 'Gleichgewicht (zentral)', f: 'ΣFx = 0 ;  ΣFy = 0', note: 'Krafteck geschlossen, Umlaufsinn' },
      { name: 'Gleichgewichtskraft', f: 'G = −Fr', note: 'gleicher Betrag, α + 180°' },
      { name: 'Symmetrische Aufhängung', f: 'S = (F/2) / sin α', note: 'α zur Waagrechten; zur Senkrechten: cos' },
      { name: 'Zwei verschiedene Seile', f: 'S1 = F·sin β / sin(α1+α2) ;  S2 = F·sin γ / sin(α1+α2)', note: 'Sinussatz' },
      { name: 'Kolben', f: 'FN = FK · tan αP ;  FP = FK / cos αP', note: 'Z10 Beispiel 6–8' },
    ],
    examples: [
      { title: 'Verkehrsampel', source: 'Z10, Beispiel 5', given: 'F = 400 N, beide Seile α = 15° zur Waagrechten', wanted: 'Seilkraft S', steps: ['Lageplan: Last nach unten, zwei Seile symmetrisch.', 'Krafteck: F zeichnen, an beide Enden die WL der Seile anlegen ⇒ gleichschenkliges Dreieck.', 'Halbes Dreieck: GK = F/2 = 200 N, HY = S, Winkel α = 15°.', 'sin α = (F/2) / S ⇒ S = (F/2) / sin α = 200 / sin 15° = 773 N'], result: 'S = 773 N in jedem Seil' },
      { title: 'Kniehebelpresse, Zentrum I', source: 'Z30, Beispiel 160', given: 'Waagrechte Kraft F = 1500 N, Spreizen unter 10° zur Waagrechten', wanted: 'Druckkraft S in den Spreizen', steps: ['Zentrum I: F wirkt waagrecht, die beiden Spreizen symmetrisch unter 10°.', 'sin 10° = (F/2) / S', 'S = 750 / sin 10° = 4319 N'], result: 'S = 4319 N (Kniehebel: kleiner Winkel ⇒ riesige Kraft)' },
    ],
    mistakes: [
      { wrong: 'Bei zwei Seilen jedem Seil die halbe Last als Seilkraft geben (S = F/2).', right: 'F/2 ist nur die senkrechte Komponente. Die Seilkraft ist (F/2)/sin α und damit größer.' },
      { wrong: 'sin und cos vertauschen, je nachdem ob der Winkel zur Waagrechten oder Senkrechten angegeben ist.', right: 'Winkel zur Waagrechten: senkrechte Komponente = S·sin α. Winkel zur Senkrechten: = S·cos α.' },
      { wrong: 'Pfeilrichtungen im Krafteck beliebig setzen.', right: 'Alle Pfeile müssen im Kreis hintereinander laufen (Umlaufsinn). Sonst ist es kein Gleichgewicht.' },
    ],
    tips: ['Je flacher ein Seil hängt, desto größer die Seilkraft. Ein Ergebnis unter der halben Last ist sicher falsch.', 'Bei mehreren Knoten (Kniehebel, Nietmaschine): „Zentren bilden und jedes Zentrum einzeln berechnen“ – die Kraft aus Zentrum I ist die bekannte Kraft für Zentrum II.'],
  },

  {
    id: 'anwendungen', module: 'kraefte', order: 6, minutes: 45,
    title: 'Anwendungen: Kurbeltrieb, Kniehebel, Spannrolle, Keil', short: 'Die Beispielsammlung des Kurses Schritt für Schritt: typische Maschinen als zentrale Kraftsysteme.',
    keywords: ['kurbeltrieb', 'kniehebel', 'spannrolle', 'kippbühne', 'förderkorb', 'nietmaschine', 'spannvorrichtung', 'keil', 'pleuel', 'kurbelwelle'],
    prereq: ['gleichgewicht'], sources: ['Z30 Beispielsammlung', 'Z10 Beispiele 7–8'],
    intro: `In der Beispielsammlung werden echte Maschinen auf zentrale Kraftsysteme zurückgeführt. Das Muster ist immer gleich: Knoten (Zentrum) finden, Lageplan, Krafteck mit Umlaufsinn, rechtwinkliges Dreieck oder Sinussatz. Dieses Thema übt das Übertragen auf neue Situationen.`,
    steps: [
      { h: 'Kurbeltrieb (Z30, Bsp. 173)', html: `<p>Kolbenkraft FK = 140 kN, Schubstange l = 2250 mm, Kurbel 450 mm, Schubstange und Kurbel stehen im rechten Winkel. Zwischenrechnung: tan α = 450/2250 ⇒ α = 11,3°. Dann am Kreuzkopf: <span class="formula">S = FK / cos α</span> = 143 kN (Schubstangenkraft), <span class="formula">FN = S · sin α</span> = 27,5 kN (Normaldruck auf die Gleitbahn).</p><p>Zusatz Drehmoment: M = S · ln = 143 kN · 0,450 m = 64,25 kNm, weil in dieser Stellung die Kurbel senkrecht zur Schubstange steht (ln = r).</p>`, sketch: () => S.sketchKolben(11.3) },
      { h: 'Moment an der Kurbelwelle (Z10, Bsp. 7 und 8)', html: `<p>FK = 2 kN, Pleuel unter 15°: FP = 2/cos 15° = 2,07 kN, FN = 2·tan 15° = 0,54 kN. Das Moment an der Kurbelwelle: M = FP · ln. Bei r = 100 mm und Kurbel senkrecht zum Pleuel: M = 2,07 kN · 100 mm = 207 kNmm = 207 Nm.</p><p>Bsp. 8 zeigt zwei gleichwertige Wege, wenn die Kurbel nicht senkrecht steht (45° zwischen Pleuel und Kurbel): <b>über den Normalabstand</b> ln = r·cos 45° = 70,7 mm ⇒ M = 2,13·70,7 = 150 Nm, oder <b>über die Umfangskraft</b> FU = FP·cos 45° = 1,50 kN ⇒ M = FU·r = 150 Nm.</p>` },
      { h: 'Kniehebel (Z30, Bsp. 160 und 175)', html: `<p>Kniehebelpresse: Zentrum I liefert die Spreizenkraft S = (F/2)/sin 10° = 4319 N. Zentrum II (am Pressstempel): die Spreize drückt mit S unter 10°, die Führung nimmt FN auf, der Stempel liefert die Presskraft FQ: <span class="formula">FQ = S · cos 10°</span> = 4253 N, FN = F/2 = 750 N. Aus 1500 N Handkraft werden 4253 N Presskraft.</p><p>Merksatz des Kurses: „Lösungsweg mit Zentrum I und II zusammen zeichnen, aber einzeln lösen.“</p>` },
      { h: 'Spannrolle und Kippbühne (Z30, Bsp. 158 und 161)', html: `<p>Spannrolle: Gewicht FG = 1900 N hängt an einem Hebel, der über zwei Riementrume (je 50° zur Senkrechten) gehalten wird: S = (FG/2)/cos 50° = 1478 N.</p><p>Kippbühne: FG = 154 MN wird von zwei Streben getragen, Winkel aus tan α = 1160/4250 ⇒ 15,3°. Senkrecht trägt jede Strebe FG/2 = 77 MN: S = 77/sin 15,3° = 292 MN; die waagrechte Zugkraft in der Spindel FA = S·cos 15,3° = 282 MN.</p>` },
      { h: 'Förderkorb mit Sinussatz (Z30, Bsp. 174)', html: `<p>Zwei Seilkräfte je 72 kN, Winkel zwischen ihnen 45° (also je 22,5° zur Winkelhalbierenden): Resultierende auf die Seilscheibe F = 2·72·cos 22,5° = 133 kN. Diese Resultierende wird dann in Säule (senkrecht) und Strebe (schräg, α aus tan α = 22/32 ⇒ 34,5°) zerlegt, mit dem Sinussatz: F_res/sin 145,5° = F_Säule/sin 12° = F_Strebe/sin 22,5°.</p>` },
      { h: 'Spannvorrichtung mit Keil (Z30)', html: `<p>Ein Keil mit Steigung 30 : 60 (tan α = 0,5 ⇒ α = 26,6°) wird mit F = 1000 N gedrückt. Die Spannkraft senkrecht zur Wand: <span class="formula">FN = F / tan α</span> = 2000 N. Bei drei Rollen teilt sich F auf 333 N je Rolle, FN je Rolle 666 N, gesamt wieder 2000 N.</p>` },
    ],
    formulas: [
      { name: 'Kreuzkopf', f: 'S = FK / cos α ;  FN = S · sin α = FK · tan α', note: 'α = Winkel Schubstange zur Kolbenachse' },
      { name: 'Kurbelmoment', f: 'M = FP · ln = FU · r', note: 'ln = Normalabstand, FU = Umfangskraft' },
      { name: 'Kniehebel', f: 'S = (F/2) / sin α ;  FQ = S · cos α', note: 'kleiner Winkel α ⇒ große Kraft' },
      { name: 'Keil', f: 'FN = F / tan α', note: 'α = Keilwinkel' },
      { name: 'Zwei gleiche Seile, Winkel 2φ', f: 'Fres = 2 · S · cos φ', note: 'φ = halber Winkel zwischen den Seilen' },
    ],
    examples: [
      { title: 'Kurbeltrieb einer Dampfmaschine', source: 'Z30, Beispiel 173', given: 'FK = 140 kN, Schubstange 2250 mm, Kurbel 450 mm, rechter Winkel zwischen Schubstange und Kurbel', wanted: 'a) Normalkraft auf die Gleitbahn, b) Schubstangenkraft, Zusatz: Drehmoment', steps: ['tan α = 450/2250 ⇒ α = 11,3°', 'cos α = FK/S ⇒ S = 140/cos 11,3° = 143 kN', 'sin α = FN/S ⇒ FN = 143·sin 11,3° = 27,5 kN', 'M = S · 0,450 m = 64,25 kNm'], result: 'FN = 27,5 kN, S = 143 kN, M = 64,25 kNm' },
      { title: 'Kniehebel-Nietmaschine', source: 'Z30, Beispiel 175', given: 'Kolben Ø 320 mm, p = 7 bar, Geometrie: tan α1 = 250/360 ⇒ 34,8°, tan α2 = 250/670 ⇒ 20,5°', wanted: 'Kolbenkraft, Zugkraft, Stangenkraft S, Nietdruck N', steps: ['F = p · A = 70 N/cm² · 804 cm² = 56,3 kN', 'Zentrum I mit Sinussatz: Winkel im Kräftedreieck 14,3°, 110,5°, 55,2°', 'S = F·sin 110,5°/sin 14,3° = 213 kN; Zug = F·sin 55,2°/sin 14,3° = 187 kN', 'Zentrum II: FQ (Nietdruck) = S·cos 34,8° = 175 kN, FN = S·sin 34,8° = 122 kN'], result: 'S = 213 kN, Nietdruck ≈ 175 kN' },
    ],
    mistakes: [
      { wrong: 'Beim Kolben FN = FK · sin α rechnen.', right: 'FK ist die Ankathete, FN die Gegenkathete ⇒ FN = FK · tan α. (FN = FP · sin α wäre auch richtig, aber mit FP, nicht FK.)' },
      { wrong: 'Druck in bar direkt mit mm² multiplizieren.', right: '1 bar = 10 N/cm² = 0,1 N/mm². Einheiten vorher angleichen.' },
      { wrong: 'Bei zwei Zentren alles in ein Krafteck zeichnen.', right: 'Jedes Zentrum bekommt sein eigenes Krafteck. Die Verbindungskraft (z. B. S) taucht in beiden auf.' },
    ],
    tips: ['Suche zuerst den Knoten, an dem eine Kraft bekannt ist und nur zwei Unbekannte angreifen. Dort fängst du an.', 'Frage dich bei jedem Bauteil: Kann es nur Druck/Zug entlang seiner Achse übertragen (Stab, Seil, Pleuel) oder auch quer (Führung, Lager)?'],
  },
];
