// Eine Prüfung/Wartung erfassen: Datum, Beschreibung, Fotos, nächster Termin.
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungAnlegen, eintragIntervall, eintragLaden, fotoSpeichern } from '@/db/repo';
import type { EintragMitStatus } from '@/db/typen';
import { formatDeutsch, heute, plusTage } from '@/lib/datum';
import { intervallAddieren, intervallText } from '@/lib/intervall';
import { erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import { fotosAusGalerie, fotosMitKamera } from '@/lib/fotos';
import { Bildschirm } from '@/components/Bildschirm';
import { DatumFeld } from '@/components/DatumFeld';
import { Eingabe } from '@/components/Eingabe';
import { FotoLeiste } from '@/components/FotoLeiste';
import { Taste } from '@/components/Taste';
import { farben, groessen } from '@/theme';

export default function DurchfuehrungErfassen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [eintrag, setEintrag] = useState<EintragMitStatus | null>(null);
  const [datum, setDatum] = useState<string>(heute());
  const [beschreibung, setBeschreibung] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  /** Vom Benutzer gewählter nächster Termin; null = automatisch (Datum + Intervall). */
  const [naechsterFest, setNaechsterFest] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => { eintragLaden(db, id).then(setEintrag); }, [db, id]);
  if (!eintrag) return null;

  const intervall = eintragIntervall(eintrag);
  const berechnet = intervallAddieren(datum, intervall);
  const naechster = naechsterFest ?? berechnet;

  const speichern = async () => {
    if (datum > heute()) return Alert.alert('Datum liegt in der Zukunft', 'Bitte ein Datum bis heute wählen.');
    if (naechster <= datum) return Alert.alert('Nächster Termin prüfen', 'Der nächste Termin muss nach dem Durchführungsdatum liegen.');
    setLaeuft(true);
    try {
      const fest = naechsterFest && naechsterFest !== berechnet ? naechsterFest : null;
      const dId = await durchfuehrungAnlegen(db, id, datum, beschreibung || 'Durchgeführt', fest);
      for (const f of fotos) await fotoSpeichern(db, { durchfuehrungId: dId }, f);
      erinnerungenNeuPlanen(db);
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
      <Text style={s.titel}>{eintrag.name}</Text>
      {eintrag.aufgabe ? <Text style={s.aufgabe}>Aufgabe: {eintrag.aufgabe}</Text> : null}

      <DatumFeld label="Gemacht am" wert={datum} onChange={(d) => d && setDatum(d)} max={heute()} />
      <View style={s.schnell}>
        <Taste titel="Heute" onPress={() => setDatum(heute())} art="sekundaer" klein style={{ flex: 1 }} />
        <Taste titel="Gestern" onPress={() => setDatum(plusTage(heute(), -1))} art="sekundaer" klein style={{ flex: 1 }} />
      </View>

      <Eingabe
        label="Was wurde gemacht?"
        value={beschreibung}
        onChangeText={setBeschreibung}
        placeholder="z. B. Sichtprüfung ohne Mängel, Dichtung getauscht …"
        mehrzeilig
      />

      <FotoLeiste titel="Fotos" dateien={fotos} onKamera={() => hinzu(fotosMitKamera)} onGalerie={() => hinzu(fotosAusGalerie)} onLoeschen={(d) => setFotos((f) => f.filter((x) => x !== d))} />

      <DatumFeld
        label="Nächstes Mal fällig am"
        wert={naechster}
        onChange={(d) => setNaechsterFest(d)}
        min={plusTage(datum, 1)}
        hinweis={naechsterFest && naechsterFest !== berechnet
          ? `Von Hand gewählt. Automatisch wäre: ${formatDeutsch(berechnet)} (${intervallText(intervall)}).`
          : `Automatisch berechnet: ${intervallText(intervall)}. Antippen, um ein anderes Datum zu wählen.`}
      />
      {naechsterFest && naechsterFest !== berechnet ? (
        <Taste titel="↺ Wieder automatisch" onPress={() => setNaechsterFest(null)} art="sekundaer" klein style={{ marginTop: -6, marginBottom: groessen.abstand }} />
      ) : null}

      <Taste titel={laeuft ? 'Speichern …' : '✓ Als erledigt speichern'} onPress={speichern} deaktiviert={laeuft} />
      <Taste titel="Abbrechen" onPress={() => router.back()} art="sekundaer" style={{ marginTop: 10 }} />
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  titel: { fontSize: groessen.titel, fontWeight: '800', color: farben.text, marginBottom: 4 },
  aufgabe: { fontSize: groessen.schrift, color: farben.textLeicht, marginBottom: 20 },
  schnell: { flexDirection: 'row', gap: 10, marginTop: -6, marginBottom: groessen.abstand },
});
