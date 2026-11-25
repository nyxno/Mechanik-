// Magazin: Wo liegt was? Suche nach Name, Regal, Fach, Paternoster.
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { magazinLaden } from '@/db/repo';
import type { MagazinTeil } from '@/db/typen';
import { fotoUri } from '@/lib/fotos';
import { Taste } from '@/components/Taste';
import { farben, groessen, sz } from '@/theme';

/** Kurze Ortsangabe, z. B. "Regal 3 · Fach B · Paternoster 2/14". */
export function ortText(m: Pick<MagazinTeil, 'regal' | 'fach' | 'paternoster'>): string {
  return [m.regal && `Regal ${m.regal}`, m.fach && `Fach ${m.fach}`, m.paternoster && `Paternoster ${m.paternoster}`].filter(Boolean).join(' · ');
}

export default function Magazin() {
  const db = useSQLiteContext();
  const [liste, setListe] = useState<MagazinTeil[]>([]);
  const [suche, setSuche] = useState('');
  useFocusEffect(useCallback(() => { magazinLaden(db).then(setListe); }, [db]));

  const treffer = useMemo(() => {
    const t = suche.trim().toLowerCase();
    if (!t) return liste;
    return liste.filter((m) => [m.name, m.regal, m.fach, m.paternoster, m.notiz].some((x) => x.toLowerCase().includes(t)));
  }, [liste, suche]);

  return (
    <View style={{ flex: 1, backgroundColor: farben.hintergrund }}>
      <FlatList
        data={treffer}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.liste}
        ListHeaderComponent={
          <TextInput value={suche} onChangeText={setSuche} placeholder="🔍 Wo ist …? (z. B. Loctite)" placeholderTextColor={farben.grau} style={s.suche} />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/magazin/[id]', params: { id: item.id } })} style={({ pressed }) => [s.zeile, pressed && { opacity: 0.7 }]}>
            {item.erstes_foto ? <Image source={{ uri: fotoUri(item.erstes_foto) }} style={s.bild} contentFit="cover" /> : <View style={[s.bild, s.keinBild]}><Text style={{ fontSize: sz(24) }}>🗄</Text></View>}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.name}>{item.name}</Text>
              {ortText(item) ? <Text style={s.ort}>📍 {ortText(item)}</Text> : <Text style={s.klein}>Kein Lagerort eingetragen</Text>}
              {item.notiz ? <Text style={s.klein} numberOfLines={1}>{item.notiz}</Text> : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={s.leer}>{liste.length === 0 ? 'Noch nichts im Magazin.\nMit der Taste unten eintragen, z. B. „Loctite 243“ – Regal 3, Fach B.' : 'Nichts gefunden.'}</Text>}
      />
      <View style={s.fuss}>
        <Taste titel="＋ Ins Magazin eintragen" onPress={() => router.push({ pathname: '/magazin/[id]', params: { id: 'neu', name: suche.trim() } })} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  liste: { padding: groessen.abstand, paddingBottom: 120, gap: 10 },
  suche: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: groessen.radius, minHeight: 56, paddingHorizontal: 16, fontSize: groessen.schrift, color: farben.text, marginBottom: 6 },
  zeile: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 10 },
  bild: { width: 64, height: 64, borderRadius: 10, backgroundColor: farben.grauHell },
  keinBild: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: groessen.schriftGross, fontWeight: '800', color: farben.text },
  ort: { fontSize: groessen.schrift, fontWeight: '700', color: farben.primaer },
  klein: { fontSize: groessen.schriftKlein, color: farben.textLeicht },
  leer: { fontSize: groessen.schrift, color: farben.textLeicht, textAlign: 'center', lineHeight: 28, padding: 24 },
  fuss: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: groessen.abstand, backgroundColor: farben.hintergrund },
});
