// Kategorien anlegen, umbenennen, löschen.
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { kategorieAnlegen, kategorieLoeschen, kategorienLaden, kategorieUmbenennen } from '@/db/repo';
import type { Kategorie } from '@/db/typen';
import { Eingabe } from '@/components/Eingabe';
import { Taste } from '@/components/Taste';
import { farben, groessen } from '@/theme';

export default function Kategorien() {
  const db = useSQLiteContext();
  const [liste, setListe] = useState<Kategorie[]>([]);
  const [neu, setNeu] = useState('');
  const [bearbeite, setBearbeite] = useState<Kategorie | null>(null);
  const [name, setName] = useState('');

  const laden = useCallback(async () => setListe(await kategorienLaden(db)), [db]);
  useFocusEffect(useCallback(() => { laden(); }, [laden]));

  const anlegen = async () => {
    if (!neu.trim()) return;
    await kategorieAnlegen(db, neu);
    setNeu('');
    laden();
  };

  const speichern = async () => {
    if (!bearbeite || !name.trim()) return;
    await kategorieUmbenennen(db, bearbeite.id, name);
    setBearbeite(null);
    laden();
  };

  const loeschen = (k: Kategorie) => {
    const n = k.anzahl ?? 0;
    Alert.alert(
      `„${k.name}“ löschen?`,
      n > 0 ? `Achtung: ${n} Eintr${n === 1 ? 'ag' : 'äge'} mit allen Durchführungen und Fotos werden ebenfalls gelöscht.` : 'Die Kategorie ist leer.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => { await kategorieLoeschen(db, k.id); setBearbeite(null); laden(); } },
      ],
    );
  };

  return (
    <View style={s.seite}>
      <FlatList
        data={liste}
        keyExtractor={(k) => k.id}
        contentContainerStyle={s.liste}
        ListHeaderComponent={
          <View style={s.neu}>
            <Eingabe label="Neue Kategorie" value={neu} onChangeText={setNeu} placeholder="z. B. Elektrik" onSubmitEditing={anlegen} returnKeyType="done" />
            <Taste titel="＋ Hinzufügen" onPress={anlegen} deaktiviert={!neu.trim()} klein />
            <Text style={s.hinweis}>Tippe auf eine Kategorie, um sie umzubenennen oder zu löschen.</Text>
          </View>
        }
        renderItem={({ item }) =>
          bearbeite?.id === item.id ? (
            <View style={s.karte}>
              <Eingabe label="Name" value={name} onChangeText={setName} autoFocus onSubmitEditing={speichern} returnKeyType="done" />
              <View style={s.reihe}>
                <Taste titel="Speichern" onPress={speichern} klein style={{ flex: 1 }} deaktiviert={!name.trim()} />
                <Taste titel="Abbrechen" onPress={() => setBearbeite(null)} art="sekundaer" klein style={{ flex: 1 }} />
              </View>
              <Taste titel="🗑 Kategorie löschen" onPress={() => loeschen(item)} art="gefahr" klein style={{ marginTop: 10 }} />
            </View>
          ) : (
            <Pressable onPress={() => { setBearbeite(item); setName(item.name); }} style={({ pressed }) => [s.karte, s.zeile, pressed && { opacity: 0.7 }]}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.anzahl}>{item.anzahl ?? 0} Eintr{item.anzahl === 1 ? 'ag' : 'äge'}</Text>
            </Pressable>
          )
        }
        ListEmptyComponent={<Text style={s.hinweis}>Noch keine Kategorien.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  seite: { flex: 1, backgroundColor: farben.hintergrund },
  liste: { padding: groessen.abstand, paddingBottom: 40 },
  neu: { marginBottom: 20 },
  hinweis: { color: farben.textLeicht, fontSize: groessen.schriftKlein, marginTop: 12 },
  karte: { backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 16, marginBottom: 10 },
  zeile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: groessen.tasteHoehe },
  name: { fontSize: groessen.schriftGross, fontWeight: '700', color: farben.text, flex: 1 },
  anzahl: { fontSize: groessen.schriftKlein, color: farben.textLeicht },
  reihe: { flexDirection: 'row', gap: 10 },
});
