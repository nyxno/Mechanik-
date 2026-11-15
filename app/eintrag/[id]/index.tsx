// Detailseite eines Eintrags: Status, Infos, Fotos, Verlauf aller Durchführungen.
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungenLaden, durchfuehrungLoeschen, eintragFaelligkeit, eintragIntervall, eintragLaden, einstellungenLaden, fotosZuDurchfuehrungen, fotosZuEintrag } from '@/db/repo';
import { erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import type { Durchfuehrung, EintragMitStatus, Foto } from '@/db/typen';
import { intervallText } from '@/lib/intervall';
import { formatDeutsch, heute } from '@/lib/datum';
import { fotoDateiLoeschen } from '@/lib/fotos';
import { Bildschirm } from '@/components/Bildschirm';
import { FotoAnsicht } from '@/components/FotoAnsicht';
import { FotoLeiste } from '@/components/FotoLeiste';
import { StatusBadge } from '@/components/StatusBadge';
import { Taste } from '@/components/Taste';
import { farben, groessen, statusFarben } from '@/theme';

export default function EintragDetail() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [eintrag, setEintrag] = useState<EintragMitStatus | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [verlauf, setVerlauf] = useState<Durchfuehrung[]>([]);
  const [verlaufFotos, setVerlaufFotos] = useState<Foto[]>([]);
  const [ansicht, setAnsicht] = useState<string | null>(null);
  const [standardUhrzeit, setStandardUhrzeit] = useState('07:00');

  const laden = useCallback(async () => {
    const [e, f, v, vf, ein] = await Promise.all([eintragLaden(db, id), fotosZuEintrag(db, id), durchfuehrungenLaden(db, id), fotosZuDurchfuehrungen(db, id), einstellungenLaden(db)]);
    setEintrag(e); setFotos(f); setVerlauf(v); setVerlaufFotos(vf); setStandardUhrzeit(ein.uhrzeit);
  }, [db, id]);
  useFocusEffect(useCallback(() => { laden(); }, [laden]));

  if (!eintrag) return null;

  const f = eintragFaelligkeit(eintrag, heute());
  const uhr = eintrag.uhrzeit ?? standardUhrzeit;
  const sf = statusFarben(f.status);

  const durchfuehrungEntfernen = (d: Durchfuehrung) =>
    Alert.alert('Durchführung löschen?', `Eintrag vom ${formatDeutsch(d.datum)} wird entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive',
        onPress: async () => {
          verlaufFotos.filter((x) => x.durchfuehrung_id === d.id).forEach((x) => fotoDateiLoeschen(x.datei));
          await durchfuehrungLoeschen(db, d.id);
          erinnerungenNeuPlanen(db);
          laden();
        },
      },
    ]);

  return (
    <Bildschirm>
      <Stack.Screen options={{ title: eintrag.kategorie_name }} />
      <View style={[s.status, { backgroundColor: sf.hinter, borderColor: sf.vorder }]}>
        <Text style={s.name}>{eintrag.name}</Text>
        <StatusBadge status={f.status} />
        <Text style={[s.faellig, { color: sf.vorder }]}>{f.text}</Text>
        {f.naechster ? (
          <Text style={s.termin}>
            📅 {formatDeutsch(f.naechster)}  🕒 {uhr} Uhr{eintrag.naechster_termin ? '  (fester Termin)' : ''}
          </Text>
        ) : null}
        <Text style={s.klein}>Intervall: {intervallText(eintragIntervall(eintrag))}</Text>
      </View>

      <Taste
        titel="✓ Jetzt durchgeführt"
        onPress={() => router.push({ pathname: '/eintrag/[id]/durchfuehrung', params: { id } })}
      />
      <Taste titel="✎ Bearbeiten" onPress={() => router.push({ pathname: '/eintrag/[id]/bearbeiten', params: { id } })} art="sekundaer" klein style={{ marginTop: 10, marginBottom: 20 }} />

      {eintrag.aufgabe ? <Abschnitt titel="Was ist zu machen?" text={eintrag.aufgabe} /> : null}
      {eintrag.zusatzinfo ? <Abschnitt titel="Zusatzinfo" text={eintrag.zusatzinfo} /> : null}

      <FotoLeiste titel="Fotos" dateien={fotos.map((x) => x.datei)} onAnsehen={setAnsicht} />

      <Text style={s.abschnittTitel}>Verlauf ({verlauf.length})</Text>
      {verlauf.length === 0 ? <Text style={s.klein}>Noch keine Durchführung erfasst.</Text> : null}
      {verlauf.map((d, i) => {
        const df = verlaufFotos.filter((x) => x.durchfuehrung_id === d.id);
        return (
          <Pressable key={d.id} onLongPress={() => durchfuehrungEntfernen(d)} style={[s.verlauf, i === 0 && s.verlaufNeu]}>
            <View style={s.verlaufKopf}>
              <Text style={s.verlaufDatum}>{formatDeutsch(d.datum)}</Text>
              {i === 0 ? <Text style={s.zuletzt}>zuletzt</Text> : null}
            </View>
            <Text style={s.verlaufText}>{d.beschreibung}</Text>
            {df.length ? <FotoLeiste dateien={df.map((x) => x.datei)} onAnsehen={setAnsicht} /> : null}
          </Pressable>
        );
      })}
      {verlauf.length ? <Text style={s.hinweis}>Lange auf eine Durchführung drücken, um sie zu löschen.</Text> : null}

      <FotoAnsicht datei={ansicht} onSchliessen={() => setAnsicht(null)} />
    </Bildschirm>
  );
}

function Abschnitt({ titel, text }: { titel: string; text: string }) {
  return (
    <View style={s.abschnitt}>
      <Text style={s.abschnittTitel}>{titel}</Text>
      <Text style={s.abschnittText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  status: { borderRadius: groessen.radius, borderWidth: 2, padding: 16, marginBottom: 16, gap: 8 },
  name: { fontSize: groessen.titel, fontWeight: '800', color: farben.text },
  faellig: { fontSize: groessen.schriftGross, fontWeight: '700' },
  termin: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text },
  klein: { fontSize: groessen.schriftKlein, color: farben.textLeicht },
  abschnitt: { marginBottom: 16 },
  abschnittTitel: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 6 },
  abschnittText: { fontSize: groessen.schrift, color: farben.text, lineHeight: 26, backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 14 },
  verlauf: { backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 14, marginBottom: 10 },
  verlaufNeu: { borderWidth: 2, borderColor: farben.primaer },
  verlaufKopf: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  verlaufDatum: { fontSize: groessen.schriftGross, fontWeight: '700', color: farben.text },
  zuletzt: { color: farben.primaer, fontWeight: '700', fontSize: groessen.schriftKlein },
  verlaufText: { fontSize: groessen.schrift, color: farben.text, lineHeight: 26 },
  hinweis: { color: farben.grau, fontSize: groessen.schriftKlein, marginTop: 4 },
});
