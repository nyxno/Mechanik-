// Materialliste: was zu besorgen ist (oben) und was schon besorgt wurde (eingeklappt).
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { materialBesorgt, materialLaden } from '@/db/repo';
import type { Material } from '@/db/typen';
import { MaterialZeile } from '@/components/MaterialZeile';
import { Taste } from '@/components/Taste';
import { farben, groessen } from '@/theme';

export default function MaterialListe() {
  const db = useSQLiteContext();
  const [liste, setListe] = useState<Material[]>([]);
  const [suche, setSuche] = useState('');
  const [besorgteZeigen, setBesorgteZeigen] = useState(false);
  const laden = useCallback(() => { materialLaden(db).then(setListe); }, [db]);
  useFocusEffect(laden);

  const abhaken = async (m: Material) => { await materialBesorgt(db, m.id, !m.besorgt); laden(); };

  const { offen, besorgt } = useMemo(() => {
    const t = suche.trim().toLowerCase();
    const passt = (m: Material) => !t || m.name.toLowerCase().includes(t) || m.notiz.toLowerCase().includes(t) || (m.eintrag_name ?? '').toLowerCase().includes(t);
    const l = liste.filter(passt);
    return { offen: l.filter((m) => !m.besorgt), besorgt: l.filter((m) => m.besorgt) };
  }, [liste, suche]);

  const daten = [...offen, ...(besorgteZeigen ? besorgt : [])];

  return (
    <View style={{ flex: 1, backgroundColor: farben.hintergrund }}>
      <FlatList
        data={daten}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.liste}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 12 }}>
            <TextInput value={suche} onChangeText={setSuche} placeholder="🔍 Material suchen …" placeholderTextColor={farben.grau} style={s.suche} />
            <Text style={s.titel}>Zu besorgen ({offen.length})</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <>
            {index === offen.length && besorgteZeigen ? <Text style={[s.titel, { marginTop: 8, marginBottom: 10 }]}>✓ Besorgt ({besorgt.length})</Text> : null}
            <MaterialZeile m={item} onAbhaken={abhaken} />
          </>
        )}
        ListEmptyComponent={<Text style={s.leer}>{liste.length === 0 ? 'Noch kein Material.\nMit der Taste unten anlegen – gern mit Foto.' : 'Nichts offen. 👍'}</Text>}
        ListFooterComponent={besorgt.length > 0 ? (
          <Pressable onPress={() => setBesorgteZeigen((x) => !x)} style={({ pressed }) => [s.aufklapp, pressed && { opacity: 0.7 }]}>
            <Text style={s.aufklappText}>{besorgteZeigen ? '▲ Besorgte ausblenden' : `▼ Besorgte anzeigen (${besorgt.length})`}</Text>
          </Pressable>
        ) : undefined}
      />
      <View style={s.fuss}>
        <Taste titel="＋ Material hinzufügen" onPress={() => router.push({ pathname: '/material/[id]', params: { id: 'neu' } })} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  liste: { padding: groessen.abstand, paddingBottom: 120 },
  suche: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: groessen.radius, minHeight: 56, paddingHorizontal: 16, fontSize: groessen.schrift, color: farben.text },
  titel: { fontSize: groessen.schrift, fontWeight: '800', color: farben.text },
  leer: { fontSize: groessen.schrift, color: farben.textLeicht, textAlign: 'center', lineHeight: 28, padding: 24 },
  aufklapp: { minHeight: 52, borderRadius: 12, backgroundColor: farben.grauHell, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  aufklappText: { fontSize: groessen.schriftKlein, fontWeight: '800', color: farben.text },
  fuss: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: groessen.abstand, backgroundColor: farben.hintergrund },
});
