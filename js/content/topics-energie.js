// Modul 3: Ergänzende Grundlagen (Reibung, einfache Maschinen, Arbeit, Leistung, Energie)
// Diese Themen stehen im Lehrplan „Mechanik und technische Grundlagen“, sind in den hochgeladenen Kursfolien
// aber noch nicht enthalten. Sie bauen auf den Kursmethoden auf.
import * as S from './sketches.js';

export const MODULE = { id: 'energie', title: 'Reibung, Arbeit, Leistung und Energie', order: 3 };

export const TOPICS = [
  {
    id: 'reibung', module: 'energie', order: 13, minutes: 40,
    title: 'Reibung und schiefe Ebene', short: 'Haft- und Gleitreibung, Reibungszahl, Kräfte auf der schiefen Ebene.',
    keywords: ['reibung', 'reibungszahl', 'haftreibung', 'gleitreibung', 'normalkraft', 'schiefe ebene', 'hangabtrieb', 'reibungswinkel', 'selbsthemmung'],
    prereq: ['zerlegung'], sources: ['Ergänzung (Lehrplan)'],
    intro: `Reibung bremst Bewegung und hält Dinge fest. Sie hängt nur von der Normalkraft (Anpresskraft) und der Werkstoffpaarung ab, nicht von der Größe der Berührfläche. Auf der schiefen Ebene kommt die Zerlegung der Gewichtskraft dazu – dieselbe Methode wie beim zentralen Kraftsystem.`,
    steps: [
      { h: 'Reibungskraft', html: `<p><span class="formula">FR = μ · FN</span>. μ (my) ist die Reibungszahl, FN die Normalkraft senkrecht zur Berührfläche. Auf waagrechter Fläche ist FN = FG. Haftreibung μ0 (noch keine Bewegung) ist größer als Gleitreibung μ: Anfahren braucht mehr Kraft als Schieben.</p><p>Richtwerte: Stahl/Stahl trocken μ0 ≈ 0,15–0,2, geschmiert ≈ 0,1; Gummi/Asphalt ≈ 0,7; Holz/Holz ≈ 0,3.</p>` },
      { h: 'Schiefe Ebene: Kräfte zerlegen', html: `<p>Die Gewichtskraft G wird parallel und senkrecht zur Ebene zerlegt (Neigungswinkel α):</p><p><span class="formula">FH = G · sin α</span> (Hangabtriebskraft, zieht talwärts) <span class="formula">FN = G · cos α</span> (Normalkraft, drückt auf die Ebene)</p><p>Reibung dagegen: FR = μ · FN = μ · G · cos α.</p>`, sketch: () => S.sketchSchiefeEbene(25), lab: 'schiefe-ebene' },
      { h: 'Rutscht der Körper?', html: `<p>Er bleibt liegen, solange FH ≤ FR, also <span class="formula">tan α ≤ μ0</span>. Der Grenzwinkel heißt Reibungswinkel ρ mit tan ρ = μ0. Das nutzt man zur Messung von μ0: Ebene langsam kippen, bis der Körper rutscht.</p><p>Selbsthemmung (Keil, Schraube, Gewinde): Steigungswinkel kleiner als Reibungswinkel ⇒ hält von selbst.</p>` },
      { h: 'Ziehen oder Schieben auf der Ebene', html: `<p>Kraft F parallel zur Ebene, um den Körper <b>nach oben</b> zu bewegen: <span class="formula">F = FH + FR = G · (sin α + μ · cos α)</span>. Beim Halten <b>gegen Abrutschen</b> hilft die Reibung mit: F = FH − FR. Gleichgewicht entlang der Ebene: ΣF∥ = 0, senkrecht: ΣF⊥ = 0.</p>` },
    ],
    formulas: [
      { name: 'Reibungskraft', f: 'FR = μ · FN', note: 'μ0 Haft-, μ Gleitreibung' },
      { name: 'Hangabtrieb', f: 'FH = G · sin α', note: '' },
      { name: 'Normalkraft (Ebene)', f: 'FN = G · cos α', note: '' },
      { name: 'Reibungswinkel', f: 'tan ρ = μ0', note: 'Grenze des Haftens' },
      { name: 'Hinaufziehen', f: 'F = G · (sin α + μ · cos α)', note: 'parallel zur Ebene' },
    ],
    examples: [
      { title: 'Kiste auf der Rampe', source: 'Übungsbeispiel', given: 'm = 120 kg, α = 20°, μ = 0,25', wanted: 'FH, FN, FR und Zugkraft F nach oben', steps: ['G = 120 · 9,81 = 1177 N', 'FH = 1177 · sin 20° = 403 N', 'FN = 1177 · cos 20° = 1106 N', 'FR = 0,25 · 1106 = 277 N', 'F = FH + FR = 680 N'], result: 'F = 680 N' },
    ],
    mistakes: [
      { wrong: 'FN = G auf der schiefen Ebene.', right: 'Auf der Ebene ist FN = G · cos α, kleiner als G.' },
      { wrong: 'Reibung immer gegen die Zugkraft ansetzen.', right: 'Reibung wirkt gegen die (drohende) Bewegungsrichtung. Beim Halten gegen Abrutschen zeigt sie hangaufwärts.' },
      { wrong: 'sin und cos vertauschen: FH = G · cos α.', right: 'Grenzfall prüfen: α = 0° ⇒ kein Hangabtrieb ⇒ FH muss mit sin gebildet werden.' },
    ],
    tips: ['Zeichne auf der schiefen Ebene ein gedrehtes Koordinatensystem (x entlang der Ebene). Dann ist die Zerlegung dieselbe wie im Kurs.', 'Der Winkel zwischen G und der Normalen ist gleich dem Neigungswinkel α (Winkel mit paarweise senkrechten Schenkeln).'],
  },

  {
    id: 'einfache-maschinen', module: 'energie', order: 14, minutes: 30,
    title: 'Einfache Maschinen: Rolle, Flaschenzug, schiefe Ebene', short: 'Kraft sparen, Weg zulegen: die goldene Regel der Mechanik.',
    keywords: ['flaschenzug', 'rolle', 'feste rolle', 'lose rolle', 'goldene regel', 'schiefe ebene', 'kraftersparnis', 'seilkraft'],
    prereq: ['hebel', 'reibung'], sources: ['Ergänzung (Lehrplan)'],
    intro: `Hebel, Rolle, Flaschenzug, Keil und schiefe Ebene machen eines gemeinsam: Sie tauschen Kraft gegen Weg. Was an Kraft gespart wird, muss an Weg zugelegt werden. Die Arbeit F · s bleibt gleich (ohne Reibung). Das ist die goldene Regel der Mechanik.`,
    steps: [
      { h: 'Feste und lose Rolle', html: `<p>Die <b>feste Rolle</b> lenkt nur um: F = G, Weg gleich. Die <b>lose Rolle</b> hängt an zwei Seilsträngen: jeder trägt G/2 ⇒ F = G/2, dafür doppelter Seilweg.</p>` },
      { h: 'Flaschenzug', html: `<p>Mit n tragenden Seilsträngen an der losen Flasche: <span class="formula">F = G / n</span> und Seilweg <span class="formula">s = n · h</span>. Zählen: nur die Stränge, die die lose Flasche halten. Mit Reibung wird F um den Wirkungsgrad größer: F = G / (n · η).</p>` },
      { h: 'Schiefe Ebene als Maschine', html: `<p>Ohne Reibung: <span class="formula">F · l = G · h</span> ⇒ F = G · h/l = G · sin α. Eine lange flache Rampe braucht wenig Kraft, aber viel Weg.</p>`, sketch: () => S.sketchSchiefeEbene(15) },
      { h: 'Keil und Schraube', html: `<p>Der Keil ist eine bewegte schiefe Ebene (Spannvorrichtung in Z30: FN = F / tan α). Die Schraube ist eine aufgewickelte schiefe Ebene: eine Umdrehung (Weg 2π·r am Schlüssel) hebt um die Steigung P. Ohne Reibung: F · 2π·r = G · P.</p>` },
    ],
    formulas: [
      { name: 'Goldene Regel', f: 'F1 · s1 = F2 · s2', note: 'Arbeit bleibt gleich' },
      { name: 'Lose Rolle', f: 'F = G / 2 ;  s = 2 · h', note: '' },
      { name: 'Flaschenzug', f: 'F = G / n ;  s = n · h', note: 'n = tragende Stränge' },
      { name: 'Schiefe Ebene', f: 'F = G · h / l = G · sin α', note: 'ohne Reibung' },
      { name: 'Mit Wirkungsgrad', f: 'F = G / (n · η)', note: '' },
    ],
    examples: [
      { title: 'Motor mit Flaschenzug heben', source: 'Übungsbeispiel', given: 'm = 240 kg, Flaschenzug mit 4 tragenden Strängen, η = 0,9, Hubhöhe 1,5 m', wanted: 'Zugkraft F und Seilweg s', steps: ['G = 240 · 9,81 = 2354 N', 'F = G / (n · η) = 2354 / (4 · 0,9) = 654 N', 's = n · h = 4 · 1,5 = 6 m'], result: 'F = 654 N, 6 m Seil ziehen' },
    ],
    mistakes: [
      { wrong: 'Alle Rollen zählen statt der tragenden Stränge.', right: 'Nur die Seilstränge zählen, an denen die lose Flasche hängt.' },
      { wrong: 'Glauben, eine Maschine spare Arbeit.', right: 'Sie spart Kraft, nie Arbeit. Mit Reibung braucht sie sogar mehr Arbeit.' },
    ],
    tips: ['Schneide die lose Flasche frei: Nach oben ziehen n Seilkräfte F, nach unten G. ΣFy = 0 ⇒ n·F = G.'],
  },

  {
    id: 'arbeit-leistung', module: 'energie', order: 15, minutes: 35,
    title: 'Arbeit, Leistung und Wirkungsgrad', short: 'W = F · s, P = W / t = F · v, Drehbewegung P = M · ω, Verluste über η.',
    keywords: ['arbeit', 'leistung', 'wirkungsgrad', 'watt', 'joule', 'kilowatt', 'drehzahl', 'winkelgeschwindigkeit', 'umfangsgeschwindigkeit'],
    prereq: ['drehmoment', 'einfache-maschinen'], sources: ['Ergänzung (Lehrplan)'],
    intro: `Arbeit wird verrichtet, wenn eine Kraft einen Körper entlang ihres Weges bewegt. Leistung ist Arbeit pro Zeit. Für Motoren und Antriebe ist die Drehform wichtig: Leistung aus Drehmoment und Drehzahl. Der Wirkungsgrad sagt, wie viel davon nach Reibung übrig bleibt.`,
    steps: [
      { h: 'Mechanische Arbeit', html: `<p><span class="formula">W = F · s</span> in Nm = J (Joule), nur der Kraftanteil in Wegrichtung zählt: W = F · s · cos α. Hubarbeit: W = G · h = m · g · h. Reibungsarbeit: W = FR · s. Federarbeit: W = ½ · c · s².</p>` },
      { h: 'Leistung', html: `<p><span class="formula">P = W / t</span> in W (Watt), 1 kW = 1000 W. Bei gleichmäßiger Bewegung: <span class="formula">P = F · v</span>. Alte Einheit: 1 PS = 0,735 kW.</p>` },
      { h: 'Drehbewegung', html: `<p><span class="formula">P = M · ω</span> mit ω = 2π · n (n in 1/s) ⇒ <span class="formula">P = 2π · n · M</span>. Faustformel mit n in 1/min und M in Nm: P [kW] ≈ M · n / 9550. Umfangsgeschwindigkeit v = π · d · n.</p><p>Beispiel: M = 50 Nm bei n = 1450 1/min ⇒ P = 50 · 1450 / 9550 = 7,6 kW.</p>` },
      { h: 'Wirkungsgrad', html: `<p><span class="formula">η = P_ab / P_zu = W_nutz / W_zu</span>, immer kleiner als 1. Hintereinander geschaltete Maschinen: η_ges = η1 · η2 · η3. Ein Getriebe (η = 0,95) hinter einem Motor (η = 0,9) liefert zusammen 0,855 der elektrischen Leistung.</p>` },
    ],
    formulas: [
      { name: 'Arbeit', f: 'W = F · s · cos α', note: 'J = Nm = Ws' },
      { name: 'Hubarbeit', f: 'W = m · g · h', note: '' },
      { name: 'Leistung', f: 'P = W / t = F · v', note: 'W = J/s' },
      { name: 'Drehleistung', f: 'P = M · ω = 2π · n · M', note: 'n in 1/s' },
      { name: 'Faustformel', f: 'P[kW] = M[Nm] · n[1/min] / 9550', note: '' },
      { name: 'Wirkungsgrad', f: 'η = P_ab / P_zu ;  η_ges = η1 · η2 · …', note: '' },
    ],
    examples: [
      { title: 'Aufzugmotor', source: 'Übungsbeispiel', given: 'Last 800 kg, Hubhöhe 12 m in 20 s, η = 0,8', wanted: 'Hubarbeit, Nutzleistung, Motorleistung', steps: ['W = m·g·h = 800 · 9,81 · 12 = 94 176 J ≈ 94,2 kJ', 'P_nutz = W / t = 94 176 / 20 = 4709 W ≈ 4,7 kW', 'P_zu = P_nutz / η = 4,7 / 0,8 = 5,9 kW'], result: 'Motorleistung ≈ 5,9 kW' },
    ],
    mistakes: [
      { wrong: 'n in 1/min direkt in P = 2π·n·M einsetzen.', right: 'Entweder n durch 60 teilen (1/s) oder die Faustformel mit 9550 verwenden.' },
      { wrong: 'Wirkungsgrad multiplizieren statt dividieren bei gesuchter Zufuhr.', right: 'Zugeführte Leistung ist immer größer: P_zu = P_ab / η.' },
    ],
    tips: ['Einheiten mitschreiben: N · m = J, J / s = W. Wenn die Einheit nicht aufgeht, ist die Formel falsch.'],
  },

  {
    id: 'energie', module: 'energie', order: 16, minutes: 35,
    title: 'Energie und Energieerhaltung', short: 'Lageenergie, Bewegungsenergie, Spannenergie und der Energieerhaltungssatz.',
    keywords: ['energie', 'potentielle energie', 'kinetische energie', 'lageenergie', 'bewegungsenergie', 'energieerhaltung', 'spannenergie', 'feder'],
    prereq: ['arbeit-leistung'], sources: ['Ergänzung (Lehrplan)'],
    intro: `Energie ist gespeicherte Arbeit. Sie kann die Form wechseln (Lage → Bewegung → Wärme), geht aber nie verloren. Mit dem Energieerhaltungssatz lassen sich Geschwindigkeiten und Höhen oft ohne Kräfte berechnen.`,
    steps: [
      { h: 'Energieformen', html: `<p><span class="formula">E_pot = m · g · h</span> (Lageenergie) <span class="formula">E_kin = ½ · m · v²</span> (Bewegungsenergie) <span class="formula">E_Feder = ½ · c · s²</span> (Spannenergie, c = Federrate in N/m). Rotation: E_rot = ½ · J · ω².</p>` },
      { h: 'Energieerhaltung', html: `<p>Ohne Reibung: <span class="formula">E_pot1 + E_kin1 = E_pot2 + E_kin2</span>. Fallender Körper aus Höhe h: m·g·h = ½·m·v² ⇒ <span class="formula">v = √(2 · g · h)</span>, unabhängig von der Masse. Aus 5 m Höhe: v = √(2·9,81·5) = 9,9 m/s.</p>` },
      { h: 'Mit Reibung', html: `<p>Reibungsarbeit wird zu Wärme: E1 = E2 + W_R mit W_R = FR · s. Beim Bremsen: ½·m·v² = FR · s_Brems ⇒ Bremsweg s = v² / (2 · μ · g).</p>` },
      { h: 'Energie und Arbeit verbinden', html: `<p>Arbeitssatz: Die am Körper verrichtete Arbeit ändert seine kinetische Energie: W = ΔE_kin. Damit lassen sich Beschleunigungsvorgänge ohne Zeit lösen, zum Beispiel die Kraft, die ein Fahrzeug auf 100 m von 0 auf 20 m/s bringt.</p>` },
    ],
    formulas: [
      { name: 'Lageenergie', f: 'E_pot = m · g · h', note: 'J' },
      { name: 'Bewegungsenergie', f: 'E_kin = ½ · m · v²', note: 'v in m/s (km/h : 3,6)' },
      { name: 'Spannenergie', f: 'E_F = ½ · c · s²', note: 'c in N/m' },
      { name: 'Energieerhaltung', f: 'E_ges = E_pot + E_kin = konst.', note: 'ohne Reibung' },
      { name: 'Fallgeschwindigkeit', f: 'v = √(2 · g · h)', note: '' },
      { name: 'Bremsweg', f: 's = v² / (2 · μ · g)', note: '' },
    ],
    examples: [
      { title: 'Fallhammer', source: 'Übungsbeispiel', given: 'Bär m = 250 kg fällt 1,8 m', wanted: 'Auftreffgeschwindigkeit und Energie', steps: ['E_pot = 250 · 9,81 · 1,8 = 4415 J', 'v = √(2 · 9,81 · 1,8) = 5,94 m/s', 'Probe: ½ · 250 · 5,94² = 4410 J ✓'], result: 'v ≈ 5,9 m/s, E ≈ 4,4 kJ' },
    ],
    mistakes: [
      { wrong: 'km/h in E_kin einsetzen.', right: 'Immer m/s: 72 km/h = 20 m/s.' },
      { wrong: 'Bei E_kin das Quadrat vergessen oder die ½.', right: 'Doppelte Geschwindigkeit = vierfache Energie. Deshalb wächst der Bremsweg quadratisch.' },
    ],
    tips: ['Wähle das Nullniveau für h dort, wo es die Rechnung am einfachsten macht (meist der tiefste Punkt).'],
  },
];
