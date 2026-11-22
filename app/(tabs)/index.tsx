// Startseite: alle offenen Einträge nach Fälligkeit sortiert, mit Ampelfarben, Kategorie-Filter und Suche.
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  durchfuehrungAnlegen, durchfuehrungRueckgaengig, eintraegeLaden, eintragFaelligkeit, hinweiseLaden, kategorienLaden, materialLaden,
  prueferLaden, Rueckgaengig, vorschlagLernen,
} from '@/db/repo';
import { erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import type { EintragMitStatus, Kategorie } from '@/db/typen';
import { sortierWert, Status } from '@/lib/faelligkeit';
import { heute, plusMonate } from '@/lib/datum';
import { textFarbe } from '@/lib/farben';
import { mitUnterkategorien } from '@/lib/kategorien';
import { EintragKarte } from '@/components/EintragKarte';
import { RueckgaengigLeiste } from '@/components/RueckgaengigLeiste';
import { Taste } from '@/components/Taste';
import { VorschlagLeiste } from '@/components/Vorschlaege';
import { ZulagenDialog, ZulagenZiel } from '@/components/ZulagenDialog';
import { farben, groessen, sz } from '@/theme';

export default function Uebersicht() {
  const db = useSQLiteContext();
  const [eintraege, setEintraege] = useState<EintragMitStatus[]>([]);
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [filterKategorie, setFilterKategorie] = useState<string | null>(null);
  const [suche, setSuche] = useState('');
  const [sucheFokus, setSucheFokus] = useState(false);
  const [undo, setUndo] = useState<{ r: Rueckgaengig; text: string } | null>(null);
  const [spaeterZeigen, setSpaeterZeigen] = useState(false);
  const [anzahlHinweise, setAnzahlHinweise] = useState(0);
  const [okOffen, setOkOffen] = useState(false);
  const [materialOffen, setMaterialOffen] = useState(0);
  const [zulagenZiel, setZulagenZiel] = useState<ZulagenZiel | null>(null);
  const pruefer = useRef('');
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const laden = useCallback(async () => {
    const [e, k, p] = await Promise.all([eintraegeLaden(db), kategorienLaden(db), prueferLaden(db)]);
    setEintraege(e);
    setKategorien(k);
    pruefer.current = p;
    hinweiseLaden(db).then((x) => setAnzahlHinweise(x.hinweise.length)).catch(() => {});
    materialLaden(db).then((l) => setMaterialOffen(l.filter((m) => !m.besorgt).length)).catch(() => {});
  }, [db]);

  // Jedes Mal neu laden, wenn man auf diese Seite zurückkommt.
  useFocusEffect(useCallback(() => { laden(); erinnerungenNeuPlanen(db); }, [laden, db]));

  const h = heute();
  const alle = useMemo(() => eintraege.map((e) => ({ e, f: eintragFaelligkeit(e, h) })), [eintraege, h]);
  const anzahlErledigt = alle.filter((x) => x.f.status === 'erledigt').length;

  // Unter "Alle" ohne Suche: nur was in den nächsten 3 Monaten fällig wird (+ Überfälliges / noch nie gemacht).
  const grenze = plusMonate(h, 3);
  const nurNaechsteMonate = !filterKategorie && !suche.trim();
  // Filter: Hauptkategorie zeigt auch ihre Unterkategorien
  const filterIds = useMemo(() => (filterKategorie ? mitUnterkategorien(filterKategorie, kategorien) : null), [filterKategorie, kategorien]);
  const hauptKategorien = kategorien.filter((k) => !k.eltern_id || !kategorien.some((x) => x.id === k.eltern_id));
  const gewaehlt = kategorien.find((k) => k.id === filterKategorie);
  const offeneHaupt = gewaehlt ? (gewaehlt.eltern_id && kategorien.some((x) => x.id === gewaehlt.eltern_id) ? kategorien.find((x) => x.id === gewaehlt.eltern_id)! : gewaehlt) : null;
  const unterKategorien = offeneHaupt ? kategorien.filter((k) => k.eltern_id === offeneHaupt.id) : [];
  const { liste, spaeter } = useMemo(() => {
    const s = suche.trim().toLowerCase();
    const passend = alle
      .filter((x) => x.f.status !== 'erledigt')
      .filter((x) => !filterIds || filterIds.has(x.e.kategorie_id))
      .filter(({ e }) => !s || e.name.toLowerCase().includes(s) || e.aufgabe.toLowerCase().includes(s) || e.zusatzinfo.toLowerCase().includes(s) || e.kategorie_name.toLowerCase().includes(s))
      .sort((a, b) => sortierWert(a.f) - sortierWert(b.f) || a.e.name.localeCompare(b.e.name, 'de'));
    if (!nurNaechsteMonate || spaeterZeigen) return { liste: passend, spaeter: 0 };
    const nah = passend.filter((x) => !x.f.naechster || x.f.naechster <= grenze);
    return { liste: nah, spaeter: passend.length - nah.length };
  }, [alle, filterIds, suche, nurNaechsteMonate, spaeterZeigen, grenze]);

  // "In Ordnung" (grün) zusammenklappen – außer bei Suche oder Kategorie-Filter
  type Zeile = { typ: 'eintrag'; e: EintragMitStatus } | { typ: 'ok'; anzahl: number };
  const zeilen: Zeile[] = useMemo(() => {
    if (!nurNaechsteMonate) return liste.map((x) => ({ typ: 'eintrag' as const, e: x.e }));
    const offen = liste.filter((x) => x.f.status !== 'ok');
    const gruen = liste.filter((x) => x.f.status === 'ok');
    return [
      ...offen.map((x) => ({ typ: 'eintrag' as const, e: x.e })),
      ...(gruen.length ? [{ typ: 'ok' as const, anzahl: gruen.length }] : []),
      ...(okOffen ? gruen.map((x) => ({ typ: 'eintrag' as const, e: x.e })) : []),
    ];
  }, [liste, nurNaechsteMonate, okOffen]);

  const zaehler = useMemo(() => {
    const z: Record<Status, number> = { ueberfaellig: 0, nie: 0, bald: 0, ok: 0, erledigt: 0 };
    for (const { e, f } of alle) if (!filterIds || filterIds.has(e.kategorie_id)) z[f.status]++;
    return z;
  }, [alle, filterIds]);

  const schnellErledigt = async (e: EintragMitStatus) => {
    const r = await durchfuehrungAnlegen(db, {
      eintragId: e.id,
      datum: heute(),
      beschreibung: 'Durchgeführt',
      naechsterTermin: e.einmalig ? e.naechster_termin : null,
      ergebnis: 'ok',
      pruefer: pruefer.current || null,
    });
    setUndo({ r, text: `✓ ${e.name} erledigt` });
    await laden();
    erinnerungenNeuPlanen(db);
  };

  const rueckgaengig = async () => {
    if (!undo) return;
    const r = undo.r;
    setUndo(null);
    await durchfuehrungRueckgaengig(db, r);
    await laden();
    erinnerungenNeuPlanen(db);
  };
  const undoAblauf = useCallback(() => setUndo(null), []);

  const sucheLernen = () => { if (suche.trim().length >= 2) vorschlagLernen(db, 'suche', suche); };

  const kopf = (
    <View style={s.kopf}>
      <View style={s.ampel}>
        <Zaehler farbe={farben.rot} zahl={zaehler.ueberfaellig + zaehler.nie} text="überfällig" />
        <Zaehler farbe={farben.gelb} zahl={zaehler.bald} text="bald" />
        <Zaehler farbe={farben.gruen} zahl={zaehler.ok} text="in Ordnung" />
      </View>
      <View style={s.reihe}>
        <Pressable onPress={() => router.push('/zulagen')} style={({ pressed }) => [s.knopf, s.zulagen, pressed && { opacity: 0.7 }]}>
          <Text style={[s.knopfText, { color: '#fff' }]}>⏱ Zulagen</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/material')} style={({ pressed }) => [s.knopf, pressed && { opacity: 0.7 }]}>
          <Text style={s.knopfText}>📦 Material{materialOffen ? ` (${materialOffen})` : ''}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/erledigt')} style={({ pressed }) => [s.knopf, s.erledigt, { flex: 0.7 }, pressed && { opacity: 0.7 }]}>
          <Text style={s.erledigtText}>✅ {anzahlErledigt}</Text>
        </Pressable>
      </View>
      {anzahlHinweise > 0 ? (
        <Pressable onPress={() => router.push('/hinweise')} style={({ pressed }) => [s.hinweis, pressed && { opacity: 0.7 }]}>
          <Text style={s.hinweisText}>💡 {anzahlHinweise === 1 ? '1 Hinweis' : `${anzahlHinweise} Hinweise`} – die App hat Muster erkannt</Text>
        </Pressable>
      ) : null}
      <TextInput
        value={suche}
        onChangeText={setSuche}
        onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setSucheFokus(true); }}
        onBlur={() => { blurTimer.current = setTimeout(() => setSucheFokus(false), 250); }}
        onSubmitEditing={sucheLernen}
        placeholder="🔍 Suchen …"
        placeholderTextColor={farben.grau}
        style={s.suche}
        returnKeyType="search"
      />
      <VorschlagLeiste feld="suche" eingabe={suche} sichtbar={sucheFokus} onWahl={setSuche} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} keyboardShouldPersistTaps="handled">
        <Chip aktiv={!filterKategorie} text="Alle" onPress={() => setFilterKategorie(null)} />
        {hauptKategorien.map((k) => (
          <Chip key={k.id} aktiv={offeneHaupt?.id === k.id} text={`${k.name}${kategorien.some((x) => x.eltern_id === k.id) ? ' ▾' : ''}`} farbe={k.farbe}
            onPress={() => setFilterKategorie(offeneHaupt?.id === k.id ? null : k.id)} />
        ))}
        <Link href="/kategorien" asChild>
          <Pressable style={[s.chip, s.chipKategorien]}><Text style={s.chipText}>⚙ Kategorien</Text></Pressable>
        </Link>
      </ScrollView>
      {offeneHaupt && unterKategorien.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} keyboardShouldPersistTaps="handled">
          <Chip aktiv={filterKategorie === offeneHaupt.id} text={`Alle ${offeneHaupt.name}`} farbe={offeneHaupt.farbe} onPress={() => setFilterKategorie(offeneHaupt.id)} />
          {unterKategorien.map((k) => (
            <Chip key={k.id} aktiv={filterKategorie === k.id} text={`↳ ${k.name}`} farbe={k.farbe} onPress={() => setFilterKategorie(k.id)} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <View style={s.seite}>
      <FlatList
        data={zeilen}
        keyExtractor={(z) => (z.typ === 'ok' ? '__ok' : z.e.id)}
        ListHeaderComponent={kopf}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.liste}
        renderItem={({ item }) => item.typ === 'ok' ? (
          <Pressable onPress={() => setOkOffen((x) => !x)} style={({ pressed }) => [s.okZeile, pressed && { opacity: 0.7 }]}>
            <Text style={s.okText}>✓ {item.anzahl} in Ordnung</Text>
            <Text style={s.okText}>{okOffen ? '▲ zuklappen' : '▼ anzeigen'}</Text>
          </Pressable>
        ) : (
          <EintragKarte eintrag={item.e} onSchnellErledigt={schnellErledigt} onOeffnen={sucheLernen} />
        )}
        ListFooterComponent={
          nurNaechsteMonate && (spaeter > 0 || spaeterZeigen) ? (
            <Taste
              titel={spaeterZeigen ? 'Nur nächste 3 Monate zeigen' : `Später fällig anzeigen (${spaeter})`}
              onPress={() => setSpaeterZeigen((x) => !x)}
              art="sekundaer" klein style={{ marginTop: 4 }}
            />
          ) : undefined
        }
        ListEmptyComponent={
          <View style={s.leer}>
            <Text style={s.leerText}>
              {eintraege.length === 0
                ? 'Noch keine Einträge.\nLege mit der Taste unten deinen ersten Eintrag an, z. B. „Therme Halle 2“.'
                : 'Nichts gefunden.'}
            </Text>
          </View>
        }
      />

      <ZulagenDialog ziel={zulagenZiel} onFertig={() => setZulagenZiel(null)} />
      <RueckgaengigLeiste text={undo?.text ?? null} onRueckgaengig={rueckgaengig} onAblauf={undoAblauf}
        zweite={undo ? { text: '⏱ Zulagen', onPress: () => { setZulagenZiel({ id: undo.r.durchfuehrungId, titel: undo.text.replace(/^✓ /, ''), hitze: 0, staub: 0 }); setUndo(null); } } : undefined} unten={groessen.tasteHoehe + groessen.abstand * 2} />

      <View style={s.fuss}>
        <Taste
          titel="＋ Neuer Eintrag"
          onPress={() => router.push({ pathname: '/eintrag/neu', params: filterKategorie ? { kategorieId: filterKategorie } : {} })}
        />
      </View>
    </View>
  );
}

function Zaehler({ farbe, zahl, text }: { farbe: string; zahl: number; text: string }) {
  return (
    <View style={[s.zaehler, { backgroundColor: farbe }]}>
      <Text style={s.zaehlerZahl}>{zahl}</Text>
      <Text style={s.zaehlerText}>{text}</Text>
    </View>
  );
}

function Chip({ aktiv, text, farbe, onPress }: { aktiv: boolean; text: string; farbe?: string | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, s.chipReihe, farbe ? { borderColor: farbe } : null, aktiv && { backgroundColor: farbe ?? farben.primaer, borderColor: farbe ?? farben.primaer }]}>
      {farbe && !aktiv ? <View style={[s.chipPunkt, { backgroundColor: farbe }]} /> : null}
      <Text style={[s.chipText, aktiv && { color: textFarbe(farbe ?? farben.primaer) }]}>{text}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  seite: { flex: 1, backgroundColor: farben.hintergrund },
  kopf: { paddingTop: groessen.abstand, paddingBottom: 12, gap: 10 },
  kopfTaste: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: farben.grauHell },
  kopfTasteText: { fontSize: sz(16), fontWeight: '700', color: farben.primaer },
  ampel: { flexDirection: 'row', gap: 8 },
  reihe: { flexDirection: 'row', gap: 8 },
  zaehler: { flex: 1, borderRadius: groessen.radius, paddingVertical: 10, alignItems: 'center' },
  zaehlerZahl: { color: '#fff', fontSize: sz(26), fontWeight: '800' },
  zaehlerText: { color: '#fff', fontSize: sz(13), fontWeight: '600' },
  suche: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: groessen.radius, minHeight: 56, paddingHorizontal: 16, fontSize: groessen.schrift, color: farben.text },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: 999, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center' },
  chipReihe: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipPunkt: { width: 12, height: 12, borderRadius: 6 },
  knopf: { flex: 1, minHeight: groessen.tasteHoeheKlein, borderRadius: groessen.radius, borderWidth: 2, borderColor: farben.rahmen, backgroundColor: farben.karte, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  knopfText: { fontSize: groessen.schriftKlein, fontWeight: '800', color: farben.text, textAlign: 'center' },
  zulagen: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
  erledigt: { backgroundColor: farben.gruenHell, borderColor: farben.gruen },
  erledigtText: { fontSize: groessen.schrift, fontWeight: '700', color: farben.gruen },
  okZeile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: farben.gruenHell, borderWidth: 2, borderColor: farben.gruen, borderRadius: groessen.radius, paddingHorizontal: 16, minHeight: groessen.tasteHoehe, marginBottom: 12 },
  okText: { fontSize: groessen.schrift, fontWeight: '800', color: farben.gruen },
  hinweis: { backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#BFDBFE', borderRadius: groessen.radius, paddingHorizontal: 12, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  hinweisText: { fontSize: groessen.schrift, fontWeight: '700', color: farben.primaer },
  chipKategorien: { borderStyle: 'dashed' },
  chipText: { fontSize: groessen.schriftKlein, fontWeight: '600', color: farben.text },
  liste: { paddingHorizontal: groessen.abstand, paddingBottom: 140 },
  leer: { padding: 32, alignItems: 'center' },
  leerText: { fontSize: groessen.schrift, color: farben.textLeicht, textAlign: 'center', lineHeight: 28 },
  fuss: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: groessen.abstand, backgroundColor: farben.hintergrund },
});
