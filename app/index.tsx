// Startseite: alle offenen Einträge nach Fälligkeit sortiert, mit Ampelfarben, Kategorie-Filter und Suche.
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  durchfuehrungAnlegen, durchfuehrungRueckgaengig, eintraegeLaden, eintragFaelligkeit, kategorienLaden,
  prueferLaden, Rueckgaengig, vorschlagLernen,
} from '@/db/repo';
import { erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import type { EintragMitStatus, Kategorie } from '@/db/typen';
import { sortierWert, Status } from '@/lib/faelligkeit';
import { heute } from '@/lib/datum';
import { EintragKarte } from '@/components/EintragKarte';
import { RueckgaengigLeiste } from '@/components/RueckgaengigLeiste';
import { Taste } from '@/components/Taste';
import { VorschlagLeiste } from '@/components/Vorschlaege';
import { farben, groessen } from '@/theme';

export default function Uebersicht() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [eintraege, setEintraege] = useState<EintragMitStatus[]>([]);
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [filterKategorie, setFilterKategorie] = useState<string | null>(null);
  const [suche, setSuche] = useState('');
  const [sucheFokus, setSucheFokus] = useState(false);
  const [undo, setUndo] = useState<{ r: Rueckgaengig; text: string } | null>(null);
  const pruefer = useRef('');
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const laden = useCallback(async () => {
    const [e, k, p] = await Promise.all([eintraegeLaden(db), kategorienLaden(db), prueferLaden(db)]);
    setEintraege(e);
    setKategorien(k);
    pruefer.current = p;
  }, [db]);

  // Jedes Mal neu laden, wenn man auf diese Seite zurückkommt.
  useFocusEffect(useCallback(() => { laden(); erinnerungenNeuPlanen(db); }, [laden, db]));

  const h = heute();
  const alle = useMemo(() => eintraege.map((e) => ({ e, f: eintragFaelligkeit(e, h) })), [eintraege, h]);
  const anzahlErledigt = alle.filter((x) => x.f.status === 'erledigt').length;

  const liste = useMemo(() => {
    const s = suche.trim().toLowerCase();
    return alle
      .filter((x) => x.f.status !== 'erledigt')
      .filter((x) => !filterKategorie || x.e.kategorie_id === filterKategorie)
      .filter(({ e }) => !s || e.name.toLowerCase().includes(s) || e.aufgabe.toLowerCase().includes(s) || e.zusatzinfo.toLowerCase().includes(s) || e.kategorie_name.toLowerCase().includes(s))
      .sort((a, b) => sortierWert(a.f) - sortierWert(b.f) || a.e.name.localeCompare(b.e.name, 'de'));
  }, [alle, filterKategorie, suche]);

  const zaehler = useMemo(() => {
    const z: Record<Status, number> = { ueberfaellig: 0, nie: 0, bald: 0, ok: 0, erledigt: 0 };
    for (const { f } of liste) z[f.status]++;
    return z;
  }, [liste]);

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
        <Taste titel="📅 Diese & nächste Woche" onPress={() => router.push('/woche')} art="sekundaer" klein style={{ flex: 3 }} />
        <Taste titel={`✅ Erledigt (${anzahlErledigt})`} onPress={() => router.push('/erledigt')} art="sekundaer" klein style={{ flex: 2 }} />
      </View>
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
        {kategorien.map((k) => (
          <Chip key={k.id} aktiv={filterKategorie === k.id} text={k.name} onPress={() => setFilterKategorie(filterKategorie === k.id ? null : k.id)} />
        ))}
        <Link href="/kategorien" asChild>
          <Pressable style={[s.chip, s.chipKategorien]}><Text style={s.chipText}>⚙ Kategorien</Text></Pressable>
        </Link>
      </ScrollView>
    </View>
  );

  return (
    <View style={s.seite}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/einstellungen')} hitSlop={10} style={({ pressed }) => [s.kopfTaste, pressed && { opacity: 0.6 }]}>
              <Text style={s.kopfTasteText}>⚙ Einstellungen</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={liste}
        keyExtractor={(x) => x.e.id}
        ListHeaderComponent={kopf}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.liste}
        renderItem={({ item }) => <EintragKarte eintrag={item.e} onSchnellErledigt={schnellErledigt} onOeffnen={sucheLernen} />}
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

      <RueckgaengigLeiste text={undo?.text ?? null} onRueckgaengig={rueckgaengig} onAblauf={undoAblauf} unten={groessen.tasteHoehe + groessen.abstand * 2 + insets.bottom} />

      <View style={[s.fuss, { paddingBottom: groessen.abstand + insets.bottom }]}>
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

function Chip({ aktiv, text, onPress }: { aktiv: boolean; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, aktiv && s.chipAktiv]}>
      <Text style={[s.chipText, aktiv && { color: '#fff' }]}>{text}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  seite: { flex: 1, backgroundColor: farben.hintergrund },
  kopf: { paddingTop: groessen.abstand, paddingBottom: 12, gap: 10 },
  kopfTaste: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: farben.grauHell },
  kopfTasteText: { fontSize: 16, fontWeight: '700', color: farben.primaer },
  ampel: { flexDirection: 'row', gap: 8 },
  reihe: { flexDirection: 'row', gap: 8 },
  zaehler: { flex: 1, borderRadius: groessen.radius, paddingVertical: 10, alignItems: 'center' },
  zaehlerZahl: { color: '#fff', fontSize: 26, fontWeight: '800' },
  zaehlerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  suche: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: groessen.radius, minHeight: 56, paddingHorizontal: 16, fontSize: groessen.schrift, color: farben.text },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: 999, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center' },
  chipAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  chipKategorien: { borderStyle: 'dashed' },
  chipText: { fontSize: groessen.schriftKlein, fontWeight: '600', color: farben.text },
  liste: { paddingHorizontal: groessen.abstand, paddingBottom: 140 },
  leer: { padding: 32, alignItems: 'center' },
  leerText: { fontSize: groessen.schrift, color: farben.textLeicht, textAlign: 'center', lineHeight: 28 },
  fuss: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: groessen.abstand, backgroundColor: farben.hintergrund },
});
