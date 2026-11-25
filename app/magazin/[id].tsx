// Magazin-Eintrag anlegen/bearbeiten: Name, Regal, Fach, Paternoster, Notiz, Fotos.
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { fotoLoeschen, fotoSpeichern, fotosZuMagazin, magazinEinzeln, magazinLoeschen, magazinSpeichern } from '@/db/repo';
import type { Foto } from '@/db/typen';
import { fotoDateiLoeschen, fotosAusGalerie, fotosMitKamera } from '@/lib/fotos';
import { Bildschirm } from '@/components/Bildschirm';
import { Eingabe } from '@/components/Eingabe';
import { FotoAnsicht } from '@/components/FotoAnsicht';
import { FotoLeiste } from '@/components/FotoLeiste';
import { Taste } from '@/components/Taste';
import { VorschlagEingabe } from '@/components/Vorschlaege';
import { farben, groessen } from '@/theme';

export default function MagazinBearbeiten() {
  const db = useSQLiteContext();
  const { id, name: startName } = useLocalSearchParams<{ id: string; name?: string }>();
  const neu = id === 'neu';
  const [geladen, setGeladen] = useState(neu);
  const [name, setName] = useState(startName ?? '');
  const [regal, setRegal] = useState('');
  const [fach, setFach] = useState('');
  const [paternoster, setPaternoster] = useState('');
  const [notiz, setNotiz] = useState('');
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [neueFotos, setNeueFotos] = useState<string[]>([]);
  const [ansicht, setAnsicht] = useState<string | null>(null);

  useEffect(() => {
    if (neu) return;
    magazinEinzeln(db, id).then((m) => {
      if (m) { setName(m.name); setRegal(m.regal); setFach(m.fach); setPaternoster(m.paternoster); setNotiz(m.notiz); }
      setGeladen(true);
    });
    fotosZuMagazin(db, id).then(setFotos);
  }, [db, id, neu]);
  if (!geladen) return null;

  const zurueck = () => (router.canGoBack() ? router.back() : router.replace('/magazin'));
  const speichern = async () => {
    if (!name.trim()) return Alert.alert('Name fehlt', 'Was liegt dort? Z. B. „Loctite 243“.');
    const mid = await magazinSpeichern(db, neu ? null : id, { name, regal, fach, paternoster, notiz });
    for (const f of neueFotos) await fotoSpeichern(db, { magazinId: mid }, f);
    zurueck();
  };
  const hinzu = async (fn: () => Promise<string[]>) => { const d = await fn(); if (d.length) setNeueFotos((f) => [...f, ...d]); };

  return (
    <Bildschirm>
      <Stack.Screen options={{ title: neu ? 'Ins Magazin eintragen' : 'Magazin' }} />
      <VorschlagEingabe feld="magazin" label="Was?" value={name} onChangeText={setName} placeholder="z. B. Loctite 243, Kabelbinder 300 mm" />
      <Text style={s.label}>📍 Wo liegt es?</Text>
      <View style={s.reihe}>
        <View style={{ flex: 1 }}><VorschlagEingabe feld="regal" label="Regal" value={regal} onChangeText={setRegal} placeholder="z. B. 3" /></View>
        <View style={{ flex: 1 }}><Eingabe label="Fach" value={fach} onChangeText={setFach} placeholder="z. B. B2" /></View>
      </View>
      <VorschlagEingabe feld="paternoster" label="Paternoster" value={paternoster} onChangeText={setPaternoster} placeholder="z. B. 2 / Ebene 14" />
      <Eingabe label="Notiz (optional)" value={notiz} onChangeText={setNotiz} placeholder="Menge, Größe, Artikelnummer …" mehrzeilig />
      <FotoLeiste
        titel="Fotos (z. B. vom Fach)"
        dateien={[...fotos.map((f) => f.datei), ...neueFotos]}
        onKamera={() => hinzu(fotosMitKamera)}
        onGalerie={() => hinzu(fotosAusGalerie)}
        onAnsehen={setAnsicht}
        onLoeschen={async (d) => {
          if (neueFotos.includes(d)) { setNeueFotos((l) => l.filter((x) => x !== d)); return; }
          const f = fotos.find((x) => x.datei === d);
          if (f) { await fotoLoeschen(db, f.id); fotoDateiLoeschen(d); setFotos((l) => l.filter((x) => x.id !== f.id)); }
        }}
      />
      <Taste titel="✓ Speichern" onPress={speichern} />
      <Taste titel="Abbrechen" onPress={zurueck} art="sekundaer" style={{ marginTop: 10 }} />
      {!neu ? (
        <Taste titel="🗑 Aus dem Magazin löschen" art="gefahr" klein style={{ marginTop: 24 }} onPress={() =>
          Alert.alert(`„${name}“ löschen?`, 'Eintrag und Fotos werden entfernt.', [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Löschen', style: 'destructive', onPress: async () => { fotos.forEach((f) => fotoDateiLoeschen(f.datei)); await magazinLoeschen(db, id); zurueck(); } },
          ])} />
      ) : null}
      <FotoAnsicht datei={ansicht} onSchliessen={() => setAnsicht(null)} />
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  label: { fontSize: groessen.schriftGross, fontWeight: '800', color: farben.text, marginBottom: 8 },
  reihe: { flexDirection: 'row', gap: 10 },
});
