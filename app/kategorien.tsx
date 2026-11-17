// Kategorien anlegen, umbenennen, löschen.
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { kategorieAnlegen, kategorieFarbeSetzen, kategorieLoeschen, kategorienLaden, kategorieUmbenennen, kategorieVerschieben } from '@/db/repo';
import { GEBIETSFARBEN } from '@/lib/farben';
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
            <Text style={s.hinweis}>Tippe auf den Namen, um Name oder Farbe zu ändern oder zu löschen. Mit ▲ ▼ änderst du die Reihenfolge.</Text>
          </View>
        }
        renderItem={({ item, index }) =>
          bearbeite?.id === item.id ? (
            <View style={s.karte}>
              <Eingabe label="Name" value={name} onChangeText={setName} autoFocus onSubmitEditing={speichern} returnKeyType="done" />
              <View style={s.reihe}>
                <Taste titel="Speichern" onPress={speichern} klein style={{ flex: 1 }} deaktiviert={!name.trim()} />
                <Taste titel="Abbrechen" onPress={() => setBearbeite(null)} art="sekundaer" klein style={{ flex: 1 }} />
              </View>
 <Text style={s.farbLabel}>Farbe</Text>
              <View style={s.farben}>
                {GEBIETSFARBEN.map((f) => (
                  <Pressable key={f} onPress={async () => { await kategorieFarbeSetzen(db, item.id, f); laden(); }}
                    style={[s.farbe, { backgroundColor: f }, item.farbe === f && s.farbeAktiv]}>
                    {item.farbe === f ? <Text style={s.haken}>✓</Text> : null}
                  </Pressable>
                ))}
              </View>
              <Taste titel="🗑 Kategorie löschen" onPress={() => loeschen(item)} art="gefahr" klein style={{ marginTop: 10 }} />
            </View>
          ) : (
            <View style={[s.karte, s.zeile]}>
              <View style={[s.punkt, { backgroundColor: item.farbe ?? farben.grau }]} />
              <Pressable onPress={() => { setBearbeite(item); setName(item.name); }} style={({ pressed }) => [s.namensFeld, pressed && { opacity: 0.6 }]}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.anzahl}>{item.anzahl ?? 0} Eintr{item.anzahl === 1 ? 'ag' : 'äge'}</Text>
              </Pressable>
              <Pfeil text="▲" aus={index === 0} onPress={async () => { await kategorieVerschieben(db, item.id, -1); laden(); }} />
              <Pfeil text="▼" aus={index === liste.length - 1} onPress={async () => { await kategorieVerschieben(db, item.id, 1); laden(); }} />
            </View>
          )
        }
        ListEmptyComponent={<Text style={s.hinweis}>Noch keine Kategorien.</Text>}
      />
    </View>
  );
}

function Pfeil({ text, aus, onPress }: { text: string; aus: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={aus} hitSlop={4}
      style={({ pressed }) => [s.pfeil, aus && { opacity: 0.25 }, pressed && { backgroundColor: farben.rahmen }]}>
      <Text style={s.pfeilText}>{text}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  punkt: { width: 22, height: 22, borderRadius: 11, marginRight: 12 },
  farbLabel: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginTop: 14, marginBottom: 8 },
  farben: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  farbe: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  farbeAktiv: { borderWidth: 4, borderColor: farben.text },
  haken: { color: '#fff', fontSize: 24, fontWeight: '900' },
  namensFeld: { flex: 1, minHeight: groessen.tasteHoehe, justifyContent: 'center' },
  pfeil: { width: 56, height: 56, borderRadius: 12, backgroundColor: farben.grauHell, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  pfeilText: { fontSize: 24, fontWeight: '800', color: farben.text },
  seite: { flex: 1, backgroundColor: farben.hintergrund },
  liste: { padding: groessen.abstand, paddingBottom: 40 },
  neu: { marginBottom: 20 },
  hinweis: { color: farben.textLeicht, fontSize: groessen.schriftKlein, marginTop: 12 },
  karte: { backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 16, marginBottom: 10 },
  zeile: { flexDirection: 'row', alignItems: 'center', minHeight: groessen.tasteHoehe, paddingVertical: 8 },
  name: { fontSize: groessen.schriftGross, fontWeight: '700', color: farben.text },
  anzahl: { fontSize: groessen.schriftKlein, color: farben.textLeicht },
  reihe: { flexDirection: 'row', gap: 10 },
});
