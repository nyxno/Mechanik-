// Detailseite eines Eintrags: Status, Infos, Fotos, Verlauf aller Durchführungen.
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungenLaden, durchfuehrungLoeschen, eintragFaelligkeit, eintragIntervall, eintragLaden, eintragSchlummern, einstellungenLaden, fotosZuDurchfuehrungen, fotosZuEintrag, mangelBehoben, materialBesorgt, materialLaden } from '@/db/repo';
import { erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import type { Durchfuehrung, EintragMitStatus, Foto } from '@/db/typen';
import { intervallText } from '@/lib/intervall';
import { wiederkehrendeMaengel } from '@/lib/muster';
import { stundenText } from '@/lib/statistik';
import type { Material } from '@/db/typen';
import { MaterialZeile } from '@/components/MaterialZeile';
import { GebietMarke } from '@/components/EintragKarte';
import { formatDeutsch, formatMitTag, heute, schlummerZiel } from '@/lib/datum';
import { fotoDateiLoeschen } from '@/lib/fotos';
import { Bildschirm } from '@/components/Bildschirm';
import { FotoAnsicht } from '@/components/FotoAnsicht';
import { FotoLeiste } from '@/components/FotoLeiste';
import { StatusBadge } from '@/components/StatusBadge';
import { Taste } from '@/components/Taste';
import { ergebnisFarben, farben, groessen, statusFarben } from '@/theme';

export default function EintragDetail() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [eintrag, setEintrag] = useState<EintragMitStatus | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [verlauf, setVerlauf] = useState<Durchfuehrung[]>([]);
  const [verlaufFotos, setVerlaufFotos] = useState<Foto[]>([]);
  const [ansicht, setAnsicht] = useState<string | null>(null);
  const [standardUhrzeit, setStandardUhrzeit] = useState('07:00');
  const [material, setMaterial] = useState<Material[]>([]);

  const laden = useCallback(async () => {
    const [e, f, v, vf, ein] = await Promise.all([eintragLaden(db, id), fotosZuEintrag(db, id), durchfuehrungenLaden(db, id), fotosZuDurchfuehrungen(db, id), einstellungenLaden(db)]);
    setEintrag(e); setFotos(f); setVerlauf(v); setVerlaufFotos(vf); setStandardUhrzeit(ein.uhrzeit);
    setMaterial(await materialLaden(db, id));
  }, [db, id]);
  useFocusEffect(useCallback(() => { laden(); }, [laden]));

  if (!eintrag) return null;

  const f = eintragFaelligkeit(eintrag, heute());
  const uhr = eintrag.uhrzeit ?? standardUhrzeit;
  const sf = statusFarben(f.status);
  const erledigt = f.status === 'erledigt';
  const schlummert = !!eintrag.schlummern_bis && eintrag.schlummern_bis > heute();
  const offeneMaengel = verlauf.filter((d) => d.ergebnis !== 'ok' && !d.mangel_behoben_am);
  const muster = wiederkehrendeMaengel(
    verlauf.filter((d) => d.ergebnis !== 'ok').map((d) => ({ eintragId: id, datum: d.datum, notiz: d.notiz })), heute(),
  )[0];

  const schlummern = async () => {
    const ziel = schlummerZiel(heute());
    await eintragSchlummern(db, id, ziel);
    await erinnerungenNeuPlanen(db);
    laden();
    Alert.alert('💤 Verschoben', `Erinnerung kommt wieder am ${formatMitTag(ziel)} um ${uhr} Uhr.\nDie Prüffrist bleibt ${f.naechster ? formatDeutsch(f.naechster) : 'unverändert'}.`);
  };

  const behoben = (d: Durchfuehrung) =>
    Alert.alert('Mangel behoben?', d.notiz || 'Mangel als behoben markieren.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: '✓ Behoben', onPress: async () => { await mangelBehoben(db, d.id); laden(); } },
    ]);

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
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <StatusBadge status={f.status} />
          <GebietMarke name={eintrag.kategorie_name} farbe={eintrag.kategorie_farbe} />
        </View>
        <Text style={[s.faellig, { color: sf.vorder }]}>{f.text}</Text>
        {f.naechster ? (
          <Text style={s.termin}>
            📅 {formatMitTag(f.naechster)}  🕒 {uhr} Uhr{eintrag.naechster_termin && !eintrag.einmalig ? '  (fester Termin)' : ''}
          </Text>
        ) : null}
        {f.verschobenVon ? <Text style={s.klein}>Wochenende: vom {formatMitTag(f.verschobenVon)} verschoben</Text> : null}
        {schlummert ? <Text style={s.termin}>💤 Erinnerung erst am {formatMitTag(eintrag.schlummern_bis!)}</Text> : null}
        <Text style={s.klein}>{eintrag.einmalig ? '1× Einmaliger Termin' : `Intervall: ${intervallText(eintragIntervall(eintrag))}`}</Text>
      </View>

      {muster ? (
        <View style={[s.mangel, { backgroundColor: farben.gelbHell, borderColor: farben.gelb }]}>
          <Text style={[s.mangelTitel, { color: farben.gelb }]}>💡 Wiederkehrender Mangel: {muster.anzahl}× in 12 Monaten</Text>
          <Text style={s.mangelText}>
            {muster.haeufigste ? `${muster.haeufigsteAnzahl}× „${muster.haeufigste}“. ` : ''}Ursache prüfen, Teil tauschen oder Intervall verkürzen?
          </Text>
        </View>
      ) : null}

      {offeneMaengel.map((d) => {
        const ef = ergebnisFarben(d.ergebnis);
        return (
          <View key={d.id} style={[s.mangel, { backgroundColor: ef.hinter, borderColor: ef.vorder }]}>
            <Text style={[s.mangelTitel, { color: ef.vorder }]}>{ef.symbol} {ef.label} seit {formatDeutsch(d.datum)}</Text>
            {d.notiz ? <Text style={s.mangelText}>{d.notiz}</Text> : null}
            <Taste titel="✓ Mangel behoben" onPress={() => behoben(d)} art="sekundaer" klein />
          </View>
        );
      })}

      {erledigt ? null : (
        <>
          <Taste
            titel="✓ Jetzt durchgeführt"
            onPress={() => router.push({ pathname: '/eintrag/[id]/durchfuehrung', params: { id } })}
          />
          {f.naechster ? (
            <Taste
              titel={schlummert ? '💤 Schlummern beenden' : '💤 Morgen erinnern'}
              onPress={schlummert ? async () => { await eintragSchlummern(db, id, null); await erinnerungenNeuPlanen(db); laden(); } : schlummern}
              art="sekundaer" klein style={{ marginTop: 10 }}
            />
          ) : null}
        </>
      )}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 20 }}>
        <Taste titel="✎ Bearbeiten" onPress={() => router.push({ pathname: '/eintrag/[id]/bearbeiten', params: { id } })} art="sekundaer" klein style={{ flex: 1 }} />
        <Taste titel="⧉ Kopieren" onPress={() => router.push({ pathname: '/eintrag/neu', params: { vonId: id } })} art="sekundaer" klein style={{ flex: 1 }} />
      </View>

      {eintrag.aufgabe ? <Abschnitt titel="Was ist zu machen?" text={eintrag.aufgabe} /> : null}
      {eintrag.zusatzinfo ? <Abschnitt titel="Zusatzinfo" text={eintrag.zusatzinfo} /> : null}

      <FotoLeiste titel="Fotos" dateien={fotos.map((x) => x.datei)} onAnsehen={setAnsicht} />

      <Text style={s.abschnittTitel}>📦 Material ({material.filter((m) => !m.besorgt).length} offen)</Text>
      {material.map((m) => (
        <MaterialZeile key={m.id} m={m} zeigeGeraet={false} onAbhaken={async (x) => { await materialBesorgt(db, x.id, !x.besorgt); laden(); }} />
      ))}
      <Taste titel="＋ Material für dieses Gerät" onPress={() => router.push({ pathname: '/material/[id]', params: { id: 'neu', eintragId: id } })} art="sekundaer" klein style={{ marginBottom: 20 }} />

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
            <Text style={[s.ergebnisZeile, { color: ergebnisFarben(d.ergebnis).vorder }]}>
              {ergebnisFarben(d.ergebnis).symbol} {ergebnisFarben(d.ergebnis).label}
              {d.ergebnis !== 'ok' && d.mangel_behoben_am ? ` – behoben am ${formatDeutsch(d.mangel_behoben_am)}` : ''}
            </Text>
            {d.notiz ? <Text style={s.verlaufText}>Mangel: {d.notiz}</Text> : null}
            <Text style={s.verlaufText}>{d.beschreibung}</Text>
            {d.hitze_stunden > 0 || d.staub_stunden > 0 ? (
              <Text style={s.klein}>
                {d.hitze_stunden > 0 ? `🔥 Hitze ${stundenText(d.hitze_stunden)}` : ''}{d.hitze_stunden > 0 && d.staub_stunden > 0 ? '   ' : ''}
                {d.staub_stunden > 0 ? `🌫 Staub ${stundenText(d.staub_stunden)}` : ''}
              </Text>
            ) : null}
            {d.pruefer ? <Text style={s.klein}>Geprüft von: {d.pruefer}</Text> : null}
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
  mangel: { borderWidth: 2, borderRadius: groessen.radius, padding: 14, marginBottom: 12, gap: 8 },
  mangelTitel: { fontSize: groessen.schrift, fontWeight: '800' },
  mangelText: { fontSize: groessen.schrift, color: farben.text },
  ergebnisZeile: { fontSize: groessen.schriftKlein, fontWeight: '700', marginBottom: 2 },
});
