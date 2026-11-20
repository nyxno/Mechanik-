// Material anlegen oder bearbeiten: Name, Menge, Einheit, Notiz, Gerät, Fotos.
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { eintraegeLaden, fotoLoeschen, fotoSpeichern, fotosZuMaterial, materialEinzeln, materialLoeschen, materialSpeichern } from '@/db/repo';
import type { EintragMitStatus, Foto } from '@/db/typen';
import { fotoDateiLoeschen, fotosAusGalerie, fotosMitKamera } from '@/lib/fotos';
import { Bildschirm } from '@/components/Bildschirm';
import { Eingabe } from '@/components/Eingabe';
import { FotoAnsicht } from '@/components/FotoAnsicht';
import { FotoLeiste } from '@/components/FotoLeiste';
import { Taste } from '@/components/Taste';
import { VorschlagEingabe } from '@/components/Vorschlaege';
import { farben, groessen, sz } from '@/theme';

const EINHEITEN = ['Stk', 'm', 'kg', 'l', 'Pkg', 'Rolle', 'Satz'];

export default function MaterialBearbeiten() {
  const db = useSQLiteContext();
  const { id, eintragId } = useLocalSearchParams<{ id: string; eintragId?: string }>();
  const neu = id === 'neu';
  const [geladen, setGeladen] = useState(neu);
  const [name, setName] = useState('');
  const [menge, setMenge] = useState<number | null>(1);
  const [einheit, setEinheit] = useState('Stk');
  const [notiz, setNotiz] = useState('');
  const [geraet, setGeraet] = useState<string | null>(eintragId ?? null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [neueFotos, setNeueFotos] = useState<string[]>([]);
  const [eintraege, setEintraege] = useState<EintragMitStatus[]>([]);
  const [geraetSuche, setGeraetSuche] = useState<string | null>(null);
  const [ansicht, setAnsicht] = useState<string | null>(null);

  useEffect(() => {
    eintraegeLaden(db).then(setEintraege);
    if (!neu) {
      materialEinzeln(db, id).then((m) => {
        if (m) { setName(m.name); setMenge(m.menge); setEinheit(m.einheit); setNotiz(m.notiz); setGeraet(m.eintrag_id); }
        setGeladen(true);
      });
      fotosZuMaterial(db, id).then(setFotos);
    }
  }, [db, id, neu]);
  if (!geladen) return null;

  const speichern = async () => {
    if (!name.trim()) return Alert.alert('Name fehlt', 'Bitte eingeben, welches Material, z. B. „Dichtung 1/2 Zoll“.');
    const mid = await materialSpeichern(db, neu ? null : id, { name, menge, einheit, notiz, eintrag_id: geraet });
    for (const f of neueFotos) await fotoSpeichern(db, { materialId: mid }, f);
    router.back();
  };

  const fotoHinzu = async (fn: () => Promise<string[]>) => {
    const d = await fn();
    if (d.length) setNeueFotos((f) => [...f, ...d]);
  };

  const geraetName = eintraege.find((e) => e.id === geraet)?.name;
  const treffer = geraetSuche === null ? [] : eintraege
    .filter((e) => !geraetSuche.trim() || e.name.toLowerCase().includes(geraetSuche.trim().toLowerCase()))
    .slice(0, 8);

  return (
    <Bildschirm>
      <Stack.Screen options={{ title: neu ? 'Material hinzufügen' : 'Material' }} />
      <VorschlagEingabe feld="material" label="Was?" value={name} onChangeText={setName} placeholder="z. B. Dichtung 1/2 Zoll, Filter, Schäkel" />

      <Text style={s.label}>Menge</Text>
      <View style={s.mengeReihe}>
        <Pressable onPress={() => setMenge(Math.max(0, (menge ?? 0) - 1))} style={({ pressed }) => [s.knopf, pressed && { opacity: 0.6 }]}><Text style={s.knopfText}>−</Text></Pressable>
        <TextInput
          value={menge === null ? '' : String(menge).replace('.', ',')}
          onChangeText={(t) => { const n = parseFloat(t.replace(',', '.')); setMenge(t.trim() === '' || isNaN(n) ? null : n); }}
          keyboardType="decimal-pad" style={s.mengeFeld} selectTextOnFocus placeholder="–"
        />
        <Pressable onPress={() => setMenge((menge ?? 0) + 1)} style={({ pressed }) => [s.knopf, s.plus, pressed && { opacity: 0.6 }]}><Text style={[s.knopfText, { color: '#fff' }]}>＋</Text></Pressable>
      </View>
      <View style={s.einheiten}>
        {EINHEITEN.map((e) => (
          <Pressable key={e} onPress={() => setEinheit(e)} style={[s.chip, einheit === e && s.chipAktiv]}>
            <Text style={[s.chipText, einheit === e && { color: '#fff' }]}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Eingabe label="Notiz (optional)" value={notiz} onChangeText={setNotiz} placeholder="Artikelnummer, Lieferant, Größe …" mehrzeilig />

      <Text style={s.label}>Gehört zu Gerät (optional)</Text>
      {geraet && geraetName ? (
        <View style={s.geraet}>
          <Text style={s.geraetText} numberOfLines={1}>🔧 {geraetName}</Text>
          <Pressable onPress={() => setGeraet(null)} style={s.weg} hitSlop={6}><Text style={s.wegText}>✕</Text></Pressable>
        </View>
      ) : geraetSuche === null ? (
        <Taste titel="🔧 Gerät wählen" onPress={() => setGeraetSuche('')} art="sekundaer" klein style={{ marginBottom: groessen.abstand }} />
      ) : (
        <View style={{ marginBottom: groessen.abstand }}>
          <TextInput value={geraetSuche} onChangeText={setGeraetSuche} placeholder="Gerät suchen …" autoFocus placeholderTextColor={farben.grau} style={s.suche} />
          {treffer.map((e) => (
            <Pressable key={e.id} onPress={() => { setGeraet(e.id); setGeraetSuche(null); }} style={({ pressed }) => [s.treffer, pressed && { opacity: 0.6 }]}>
              <Text style={s.trefferText}>{e.name}</Text>
            </Pressable>
          ))}
          <Taste titel="Abbrechen" onPress={() => setGeraetSuche(null)} art="sekundaer" klein style={{ marginTop: 6 }} />
        </View>
      )}

      <FotoLeiste
        titel="Fotos"
        dateien={[...fotos.map((f) => f.datei), ...neueFotos]}
        onKamera={() => fotoHinzu(fotosMitKamera)}
        onGalerie={() => fotoHinzu(fotosAusGalerie)}
        onAnsehen={setAnsicht}
        onLoeschen={async (d) => {
          if (neueFotos.includes(d)) { setNeueFotos((l) => l.filter((x) => x !== d)); return; }
          const f = fotos.find((x) => x.datei === d);
          if (f) { await fotoLoeschen(db, f.id); fotoDateiLoeschen(d); setFotos((l) => l.filter((x) => x.id !== f.id)); }
        }}
      />

      <Taste titel="✓ Speichern" onPress={speichern} />
      <Taste titel="Abbrechen" onPress={() => router.back()} art="sekundaer" style={{ marginTop: 10 }} />
      {!neu ? (
        <Taste titel="🗑 Material löschen" art="gefahr" klein style={{ marginTop: 24 }} onPress={() =>
          Alert.alert(`„${name}“ löschen?`, 'Material und Fotos werden entfernt.', [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Löschen', style: 'destructive', onPress: async () => {
              fotos.forEach((f) => fotoDateiLoeschen(f.datei));
              await materialLoeschen(db, id);
              router.back();
            } },
          ])} />
      ) : null}
      <FotoAnsicht datei={ansicht} onSchliessen={() => setAnsicht(null)} />
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  label: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 6 },
  mengeReihe: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  knopf: { width: 64, height: 64, borderRadius: 14, backgroundColor: farben.grauHell, borderWidth: 2, borderColor: farben.rahmen, alignItems: 'center', justifyContent: 'center' },
  plus: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  knopfText: { fontSize: sz(32), fontWeight: '900', color: farben.text, marginTop: -2 },
  mengeFeld: { flex: 1, height: 64, borderRadius: 14, borderWidth: 2, borderColor: farben.rahmen, backgroundColor: farben.karte, textAlign: 'center', fontSize: sz(28), fontWeight: '800', color: farben.text },
  einheiten: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: groessen.abstand },
  chip: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: 999, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center' },
  chipAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  chipText: { fontSize: groessen.schriftKlein, fontWeight: '700', color: farben.text },
  geraet: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: farben.karte, borderRadius: groessen.radius, borderWidth: 2, borderColor: farben.rahmen, paddingLeft: 14, minHeight: groessen.tasteHoehe, marginBottom: groessen.abstand },
  geraetText: { flex: 1, fontSize: groessen.schrift, fontWeight: '700', color: farben.text },
  weg: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  wegText: { fontSize: sz(22), fontWeight: '800', color: farben.text },
  suche: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: groessen.radius, minHeight: 56, paddingHorizontal: 16, fontSize: groessen.schrift, color: farben.text, marginBottom: 6 },
  treffer: { backgroundColor: farben.karte, borderRadius: 10, padding: 14, marginBottom: 6, minHeight: 52, justifyContent: 'center' },
  trefferText: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text },
});
