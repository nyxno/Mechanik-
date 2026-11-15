// Eine Prüfung/Wartung erfassen: Datum, Beschreibung, Fotos.
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungAnlegen, fotoSpeichern } from '@/db/repo';
import { formatDeutsch, heute, parseDeutsch, plusTage } from '@/lib/datum';
import { fotosAusGalerie, fotosMitKamera } from '@/lib/fotos';
import { Bildschirm } from '@/components/Bildschirm';
import { Eingabe } from '@/components/Eingabe';
import { FotoLeiste } from '@/components/FotoLeiste';
import { Taste } from '@/components/Taste';
import { farben, groessen } from '@/theme';

export default function DurchfuehrungErfassen() {
  const db = useSQLiteContext();
  const { id, name, aufgabe } = useLocalSearchParams<{ id: string; name?: string; aufgabe?: string }>();
  const [datumText, setDatumText] = useState(formatDeutsch(heute()));
  const [beschreibung, setBeschreibung] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [laeuft, setLaeuft] = useState(false);

  const datumIso = parseDeutsch(datumText);

  const speichern = async () => {
    if (!datumIso) return Alert.alert('Datum ungültig', 'Bitte im Format TT.MM.JJJJ eingeben.');
    if (datumIso > heute()) return Alert.alert('Datum liegt in der Zukunft', 'Bitte ein Datum bis heute eingeben.');
    setLaeuft(true);
    try {
      const dId = await durchfuehrungAnlegen(db, id, datumIso, beschreibung || 'Durchgeführt');
      for (const f of fotos) await fotoSpeichern(db, { durchfuehrungId: dId }, f);
      router.back();
    } finally {
      setLaeuft(false);
    }
  };

  const hinzu = async (fn: () => Promise<string[]>) => {
    const d = await fn();
    if (d.length) setFotos((f) => [...f, ...d]);
  };

  return (
    <Bildschirm>
      {name ? <Text style={s.titel}>{name}</Text> : null}
      {aufgabe ? <Text style={s.aufgabe}>Aufgabe: {aufgabe}</Text> : null}

      <Eingabe
        label="Datum"
        value={datumText}
        onChangeText={setDatumText}
        keyboardType="numbers-and-punctuation"
        hinweis={datumIso ? undefined : 'Ungültiges Datum (TT.MM.JJJJ)'}
        style={datumIso ? undefined : { borderColor: farben.gefahr }}
      />
      <View style={s.schnell}>
        <Taste titel="Heute" onPress={() => setDatumText(formatDeutsch(heute()))} art="sekundaer" klein style={{ flex: 1 }} />
        <Taste titel="Gestern" onPress={() => setDatumText(formatDeutsch(plusTage(heute(), -1)))} art="sekundaer" klein style={{ flex: 1 }} />
      </View>

      <Eingabe
        label="Was wurde gemacht?"
        value={beschreibung}
        onChangeText={setBeschreibung}
        placeholder="z. B. Sichtprüfung ohne Mängel, Dichtung getauscht …"
        mehrzeilig
      />

      <FotoLeiste titel="Fotos" dateien={fotos} onKamera={() => hinzu(fotosMitKamera)} onGalerie={() => hinzu(fotosAusGalerie)} onLoeschen={(d) => setFotos((f) => f.filter((x) => x !== d))} />

      <Taste titel={laeuft ? 'Speichern …' : '✓ Als erledigt speichern'} onPress={speichern} deaktiviert={laeuft || !datumIso} />
      <Taste titel="Abbrechen" onPress={() => router.back()} art="sekundaer" style={{ marginTop: 10 }} />
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  titel: { fontSize: groessen.titel, fontWeight: '800', color: farben.text, marginBottom: 4 },
  aufgabe: { fontSize: groessen.schrift, color: farben.textLeicht, marginBottom: 20 },
  schnell: { flexDirection: 'row', gap: 10, marginTop: -6, marginBottom: groessen.abstand },
});
