// Kategorien und Unterkategorien anlegen, umbenennen, Farbe wählen, sortieren, löschen.
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { kategorieAnlegen, kategorieFarbeSetzen, kategorieLoeschen, kategorienLaden, kategorieUmbenennen, kategorieVerschieben } from '@/db/repo';
import { GEBIETSFARBEN, textFarbe } from '@/lib/farben';
import { alsBaum, geschwister } from '@/lib/kategorien';
import type { Kategorie } from '@/db/typen';
import { Eingabe } from '@/components/Eingabe';
import { Taste } from '@/components/Taste';
import { farben, groessen, sz } from '@/theme';

export default function Kategorien() {
  const db = useSQLiteContext();
  const [liste, setListe] = useState<Kategorie[]>([]);
  const [neu, setNeu] = useState('');
  const [bearbeite, setBearbeite] = useState<Kategorie | null>(null);
  const [name, setName] = useState('');
  const [unterName, setUnterName] = useState('');

  const laden = useCallback(async () => setListe(await kategorienLaden(db)), [db]);
  useFocusEffect(useCallback(() => { laden(); }, [laden]));

  const anlegen = async () => {
    if (!neu.trim()) return;
    await kategorieAnlegen(db, neu);
    setNeu('');
    laden();
  };

  const unterAnlegen = async (elternId: string) => {
    if (!unterName.trim()) return;
    await kategorieAnlegen(db, unterName, elternId);
    setUnterName('');
    setBearbeite(null);
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
    const unter = liste.filter((x) => x.eltern_id === k.id).length;
    Alert.alert(
      `„${k.name}“ löschen?`,
      (n > 0 ? `Achtung: ${n} Eintr${n === 1 ? 'ag' : 'äge'} mit allen Durchführungen und Fotos werden ebenfalls gelöscht.` : 'Die Kategorie ist leer.')
        + (unter > 0 ? `\n\nDie ${unter} Unterkategorie${unter === 1 ? '' : 'n'} bleiben erhalten und werden zu Hauptkategorien.` : ''),
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => { await kategorieLoeschen(db, k.id); setBearbeite(null); laden(); } },
      ],
    );
  };

  return (
    <View style={s.seite}>
      <FlatList
        data={alsBaum(liste)}
        keyExtractor={(k) => k.id}
        contentContainerStyle={s.liste}
        ListHeaderComponent={
          <View style={s.neu}>
            <Eingabe label="Neue Kategorie" value={neu} onChangeText={setNeu} placeholder="z. B. Elektrik" onSubmitEditing={anlegen} returnKeyType="done" />
            <Taste titel="＋ Hinzufügen" onPress={anlegen} deaktiviert={!neu.trim()} klein />
            <Text style={s.hinweis}>Tippe auf den Namen: umbenennen, Farbe ändern, Unterkategorie anlegen oder löschen. Mit ▲ ▼ änderst du die Reihenfolge.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const gs = geschwister(item.id, liste);
          const pos = gs.findIndex((x) => x.id === item.id);
          const einruecken = item.ebene === 1 ? { marginLeft: 28 } : null;
          return bearbeite?.id === item.id ? (
            <View style={[s.karte, einruecken]}>
              <Eingabe label="Name" value={name} onChangeText={setName} autoFocus onSubmitEditing={speichern} returnKeyType="done" />
              <View style={s.reihe}>
                <Taste titel="Speichern" onPress={speichern} klein style={{ flex: 1 }} deaktiviert={!name.trim()} />
                <Taste titel="Abbrechen" onPress={() => setBearbeite(null)} art="sekundaer" klein style={{ flex: 1 }} />
              </View>
              {item.ebene === 0 ? (
                <>
                  <Text style={s.farbLabel}>Farbe (gilt auch für Unterkategorien)</Text>
                  <View style={s.farben}>
                    {GEBIETSFARBEN.map((f) => (
                      <Pressable key={f} onPress={async () => { await kategorieFarbeSetzen(db, item.id, f); laden(); }}
                        style={[s.farbe, { backgroundColor: f }, item.farbe === f && s.farbeAktiv]}>
                        {item.farbe === f ? <Text style={[s.haken, { color: textFarbe(f) }]}>✓</Text> : null}
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ marginTop: 16 }}>
                    <Eingabe label="＋ Unterkategorie" value={unterName} onChangeText={setUnterName} placeholder={`z. B. unter ${item.name}`} onSubmitEditing={() => unterAnlegen(item.id)} returnKeyType="done" />
                    <Taste titel="Unterkategorie anlegen" onPress={() => unterAnlegen(item.id)} deaktiviert={!unterName.trim()} art="sekundaer" klein />
                  </View>
                </>
              ) : (
                <Text style={s.hinweis}>Unterkategorie – Farbe wie die Hauptkategorie.</Text>
              )}
              <Taste titel="🗑 Kategorie löschen" onPress={() => loeschen(item)} art="gefahr" klein style={{ marginTop: 10 }} />
            </View>
          ) : (
            <View style={[s.karte, s.zeile, einruecken]}>
              {item.ebene === 1 ? <Text style={s.pfeilchen}>↳</Text> : null}
              <View style={[s.punkt, { backgroundColor: item.farbe ?? farben.grau }]} />
              <Pressable onPress={() => { setBearbeite(item); setName(item.name); setUnterName(''); }} style={({ pressed }) => [s.namensFeld, pressed && { opacity: 0.6 }]}>
                <Text style={[s.name, item.ebene === 1 && { fontSize: groessen.schrift }]} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                <Text style={s.anzahl}>{item.anzahl ?? 0} Eintr{item.anzahl === 1 ? 'ag' : 'äge'}</Text>
              </Pressable>
              <Pfeil text="▲" aus={pos <= 0} onPress={async () => { await kategorieVerschieben(db, item.id, -1); laden(); }} />
              <Pfeil text="▼" aus={pos === gs.length - 1} onPress={async () => { await kategorieVerschieben(db, item.id, 1); laden(); }} />
            </View>
          );
        }}
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
  pfeilchen: { fontSize: sz(20), color: farben.textLeicht, marginRight: 6 },
  punkt: { width: 22, height: 22, borderRadius: 11, marginRight: 12 },
  farbLabel: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginTop: 14, marginBottom: 8 },
  farben: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  farbe: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  farbeAktiv: { borderWidth: 4, borderColor: farben.text },
  haken: { color: '#fff', fontSize: sz(24), fontWeight: '900' },
  namensFeld: { flex: 1, minHeight: groessen.tasteHoehe, justifyContent: 'center' },
  pfeil: { width: 56, height: 56, borderRadius: 12, backgroundColor: farben.grauHell, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  pfeilText: { fontSize: sz(24), fontWeight: '800', color: farben.text },
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
