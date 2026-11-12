// Modul 2: Drehmoment, Hebel und allgemeines Kraftsystem (nach DM10, DM20, T10, T20)
import * as S from './sketches.js';

export const MODULE = { id: 'statik', title: 'Drehmoment, Hebel und Statik', order: 2 };

export const TOPICS = [
  {
    id: 'drehmoment', module: 'statik', order: 7, minutes: 35,
    title: 'Das Drehmoment', short: 'M = F · ln mit dem Normalabstand. Zwei Wege bei schräg angreifender Kraft.',
    keywords: ['drehmoment', 'moment', 'normalabstand', 'hebelarm', 'newtonmeter', 'drehpunkt', 'schraubenschlüssel'],
    prereq: ['zerlegung'], sources: ['DM10 Drehmoment'],
    intro: `Eine Kraft, die nicht durch den Drehpunkt geht, will drehen. Wie stark, sagt das Drehmoment: Kraft mal <b>senkrechter</b> Abstand zur Wirkungslinie. Dieser Abstand heißt im Kurs Normalabstand ln. Mit dem Drehmoment rechnen wir später Hebel, Auflagerkräfte und Biegemomente.`,
    steps: [
      { h: 'Definition', html: `<p><span class="formula">M = F · ln</span> in N·m (oder kNm, Nmm). <b>ln ist der Abstand vom Drehpunkt zur Wirkungslinie</b>, gemessen im rechten Winkel (90°) zur Wirkungslinie. Greift die Kraft senkrecht am Hebel an, ist ln einfach die Hebellänge l.</p><p>Einheiten: 1 Nm = 1000 Nmm = 1000 kNmm/1000 … am sichersten mm vorher in m umwandeln.</p>`, sketch: () => S.sketchDrehmoment(30), lab: 'drehmoment' },
      { h: 'Schräg angreifende Kraft: Weg 1 über ln', html: `<p>DM10: F = 30 kN greift unter 30° zur Senkrechten am Ende eines Hebels l = 600 mm an. Der Normalabstand ist die Ankathete: <span class="formula">ln = l · cos 30°</span> = 520 mm. M = 30 kN · 520 mm = 15 600 kNmm = <b>15,6 kNm</b> (15 600 Nm).</p>` },
      { h: 'Schräg angreifende Kraft: Weg 2 über Komponenten', html: `<p>Kraft zerlegen: Fy = F · cos 30° = 26 kN (senkrecht zum Hebel, dreht), Fx = F · sin 30° = 15 kN (entlang des Hebels, Wirkungslinie geht durch den Drehpunkt, Hebelarm 0, dreht nicht). <span class="formula">M = Fy · l + Fx · 0</span> = 26 · 600 = 15 600 kNmm. Beide Wege liefern dasselbe, das ist die Probe.</p>` },
      { h: 'Drehsinn und Vorzeichen', html: `<p>Der Kurs legt fest: <b>Drehmoment nach rechts (im Uhrzeigersinn) = +</b>, y nach oben = +, x nach rechts = +. Mit dieser Vereinbarung lassen sich Momente addieren. Entscheidend ist nur, dass du eine Vereinbarung triffst und bei einer Aufgabe durchgehend dabei bleibst.</p><p>Hinweis: In manchen Büchern (und in der Zusammenfassung „Tipps &amp; Tricks“) gilt gegen den Uhrzeigersinn positiv. Die Ergebnisse sind gleich, nur die Vorzeichen in der Gleichung drehen sich um.</p>` },
    ],
    formulas: [
      { name: 'Drehmoment', f: 'M = F · ln', note: 'ln senkrecht zur Wirkungslinie' },
      { name: 'Normalabstand (Winkel α zur Senkrechten auf den Hebel)', f: 'ln = l · cos α', note: 'α zur Hebelrichtung: ln = l · sin α' },
      { name: 'Über Komponenten', f: 'M = F⊥ · l', note: 'F⊥ = Anteil senkrecht zum Hebel' },
      { name: 'Einheiten', f: '1 Nm = 1000 Nmm ; 1 kNm = 1000 Nm', note: '' },
    ],
    examples: [
      { title: 'Hebel mit schräg angreifender Kraft', source: 'DM10, Folie 2–3', given: 'F = 30 kN, l = 600 mm, α = 30° (zur Senkrechten auf den Hebel)', wanted: 'Fx, Fy, M', steps: ['Weg über ln: ln = 600 · cos 30° = 520 mm ⇒ M = 30 · 520 = 15 600 kNmm = 15 600 Nm', 'Weg über Zerlegung: Fy = 30 · cos 30° = 26 kN; Fx = 30 · sin 30° = 15 kN', 'M = Fy · l + Fx · 0 = 26 · 600 = 15 600 kNmm'], result: 'M = 15 600 Nm = 15,6 kNm' },
    ],
    mistakes: [
      { wrong: 'Den Hebel l statt des Normalabstands ln verwenden.', right: 'Nur bei senkrechtem Kraftangriff ist ln = l. Sonst ln = l · cos α (oder sin, je nach Winkelangabe).' },
      { wrong: 'mm und m mischen: 30 kN · 520 mm = 15 600 „Nm“.', right: '30 kN · 0,52 m = 15,6 kNm = 15 600 Nm.' },
    ],
    tips: ['Lot vom Drehpunkt auf die Wirkungslinie fällen. Diese Strecke ist ln. Wenn du es nicht zeichnen kannst, zerlege die Kraft.', 'Komponente entlang des Hebels dreht nie (Hebelarm 0). Das spart Rechenarbeit.'],
  },

  {
    id: 'hebel', module: 'statik', order: 8, minutes: 40,
    title: 'Hebelgesetz und Hebelbeispiele', short: 'Kraft × Kraftarm = Last × Lastarm, Übersetzung, Stützkraft, Hydraulikkolben.',
    keywords: ['hebel', 'hebelgesetz', 'übersetzung', 'stützkraft', 'kolben', 'druck', 'bar', 'hebelarm', 'lastarm', 'kraftarm'],
    prereq: ['drehmoment'], sources: ['DM10 Beispiele Hebel 1–4'],
    intro: `Der Hebel ist die einfachste Maschine. Er ist im Gleichgewicht, wenn die Summe aller Drehmomente um den Drehpunkt null ist: ΣM = 0. Daraus folgt das Hebelgesetz. Dazu kommt ΣFy = 0 für die Stützkraft im Drehpunkt.`,
    steps: [
      { h: 'Hebelgesetz', html: `<p><span class="formula">F1 · l1 = F2 · l2</span> oder als Momentengleichung ΣM = 0: F1·l1 − F2·l2 = 0. Die Hebelübersetzung <span class="formula">i = l1 / l2 = F2 / F1</span>. DM10, Hebel 1: i = 2,75 : 1 ⇒ F2 = F1 · 2,75.</p>`, sketch: () => S.sketchHebel(16.5, 275, 45.4, 100), lab: 'hebel' },
      { h: 'Stützkraft im Drehpunkt', html: `<p>Der Drehpunkt muss alles tragen, was nach unten (oder oben) wirkt: <span class="formula">ΣFy = 0</span>. Hebel 1: beide Kräfte F1 und F2 drücken nach oben? Nein: F1 drückt, F2 ist die Gegenkraft der Last. Im Kurs: S = F1 + F2 = 16,5 + 45,4 = 61,9 kN (beide Kräfte greifen auf derselben Seite der Stütze an bzw. wirken gleichsinnig).</p>` },
      { h: 'Kraft aus Druck und Fläche (Hydraulik/Pneumatik)', html: `<p>Hebel 1 beginnt mit einem Zylinder: <span class="formula">A = d² · π / 4</span> = 254 cm², p = 6,5 bar = 65 N/cm² ⇒ <span class="formula">F1 = p · A</span> = 254 · 65 = 16 500 N = 16,5 kN. Einheitentrick: 1 bar = 10 N/cm² = 0,1 N/mm².</p>` },
      { h: 'Hebel mit mehreren und schrägen Kräften (Hebel 2–4)', html: `<p>Vorgehen des Kurses: Schräge Kräfte in x und y zerlegen (Hebel 2: F2x = F2y = 280 · sin 45° = 198 N). Dann drei Gleichungen:</p><ol><li><b>ΣM = 0</b> um das Lager A (dort fallen Ax und Ay heraus): F3·260 − F1·115 − F2x·230 − F2y·230 = 0 ⇒ F3 = 492 N</li><li><b>ΣFy = 0</b>: Ay = F3 − F2y = 294 N</li><li><b>ΣFx = 0</b>: Ax = F1 + F2x = 518 N</li></ol><p>Lagerkraft gesamt A = √(Ax² + Ay²) = 596 N, Richtung αA = arctan(Ax/Ay) = 60,4°.</p><p>Hebel 3 zeigt den Hebelarm einer Komponente, der erst berechnet werden muss: l1x = 100 / tan 30° = 173 mm.</p>` },
    ],
    formulas: [
      { name: 'Hebelgesetz', f: 'F1 · l1 = F2 · l2', note: 'Kraft × Kraftarm = Last × Lastarm' },
      { name: 'Übersetzung', f: 'i = l1 / l2 = F2 / F1', note: '' },
      { name: 'Stützkraft (einseitiger Hebel, gleichsinnig)', f: 'S = F1 + F2', note: 'zweiseitig: S = F1 + F2 ebenfalls, wenn beide nach unten' },
      { name: 'Druckkraft', f: 'F = p · A ;  A = d² · π / 4', note: '1 bar = 10 N/cm² = 0,1 N/mm²' },
      { name: 'Lagerkraft', f: 'A = √(Ax² + Ay²) ;  αA = arctan(Ax / Ay)', note: '' },
    ],
    examples: [
      { title: 'Hebel 1 mit Hydraulikzylinder', source: 'DM10, Beispiel Hebel 1', given: 'd = 18 cm (A = 254 cm²), p = 6,5 bar, Hebelübersetzung i = 2,75 : 1', wanted: 'F1, F2, Stützkraft S', steps: ['p = 6,5 bar = 65 N/cm²', 'F1 = A · p = 254 · 65 = 16 500 N = 16,5 kN', 'F2 = F1 · i = 16,5 · 2,75 = 45,4 kN (aus F1·l1 − F2·l2 = 0)', 'ΣFy = 0 ⇒ S = F1 + F2 = 61,9 kN'], result: 'F2 = 45,4 kN, S = 61,9 kN' },
      { title: 'Hebel 2 mit schräger Kraft', source: 'DM10, Beispiel Hebel 2', given: 'F1 = 320 N, F2 = 280 N unter 45°, Abstände 115 / 230 / 260 mm', wanted: 'F3, Ax, Ay, A, αA', steps: ['F2x = F2y = 280 · sin 45° = 198 N', 'ΣM(A) = 0: F3·260 − F1·115 − F2x·230 − F2y·230 = 0 ⇒ F3 = 492 N', 'ΣFy = 0: Ay = F3 − F2y = 294 N', 'ΣFx = 0: Ax = F1 + F2x = 518 N', 'A = √(518² + 294²) = 596 N; αA = arctan(518/294) = 60,4°'], result: 'F3 = 492 N, A = 596 N' },
    ],
    mistakes: [
      { wrong: 'Beim Hebelgesetz die Arme vertauschen (F1·l2 = F2·l1).', right: 'Jede Kraft wird mit ihrem eigenen Abstand zum Drehpunkt multipliziert.' },
      { wrong: 'Stützkraft als Differenz rechnen, obwohl beide Kräfte in dieselbe Richtung wirken.', right: 'ΣFy = 0 sauber aufstellen mit Vorzeichen: nach oben +, nach unten −. Dann ergibt sich S automatisch.' },
    ],
    tips: ['Wähle den Drehpunkt im Lager: Dann verschwinden Ax und Ay aus der Momentengleichung und du hast nur eine Unbekannte.', 'Schräge Kräfte zuerst zerlegen, dann erst Momente bilden. Jede Komponente bekommt ihren eigenen Hebelarm.'],
  },

  {
    id: 'allgemeines-kraftsystem', module: 'statik', order: 9, minutes: 30,
    title: 'Allgemeines Kraftsystem und Gleichgewichtsbedingungen', short: 'Kräfte, die sich nicht in einem Punkt schneiden: ΣFx = 0, ΣFy = 0, ΣM = 0. Festlager und Loslager.',
    keywords: ['allgemeines kraftsystem', 'dezentral', 'gleichgewichtsbedingungen', 'festlager', 'loslager', 'auflager', 'freikörperbild', 'freischneiden'],
    prereq: ['hebel'], sources: ['T10 Träger auf 2 Stützen', 'DM20'],
    intro: `Im allgemeinen (dezentralen) Kraftsystem schneiden sich die Wirkungslinien <b>nicht</b> in einem Punkt. Dann können Kräfte nicht nur verschieben, sondern auch drehen. Deshalb braucht es drei Bedingungen für Gleichgewicht statt zwei. Mit drei Gleichungen lassen sich drei Unbekannte bestimmen, zum Beispiel die Auflagerkräfte eines Trägers.`,
    steps: [
      { h: 'Die drei Gleichgewichtsbedingungen', html: `<p><span class="formula">ΣFx = 0</span> <span class="formula">ΣFy = 0</span> <span class="formula">ΣM = 0</span></p><p>Vorzeichen im Kurs: x nach rechts +, y nach oben +, Drehmoment nach rechts (Uhrzeigersinn) +. Der Bezugspunkt für ΣM ist frei wählbar; klug ist ein Punkt, an dem eine unbekannte Kraft angreift.</p>` },
      { h: 'Festlager und Loslager', html: `<p><b>Festlager</b> (B): hält den Träger in x und y fest ⇒ zwei unbekannte Kraftkomponenten Bx, By. <b>Loslager</b> (A): kann nur senkrecht zur Lagerfläche drücken ⇒ eine Unbekannte A. Zusammen: drei Unbekannte, drei Gleichungen. Das nennt man statisch bestimmt.</p><p>Bei rein senkrechten Lasten ist Bx = 0, und es bleiben zwei Gleichungen (ΣM und ΣFy) für A und B.</p>`, sketch: () => S.sketchTraeger(1200, [{ x: 700, F: 500, name: 'F1' }], { showReactions: true }) },
      { h: 'Freikörperbild', html: `<p>Lager gedanklich wegnehmen und durch ihre Kräfte ersetzen, alle Lasten eintragen, Abstände bemaßen, Achsen und Drehsinn festlegen. Erst dann rechnen. Das Freikörperbild ist der wichtigste Schritt; fast alle Fehler entstehen davor, nicht beim Rechnen.</p>` },
      { h: 'Reihenfolge, die immer funktioniert', html: `<ol><li>ΣM um ein Lager = 0 ⇒ die Kraft am anderen Lager.</li><li>ΣFy = 0 ⇒ die senkrechte Kraft am ersten Lager.</li><li>ΣFx = 0 ⇒ waagrechte Lagerkraft (nur wenn schräge Lasten vorhanden).</li><li>Probe: ΣM um das andere Lager muss ebenfalls 0 ergeben.</li></ol>` },
    ],
    formulas: [
      { name: 'Gleichgewicht (allgemein)', f: 'ΣFx = 0 ;  ΣFy = 0 ;  ΣM = 0', note: 'drei Gleichungen, drei Unbekannte' },
      { name: 'Loslager', f: 'eine Kraft senkrecht zur Lagerfläche', note: 'z. B. A' },
      { name: 'Festlager', f: 'zwei Komponenten Bx, By', note: 'B = √(Bx² + By²)' },
    ],
    examples: [
      { title: 'Träger mit einer Last', source: 'T10, Nr. 1', given: 'Stützweite 1200 mm, F1 = 500 N im Abstand 700 mm von A (500 mm von B)', wanted: 'A, B', steps: ['Drehpunkt B gewählt, somit entfällt das Moment der Kraft B.', 'ΣM(B) = 0: A·1200 − F1·500 = 0 ⇒ A = 500·500/1200 = 208 N', 'ΣFy = 0: A − F1 + B = 0 ⇒ B = 500 − 208 = 292 N', 'Probe: ΣM(A) = F1·700 − B·1200 = 350 000 − 350 400 ≈ 0 ✓'], result: 'A = 208 N, B = 292 N (die nähere Stütze trägt mehr)' },
    ],
    mistakes: [
      { wrong: 'Loslager mit zwei Komponenten ansetzen.', right: 'Das Loslager hat nur eine Kraft senkrecht zur Lagerfläche. Sonst hast du vier Unbekannte und drei Gleichungen.' },
      { wrong: 'Abstände vom falschen Punkt messen.', right: 'Alle Hebelarme vom gewählten Drehpunkt aus messen, nicht vom Trägeranfang.' },
    ],
    tips: ['Skizze, Achsen, Drehsinn, „geg./ges.“ – erst dann Gleichungen. Jede Minute Skizze spart drei Minuten Fehlersuche.', 'Kontrolle mit Hausverstand: Die Stütze, die näher an der Last ist, trägt mehr.'],
  },

  {
    id: 'traeger', module: 'statik', order: 10, minutes: 45,
    title: 'Träger auf zwei Stützen: Auflagerkräfte', short: 'Mehrere Lasten, Kragarme, negative Auflagerkräfte und schräge Lasten.',
    keywords: ['träger', 'auflagerkräfte', 'auflager', 'stützen', 'kragarm', 'welle', 'lagerkraft', 'negative auflagerkraft'],
    prereq: ['allgemeines-kraftsystem'], sources: ['T10 Träger auf 2 Stützen Nr. 1–7'],
    intro: `Das Standardproblem der Statik: Ein Träger (oder eine Welle) liegt auf zwei Lagern und trägt Lasten. Gesucht sind die Auflagerkräfte. Dieses Thema geht die sieben Beispiele aus T10 durch, vom einfachen Fall bis zur schrägen Last mit waagrechter Lagerkomponente.`,
    steps: [
      { h: 'Mehrere Lasten (T10, Nr. 2)', html: `<p>F1 = 500 N bei 500 mm, F2 = 800 N bei 1400 mm, Stützweite 1800 mm. Drehpunkt A (dann entfällt das Moment von A):</p><p>ΣM(A) = 0: F1·500 + F2·1400 − B·1800 = 0 ⇒ <span class="formula">B = (F1·500 + F2·1400) / 1800</span> = 761 N. ΣFy = 0: A = F1 + F2 − B = 539 N.</p>`, sketch: () => S.sketchTraeger(1800, [{ x: 500, F: 500, name: 'F1' }, { x: 1400, F: 800, name: 'F2' }]), lab: 'traeger' },
      { h: 'Kragarm und negative Auflagerkraft (T10, Nr. 3)', html: `<p>F1 = 600 N bei 400 mm, F2 = 1600 N bei 1400 mm, aber Lager B schon bei 1000 mm (Kragarm 400 mm). ΣM(A) = 0: B = (600·400 + 1600·1400)/1000 = 2480 N. ΣFy = 0: A = 600 + 1600 − 2480 = <b>−280 N</b>.</p><p>Der Kurs erklärt: „−280 N bedeutet, dass die Annahme von A nach oben nicht stimmt und das Auflager A auskippen würde. Die Auflagerkraft wirkt nach unten.“ Der Träger müsste bei A festgehalten werden.</p>`, sketch: () => S.sketchTraeger(1000, [{ x: 400, F: 600, name: 'F1' }, { x: 1400, F: 1600, name: 'F2' }]) },
      { h: 'Welle mit drei Kräften (T10, Nr. 4)', html: `<p>F1 = 600 N (400), F2 = 400 N (800), F3 = 800 N (1600, hinter B bei 1200). ΣM(A) = 0: F1·400 + F2·800 − B·1200 + F3·1600 = 0 ⇒ B = 1533 N. ΣFy = 0: A = F1 + F2 + F3 − B = 267 N. Kräfte hinter dem Lager drehen in dieselbe Richtung wie die davor, also gleiches Vorzeichen im Moment.</p>` },
      { h: 'Schräge und waagrechte Lasten (T10, Nr. 5–7)', html: `<p>Greift eine Kraft waagrecht an (Nr. 5: F2 = 300 N waagrecht, 150 mm über der Trägerachse), erzeugt sie ein Moment mit dem <b>Normalabstand 150 mm</b>: ΣM(A) = F2·150 − By·1100 = 0 ⇒ By = 41 N. ΣFx = 0 ⇒ Bx = F2 = 300 N. ΣFy = 0 ⇒ A = −By = −41 N (zieht nach unten). B = √(300² + 41²) = 303 N, α = arctan(41/300) = 7,8°.</p><p>Nr. 7: Schräge Kraft 300 N unter 45°: F1x = F1y = 212 N. Beide Komponenten mit ihren Hebelarmen in ΣM: F1x·150 + F1y·550 − By·1100 = 0 ⇒ By = 135 N; A = F1y − By = 77 N; Bx = 212 N; B = 251 N, α = 32,5°.</p>` },
    ],
    formulas: [
      { name: 'Lager B aus ΣM(A)', f: 'B = Σ(Fi · ai) / L', note: 'ai = Abstand der Last von A, L = Stützweite' },
      { name: 'Lager A aus ΣFy', f: 'A = ΣFi − B', note: 'senkrechte Lasten' },
      { name: 'Waagrechte Komponente', f: 'Bx = ΣFx (Lasten)', note: 'nur das Festlager' },
      { name: 'Resultierende Lagerkraft', f: 'B = √(Bx² + By²) ;  α = arctan(By / Bx)', note: '' },
    ],
    examples: [
      { title: 'Träger mit zwei Lasten', source: 'T10, Nr. 2', given: 'L = 1800 mm, F1 = 500 N bei 500 mm, F2 = 800 N bei 1400 mm', wanted: 'A, B', steps: ['ΣM(A) = 0: F1·500 + F2·1400 − B·1800 = 0', 'B = (250 000 + 1 120 000) / 1800 = 761 N', 'ΣFy = 0: A = 500 + 800 − 761 = 539 N', 'Probe ΣM(B): A·1800 − F1·1300 − F2·400 = 970 200 − 650 000 − 320 000 ≈ 0 ✓'], result: 'A = 539 N, B = 761 N' },
      { title: 'Kragträger mit negativer Auflagerkraft', source: 'T10, Nr. 3', given: 'Lager A bei 0, B bei 1000 mm; F1 = 600 N bei 400 mm, F2 = 1600 N bei 1400 mm', wanted: 'A, B', steps: ['ΣM(A) = 0: B = (600·400 + 1600·1400) / 1000 = 2480 N', 'ΣFy = 0: A = 600 + 1600 − 2480 = −280 N', 'Deutung: A wirkt nach unten, der Träger will bei A abheben.', 'Gegenprobe mit Drehpunkt B: A·1000 − F1·600 + F2·400 = 0 ⇒ A = (360 000 − 640 000)/1000 = −280 N ✓'], result: 'B = 2480 N, A = −280 N (nach unten)' },
    ],
    mistakes: [
      { wrong: 'Kraft hinter dem Lager (Kragarm) mit falschem Vorzeichen im Moment.', right: 'Entscheidend ist der Drehsinn um den Drehpunkt, nicht die Lage „vor“ oder „hinter“ dem Lager. Pfeil nach unten rechts vom Drehpunkt dreht im Uhrzeigersinn.' },
      { wrong: 'Negatives Ergebnis als Rechenfehler abtun.', right: 'Negativ heißt: Richtung umgekehrt zur Annahme. Ergebnis behalten, Richtung in der Skizze umdrehen.' },
      { wrong: 'Bei waagrechter Last das Moment vergessen, weil sie „nicht nach unten drückt“.', right: 'Jede Kraft, deren Wirkungslinie nicht durch den Drehpunkt geht, erzeugt ein Moment: F · Normalabstand.' },
    ],
    tips: ['Die Summe der Auflagerkräfte muss bei senkrechten Lasten gleich der Summe der Lasten sein. Schnelle Kontrolle!', 'Rechne jede Aufgabe mit beiden Drehpunkten. Stimmen beide, ist das Ergebnis sicher.'],
  },

  {
    id: 'auflager-anwendungen', module: 'statik', order: 11, minutes: 35,
    title: 'Türblatt und Wandkran: Lager mit Eigengewicht', short: 'Senkrechte Lagerung: waagrechte Lagerkräfte aus dem Kippmoment, Eigengewicht berücksichtigen.',
    keywords: ['tür', 'türblatt', 'wandkran', 'kran', 'eigengewicht', 'auskragend', 'kippmoment', 'festlager b', 'loslager a'],
    prereq: ['traeger'], sources: ['DM20 Türblatt Wandkran mit Eigengewicht'],
    intro: `Bei Tür und Wandkran stehen die Lager übereinander. Das Gewicht hängt seitlich und will das Bauteil kippen; die beiden Lager halten mit einem waagrechten Kräftepaar dagegen. Das Festlager unten trägt zusätzlich das gesamte Gewicht.`,
    steps: [
      { h: 'Türblatt (DM20, Tür 1)', html: `<p>FG = 500 N im Abstand 550 mm von den Bändern, Bandabstand 1750 mm. Festlager B unten, Loslager A oben.</p><p>ΣM(B) = 0: Ax·1750 − FG·550 = 0 ⇒ <span class="formula">Ax = FG·550/1750</span> = 157 N. ΣFx = 0 ⇒ Bx = Ax = 157 N. ΣFy = 0 ⇒ By = FG = 500 N. Resultierende B = √(157² + 500²) = 524 N, Winkel α = arctan(Bx/By) = 17,4°.</p>`, sketch: () => S.sketchKran(1750, 550, 500, 'N') },
      { h: 'Wandkran (DM20, Kran 1)', html: `<p>FG = 5 kN am Ausleger 2000 mm, Lagerabstand 1500 mm: Ax = FG·2000/1500 = 6,67 kN, Bx = 6,67 kN, By = 5 kN, B = 8,33 kN, α = arctan(By/Bx) = 36,9°.</p><p>Zusatz: Biegemoment am auskragenden Träger (Einspannung bei 1400 mm): MB = FG · (2000 − 1400) = 5 · 600 = 3000 kNmm = 3 kNm.</p>`, sketch: () => S.sketchKran(1500, 2000, 5, 'kN') },
      { h: 'Mit Eigengewicht (DM20, Kran 2 und 3)', html: `<p>Das Eigengewicht FE des Auslegers greift in seiner Mitte an (Kran 2: FE = 0,7 kN bei 800 mm). Es kommt als weiteres Moment dazu: ΣM(B) = 0: Ax·1500 − FG·2000 − FE·800 = 0 ⇒ <span class="formula">Ax = (FG·2000 + FE·800) / 1500</span> = 7,04 kN. By = FG + FE = 5,7 kN. B = √(7,04² + 5,7²) = 9,06 kN.</p><p>Kran 3: FG = 6 kN bei 3000, FE = 0,9 kN bei 1500, Lagerabstand 1500 ⇒ Ax = (18 000 + 1350)/1500 = 12,9 kN, By = 6,9 kN, B = 14,6 kN, α = 28,1°.</p>`, sketch: () => S.sketchKran(1500, 2000, 5, 'kN', 0.7, 800) },
    ],
    formulas: [
      { name: 'Waagrechte Lagerkraft', f: 'Ax = Bx = (FG · a + FE · aE) / h', note: 'a, aE = Abstände der Gewichte, h = Lagerabstand' },
      { name: 'Senkrechte Lagerkraft', f: 'By = FG + FE', note: 'nur das Festlager trägt senkrecht' },
      { name: 'Resultierende', f: 'B = √(Bx² + By²)', note: 'Winkel je nach Bezugsachse' },
      { name: 'Einspannmoment Ausleger', f: 'M = FG · (a − aEinspannung)', note: 'kNmm → kNm' },
    ],
    examples: [
      { title: 'Wandkran mit Eigengewicht', source: 'DM20, Kran 2', given: 'FG = 5 kN bei 2000 mm, FE = 0,7 kN bei 800 mm, Lagerabstand 1500 mm', wanted: 'Ax, Bx, By, B, α', steps: ['ΣM(B) = 0: Ax·1500 − 5·2000 − 0,7·800 = 0 ⇒ Ax = 10 560/1500 = 7,04 kN', 'ΣFx = 0: Bx = Ax = 7,04 kN', 'ΣFy = 0: By = 5 + 0,7 = 5,7 kN', 'B = √(7,04² + 5,7²) = 9,06 kN; α = arctan(5,7/7,04) = 39°'], result: 'Ax = Bx = 7,04 kN, By = 5,7 kN, B = 9,06 kN' },
    ],
    mistakes: [
      { wrong: 'Das Loslager A mit einer senkrechten Kraft belasten.', right: 'Das obere Band/Lager führt nur seitlich: nur Ax. Das Gewicht trägt allein das Festlager B.' },
      { wrong: 'Eigengewicht am Auslegerende ansetzen.', right: 'Eigengewicht greift im Schwerpunkt an, bei gleichmäßigem Träger in der Mitte.' },
    ],
    tips: ['Je weiter die Lager auseinander (großes h), desto kleiner die waagrechten Lagerkräfte. Deshalb sitzen Türbänder weit oben und unten.', 'Das Kippmoment FG·a muss vom Kräftepaar Ax·h aufgenommen werden. Diese eine Gleichung löst den ganzen Kran.'],
  },

  {
    id: 'biegemoment', module: 'statik', order: 12, minutes: 50,
    title: 'Biegemomenten- und Querkraftverlauf', short: 'Biegemoment an jeder Stelle des Trägers, Maximum beim Nulldurchgang der Querkraft.',
    keywords: ['biegemoment', 'momentenverlauf', 'querkraft', 'querkraftverlauf', 'mb', 'mbmax', 'nulldurchgang', 'biegung'],
    prereq: ['traeger'], sources: ['T20 Träger auf 2 Stützen MB-Verlauf'],
    intro: `Die Auflagerkräfte sagen, was die Lager halten müssen. Das Biegemoment sagt, wie stark der Träger selbst an jeder Stelle beansprucht wird. Dort, wo es am größten ist, bricht der Träger zuerst; danach wird der Querschnitt dimensioniert.`,
    steps: [
      { h: 'Biegemoment an einer Stelle berechnen', html: `<p>Träger gedanklich an der Stelle x durchschneiden und alle Momente der Kräfte <b>links</b> der Stelle um diese Stelle summieren (oder alle rechts). Beide Seiten müssen denselben Wert liefern, das ist die Probe.</p><p>T20, Nr. 2 (A = 539 N, B = 761 N, L = 1800): unter F1 (x = 500): links Mb = A·500 = 539·0,5 = 270 Nm; rechts Mb = B·1300 − F2·900 = 270 Nm ✓. Unter F2 (x = 1400): rechts Mb = B·400 = 305 Nm = Mb max.</p>`, sketch: () => S.sketchMomentenverlauf(1800, [{ x: 0, M: 0 }, { x: 500, M: 270, label: '270 Nm' }, { x: 1400, M: 305, label: '305 Nm' }, { x: 1800, M: 0 }]), lab: 'traeger' },
      { h: 'Querkraftverlauf und Maximum', html: `<p>Die Querkraft Q an einer Stelle ist die Summe aller senkrechten Kräfte links davon. Sie springt an jeder Einzellast. Wo Q durch null geht (Vorzeichenwechsel), ist das Biegemoment maximal: „Nullpunktdurchgang = Stelle von Mb max.“ Bei Einzellasten liegt das Maximum immer unter einer Last oder über einem Lager, nie dazwischen.</p>` },
      { h: 'Symmetrischer Fall (T20, Nr. 1)', html: `<p>Zwei gleiche Lasten 80 kN bei 200 und 1600 mm, L = 1800: A = B = 80 kN. Mb unter F1: −A·200 = −16 000 kNmm; in der Mitte: −A·900 + F1·700 = −16 000 kNmm. Zwischen den Lasten ist das Moment konstant (reine Biegung).</p>` },
      { h: 'Kragarm: Moment über dem Lager (T20, Nr. 3)', html: `<p>Nr. 3 (A = −280 N nach unten, B = 2480 N, F2 = 1600 N auf dem Kragarm 400 mm hinter B): Mb über B von rechts = −F2·0,4 = −640 Nm = Mb max (betragsmäßig). Von links: A·1,0 − F1·0,6 = −280 − 360 = −640 Nm ✓. Das negative Vorzeichen bedeutet hier: Der Träger wird über dem Lager nach oben gebogen (Zug oben).</p>` },
      { h: 'Moment an beliebiger Stelle (T20, Bsp. 6 und 7)', html: `<p>Bsp. 7: F1 = 20 kN bei 200, F2 = 15 kN bei 600 (Kragarm), B bei 400: B = (20·200 + 15·600)/400 = 32,5 kN, A = 2,5 kN. Mb an C (x = 100): A·0,1 = 0,25 kNm. Mb unter F1: A·0,2 = 0,5 kNm. Mb über B: −F2·0,2 = −3 kNm (Maximum). Mb an D (x = 500, von rechts): B·0,1 − F2·0,3 = −1,25 kNm.</p>` },
    ],
    formulas: [
      { name: 'Biegemoment an Stelle x', f: 'Mb(x) = Σ Fi · (x − xi)  (alle Kräfte links von x)', note: 'Auflager mit, Lasten mit ihrem Vorzeichen' },
      { name: 'Querkraft', f: 'Q(x) = Σ Fi  (links von x)', note: 'springt an Einzellasten' },
      { name: 'Einzellast in Feldmitte', f: 'Mb max = F · L / 4', note: 'Sonderfall' },
      { name: 'Einzellast bei a (b = L − a)', f: 'Mb max = F · a · b / L', note: 'unter der Last' },
      { name: 'Kragarm', f: 'Mb(Lager) = −F · lk', note: 'lk = Kragarmlänge' },
    ],
    examples: [
      { title: 'Momentenverlauf mit zwei Lasten', source: 'T20, Nr. 2', given: 'L = 1800 mm, F1 = 500 N bei 500, F2 = 800 N bei 1400; A = 539 N, B = 761 N', wanted: 'Mb unter F1, unter F2, an x = 700', steps: ['Mb(F1) links = A·0,5 = 269,5 Nm ≈ 270 Nm; rechts = B·1,3 − F2·0,9 = 989 − 720 = 270 Nm ✓', 'Mb(F2) rechts = B·0,4 = 304 Nm ≈ 305 Nm = Mb max; links = A·1,4 − F1·0,9 = 755 − 450 = 305 Nm ✓', 'Mb(x = 700) links = A·0,7 − F1·0,2 = 377 − 100 = 277 Nm'], result: 'Mb max = 305 Nm unter F2' },
    ],
    mistakes: [
      { wrong: 'Beim Schnitt Kräfte von beiden Seiten gleichzeitig mitnehmen.', right: 'Entweder nur links oder nur rechts der Schnittstelle. Nie mischen.' },
      { wrong: 'Hebelarm vom Lager statt von der Schnittstelle messen.', right: 'Alle Abstände beziehen sich auf die Schnittstelle x.' },
      { wrong: 'Maximum zwischen zwei Lasten suchen.', right: 'Bei Einzellasten liegt das Maximum unter einer Last oder über einem Lager (Nulldurchgang der Querkraft).' },
    ],
    tips: ['Zeichne den Querkraftverlauf als Treppe: Start mit A, bei jeder Last um F nach unten, bei B nach oben. Am Ende muss 0 herauskommen.', 'Rechne das Moment an jeder Laststelle einmal von links und einmal von rechts. Gleiche Werte = richtige Auflagerkräfte.'],
  },
];
