// Ordner "Erledigt": einmalige Termine, die schon gemacht wurden. Neueste zuerst.
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { eintraegeLaden, eintragFaelligkeit } from '@/db/repo';
import type { EintragMitStatus } from '@/db/typen';
import { heute } from '@/lib/datum';
import { EintragKarte } from '@/components/EintragKarte';
import { farben, groessen } from '@/theme';

export default function Erledigt() {
  const db = useSQLiteContext();
  const [eintraege, setEintraege] = useState<EintragMitStatus[]>([]);
  const [suche, setSuche] = useState('');
  useFocusEffect(useCallback(() => { eintraegeLaden(db).then(setEintraege); }, [db]));

  const liste = useMemo(() => {
    const h = heute();
    const s = suche.trim().toLowerCase();
    return eintraege
      .filter((e) => eintragFaelligkeit(e, h).status === 'erledigt')
      .filter((e) => !s || e.name.toLowerCase().includes(s) || e.kategorie_name.toLowerCase().includes(s) || e.zusatzinfo.toLowerCase().includes(s))
      .sort((a, b) => (b.letzte_durchfuehrung ?? '').localeCompare(a.letzte_durchfuehrung ?? ''));
  }, [eintraege, suche]);

  return (
    <FlatList
      style={{ backgroundColor: farben.hintergrund }}
      contentContainerStyle={s.liste}
      data={liste}
      keyExtractor={(e) => e.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <TextInput value={suche} onChangeText={setSuche} placeholder="🔍 In Erledigt suchen …" placeholderTextColor={farben.grau} style={s.suche} />
        </View>
      }
      renderItem={({ item }) => <EintragKarte eintrag={item} />}
      ListEmptyComponent={<Text style={s.leer}>Noch nichts erledigt.{'\n'}Hier landen einmalige Termine, sobald sie gemacht sind.</Text>}
    />
  );
}

const s = StyleSheet.create({
  liste: { padding: groessen.abstand, paddingBottom: 48 },
  suche: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: groessen.radius, minHeight: 56, paddingHorizontal: 16, fontSize: groessen.schrift, color: farben.text },
  leer: { fontSize: groessen.schrift, color: farben.textLeicht, textAlign: 'center', lineHeight: 28, padding: 32 },
});
