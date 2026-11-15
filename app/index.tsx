// Startseite: alle Einträge nach Fälligkeit sortiert, mit Ampelfarben, Kategorie-Filter und Suche.
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { eintraegeLaden, eintragIntervall, kategorienLaden } from '@/db/repo';
import type { EintragMitStatus, Kategorie } from '@/db/typen';
import { berechneFaelligkeit, sortierWert, Status } from '@/lib/faelligkeit';
import { heute } from '@/lib/datum';
import { EintragKarte } from '@/components/EintragKarte';
import { Taste } from '@/components/Taste';
import { farben, groessen } from '@/theme';

export default function Uebersicht() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [eintraege, setEintraege] = useState<EintragMitStatus[]>([]);
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [filterKategorie, setFilterKategorie] = useState<string | null>(null);
  const [suche, setSuche] = useState('');

  const laden = useCallback(async () => {
    const [e, k] = await Promise.all([eintraegeLaden(db), kategorienLaden(db)]);
    setEintraege(e);
    setKategorien(k);
  }, [db]);

  // Jedes Mal neu laden, wenn man auf diese Seite zurückkommt.
  useFocusEffect(useCallback(() => { laden(); }, [laden]));

  const h = heute();
  const liste = useMemo(() => {
    const s = suche.trim().toLowerCase();
    return eintraege
      .filter((e) => !filterKategorie || e.kategorie_id === filterKategorie)
      .filter((e) => !s || e.name.toLowerCase().includes(s) || e.aufgabe.toLowerCase().includes(s) || e.zusatzinfo.toLowerCase().includes(s) || e.kategorie_name.toLowerCase().includes(s))
      .map((e) => ({ e, f: berechneFaelligkeit(e.letzte_durchfuehrung, eintragIntervall(e), h) }))
      .sort((a, b) => sortierWert(a.f) - sortierWert(b.f) || a.e.name.localeCompare(b.e.name, 'de'));
  }, [eintraege, filterKategorie, suche, h]);

  const zaehler = useMemo(() => {
    const z: Record<Status, number> = { ueberfaellig: 0, nie: 0, bald: 0, ok: 0 };
    for (const { f } of liste) z[f.status]++;
    return z;
  }, [liste]);

  return (
    <View style={s.seite}>
      <View style={s.kopf}>
        <View style={s.ampel}>
          <Zaehler farbe={farben.rot} zahl={zaehler.ueberfaellig + zaehler.nie} text="überfällig" />
          <Zaehler farbe={farben.gelb} zahl={zaehler.bald} text="bald" />
          <Zaehler farbe={farben.gruen} zahl={zaehler.ok} text="in Ordnung" />
        </View>
        <TextInput
          value={suche}
          onChangeText={setSuche}
          placeholder="🔍 Suchen …"
          placeholderTextColor={farben.grau}
          style={s.suche}
          clearButtonMode="while-editing"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <Chip aktiv={!filterKategorie} text="Alle" onPress={() => setFilterKategorie(null)} />
          {kategorien.map((k) => (
            <Chip key={k.id} aktiv={filterKategorie === k.id} text={`${k.name} (${k.anzahl ?? 0})`} onPress={() => setFilterKategorie(filterKategorie === k.id ? null : k.id)} />
          ))}
          <Link href="/kategorien" asChild>
            <Pressable style={[s.chip, s.chipKategorien]}><Text style={s.chipText}>⚙ Kategorien</Text></Pressable>
          </Link>
        </ScrollView>
      </View>

      <FlatList
        data={liste}
        keyExtractor={(x) => x.e.id}
        contentContainerStyle={s.liste}
        renderItem={({ item }) => <EintragKarte eintrag={item.e} />}
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
  kopf: { padding: groessen.abstand, paddingBottom: 8, gap: 10 },
  ampel: { flexDirection: 'row', gap: 8 },
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
