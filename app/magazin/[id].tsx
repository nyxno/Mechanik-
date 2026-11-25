// Magazin-Eintrag anlegen/bearbeiten: Etikett lesen, Bezeichnung, Artikelnummer, Mein Name, Regal, Fach, Paternoster, Notiz, Fotos.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { farben, groessen, sz } from '@/theme';
import { artikelnummerVorschlag, bezeichnungVorschlag } from '@/lib/etikett';
import { etikettFotografieren, etikettLesenMoeglich } from '@/lib/etikettLesen';

export default function MagazinBearbeiten() {
  const db = useSQLiteContext();
  const { id, name: startName } = useLocalSearchParams<{ id: string; name?: string }>();
  const neu = id === 'neu';
  const [geladen, setGeladen] = useState(neu);
  const [name, setName] = useState(startName ?? '');
  const [artikelnummer, setArtikelnummer] = useState('');
  const [eigenerName, setEigenerName] = useState('');
  const [erkannt, setErkannt] = useState<string[] | null>(null);
  const [liest, setLiest] = useState(false);
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
      if (m) { setName(m.name); setArtikelnummer(m.artikelnummer); setEigenerName(m.eigener_name); setRegal(m.regal); setFach(m.fach); setPaternoster(m.paternoster); setNotiz(m.notiz); }
      setGeladen(true);
    });
    fotosZuMagazin(db, id).then(setFotos);
  }, [db, id, neu]);
  if (!geladen) return null;

  const zurueck = () => (router.canGoBack() ? router.back() : router.replace('/magazin'));
  const speichern = async () => {
    if (!name.trim()) return Alert.alert('Name fehlt', 'Was liegt dort? Z. B. „Loctite 243“.');
    const mid = await magazinSpeichern(db, neu ? null : id, { name, artikelnummer, eigener_name: eigenerName, regal, fach, paternoster, notiz });
    for (const f of neueFotos) await fotoSpeichern(db, { magazinId: mid }, f);
    zurueck();
  };
  const hinzu = async (fn: () => Promise<string[]>) => { const d = await fn(); if (d.length) setNeueFotos((f) => [...f, ...d]); };

  return (
    <Bildschirm>
      <Stack.Screen options={{ title: neu ? 'Ins Magazin eintragen' : 'Magazin' }} />
      {etikettLesenMoeglich ? (
        <Taste titel={liest ? 'Etikett wird gelesen …' : '📷 Etikett lesen'} deaktiviert={liest} style={{ marginBottom: 12 }} onPress={async () => {
          setLiest(true);
          try {
            const r = await etikettFotografieren();
            if (!r) return;
            setNeueFotos((f) => [...f, r.datei]);
            setErkannt(r.zeilen);
            if (!r.zeilen.length) { Alert.alert('Kein Text erkannt', 'Bitte näher ran und auf gutes Licht achten – oder einfach eintippen.'); return; }
            if (!name.trim()) setName(bezeichnungVorschlag(r.zeilen) ?? '');
            if (!artikelnummer.trim()) setArtikelnummer(artikelnummerVorschlag(r.zeilen) ?? '');
          } catch (e) {
            Alert.alert('Texterkennung nicht möglich', `Beim ersten Mal lädt Android das Erkennungsmodell – dafür kurz Internet nötig.\n\n${String(e)}`);
          } finally { setLiest(false); }
        }} />
      ) : null}
      {liest ? <ActivityIndicator size="large" color={farben.primaer} style={{ marginBottom: 12 }} /> : null}

      {erkannt && erkannt.length ? (
        <View style={s.erkannt}>
          <Text style={s.erkanntTitel}>Erkannt – Zeile antippen und übernehmen:</Text>
          {erkannt.map((z) => (
            <View key={z} style={s.zeile}>
              <Text style={s.zeileText} numberOfLines={2}>{z}</Text>
              <Pressable onPress={() => setName(z)} style={({ pressed }) => [s.minitaste, pressed && { opacity: 0.6 }]}>
                <Text style={s.minitasteText}>Bezeichnung</Text>
              </Pressable>
              <Pressable onPress={() => setArtikelnummer(artikelnummerVorschlag([z]) ?? z)} style={({ pressed }) => [s.minitaste, pressed && { opacity: 0.6 }]}>
                <Text style={s.minitasteText}>Art.-Nr.</Text>
              </Pressable>
            </View>
          ))}
          <Pressable onPress={() => setErkannt(null)} style={{ paddingVertical: 8 }}><Text style={s.link}>Liste ausblenden</Text></Pressable>
        </View>
      ) : null}

      <VorschlagEingabe feld="magazin" label="Bezeichnung" value={name} onChangeText={setName} placeholder="z. B. Loctite 243, Kabelbinder 300 mm" />
      <Eingabe label="Artikelnummer" value={artikelnummer} onChangeText={setArtikelnummer} placeholder="z. B. 1335884" autoCapitalize="characters" />
      <VorschlagEingabe feld="magazin" label="Mein Name (wie ich es nenne)" value={eigenerName} onChangeText={setEigenerName} placeholder="z. B. Schraubensicherung blau" />
      <Text style={s.label}>📍 Wo liegt es?</Text>
      <View style={s.reihe}>
        <View style={{ flex: 1 }}><VorschlagEingabe feld="regal" label="Regal" value={regal} onChangeText={setRegal} placeholder="z. B. 3" /></View>
        <View style={{ flex: 1 }}><Eingabe label="Fach" value={fach} onChangeText={setFach} placeholder="z. B. B2" /></View>
      </View>
      <VorschlagEingabe feld="paternoster" label="Paternoster" value={paternoster} onChangeText={setPaternoster} placeholder="z. B. 2 / Ebene 14" />
      <Eingabe label="Notiz (optional)" value={notiz} onChangeText={setNotiz} placeholder="Menge, Größe, Lieferant …" mehrzeilig />
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
  erkannt: { backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#BFDBFE', borderRadius: groessen.radius, padding: 12, marginBottom: groessen.abstand, gap: 8 },
  erkanntTitel: { fontSize: groessen.schriftKlein, fontWeight: '800', color: farben.text },
  zeile: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: farben.karte, borderRadius: 10, padding: 8 },
  zeileText: { flex: 1, fontSize: groessen.schrift, fontWeight: '600', color: farben.text },
  minitaste: { backgroundColor: farben.primaer, borderRadius: 8, paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' },
  minitasteText: { color: '#fff', fontWeight: '800', fontSize: sz(13) },
  link: { color: farben.primaer, fontWeight: '700', fontSize: groessen.schriftKlein, textAlign: 'center' },
  label: { fontSize: groessen.schriftGross, fontWeight: '800', color: farben.text, marginBottom: 8 },
  reihe: { flexDirection: 'row', gap: 10 },
});
