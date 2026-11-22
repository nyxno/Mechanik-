// Erkannte Muster: wiederkehrende Mängel, gleicher Standort, übliche Arbeitszeit.
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { einstellungenLaden, einstellungenSpeichern, hinweisAusblenden, hinweiseLaden, hinweiseWiederZeigen } from '@/db/repo';
import type { EintragMitStatus } from '@/db/typen';
import { erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import type { Hinweis } from '@/lib/hinweise';
import { Bildschirm } from '@/components/Bildschirm';
import { EintragKarte } from '@/components/EintragKarte';
import { Taste } from '@/components/Taste';
import { farben, groessen } from '@/theme';

export default function Hinweise() {
  const db = useSQLiteContext();
  const [daten, setDaten] = useState<{ hinweise: Hinweis[]; eintraege: EintragMitStatus[]; ausgeblendet: number } | null>(null);
  const laden = useCallback(async () => setDaten(await hinweiseLaden(db)), [db]);
  useFocusEffect(useCallback(() => { laden(); }, [laden]));
  if (!daten) return null;

  const uhrzeitUebernehmen = async (uhrzeit: string) => {
    const e = await einstellungenLaden(db);
    await einstellungenSpeichern(db, { ...e, uhrzeit });
    await erinnerungenNeuPlanen(db);
    laden();
  };

  return (
    <Bildschirm>
      <Text style={s.intro}>Die App schaut sich deine Einträge an und erkennt Muster. Alles passiert nur am Handy.</Text>
      {daten.hinweise.length === 0 ? <Text style={s.leer}>Gerade keine Hinweise. 👍</Text> : null}
      {daten.hinweise.map((h, i) => (
        <View key={i} style={[s.box, h.art === 'mangel' && s.mangel]}>
          <View style={s.kopf}>
            <Text style={[s.titel, { flex: 1 }]}>{h.titel}</Text>
            <Pressable onPress={async () => { await hinweisAusblenden(db, h.schluessel); laden(); }} hitSlop={8}
              style={({ pressed }) => [s.weg, pressed && { opacity: 0.6 }]}>
              <Text style={s.wegText}>✕</Text>
            </Pressable>
          </View>
          <Text style={s.text}>{h.text}</Text>
          {h.uhrzeit ? <Taste titel={`Erinnerungen auf ${h.uhrzeit} Uhr stellen`} onPress={() => uhrzeitUebernehmen(h.uhrzeit!)} klein /> : null}
          {h.eintragIds.map((id) => {
            const e = daten.eintraege.find((x) => x.id === id);
            return e ? <EintragKarte key={id} eintrag={e} /> : null;
          })}
        </View>
      ))}
      {daten.ausgeblendet > 0 ? (
        <Taste titel={`Ausgeblendete wieder zeigen (${daten.ausgeblendet})`} onPress={async () => { await hinweiseWiederZeigen(db); laden(); }} art="sekundaer" klein />
      ) : null}
      {daten.hinweise.length > 0 ? <Text style={s.intro}>✕ blendet einen Hinweis aus. Er kommt wieder, wenn sich etwas ändert (z. B. ein weiterer Mangel).</Text> : null}
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  intro: { fontSize: groessen.schriftKlein, color: farben.textLeicht, marginBottom: groessen.abstand },
  leer: { fontSize: groessen.schrift, color: farben.textLeicht, textAlign: 'center', padding: 24 },
  box: { backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 14, marginBottom: groessen.abstand, gap: 8, borderWidth: 2, borderColor: '#BFDBFE' },
  mangel: { borderColor: farben.gelb, backgroundColor: farben.gelbHell },
  kopf: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  weg: { width: 48, height: 48, borderRadius: 12, backgroundColor: farben.grauHell, alignItems: 'center', justifyContent: 'center' },
  wegText: { fontSize: groessen.schriftGross, fontWeight: '800', color: farben.text },
  titel: { fontSize: groessen.schrift, fontWeight: '800', color: farben.text },
  text: { fontSize: groessen.schrift, color: farben.text, lineHeight: 25 },
});
