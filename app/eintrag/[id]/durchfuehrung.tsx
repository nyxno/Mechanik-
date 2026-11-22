// Eine Prüfung/Wartung erfassen: Datum, Ergebnis, Beschreibung, Prüfer, Fotos, nächster Termin.
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungAnlegen, eintragIntervall, eintragLaden, fotoSpeichern, prueferLaden, prueferSpeichern } from '@/db/repo';
import type { EintragMitStatus, Ergebnis } from '@/db/typen';
import { aufWerktag, formatDeutsch, heute, plusTage } from '@/lib/datum';
import { intervallAddieren, intervallText } from '@/lib/intervall';
import { erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import { fotosAusGalerie, fotosMitKamera } from '@/lib/fotos';
import { Bildschirm } from '@/components/Bildschirm';
import { DatumFeld } from '@/components/DatumFeld';
import { wochenendHinweis } from '@/components/EintragFormular';
import { FotoLeiste } from '@/components/FotoLeiste';
import { Taste } from '@/components/Taste';
import { VorschlagEingabe } from '@/components/Vorschlaege';
import { StundenWahl } from '@/components/StundenWahl';
import { ergebnisFarben, farben, groessen, sz } from '@/theme';

const ERGEBNISSE: Ergebnis[] = ['ok', 'maengel', 'ausser_betrieb'];

export default function DurchfuehrungErfassen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [eintrag, setEintrag] = useState<EintragMitStatus | null>(null);
  const [datum, setDatum] = useState<string>(heute());
  const [ergebnis, setErgebnis] = useState<Ergebnis>('ok');
  const [notiz, setNotiz] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [pruefer, setPruefer] = useState('');
  const [prueferGespeichert, setPrueferGespeichert] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [hitze, setHitze] = useState(0);
  const [staub, setStaub] = useState(0);
  /** Vom Benutzer gewählter nächster Termin; null = automatisch (Datum + Intervall). */
  const [naechsterFest, setNaechsterFest] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    eintragLaden(db, id).then(setEintrag);
    prueferLaden(db).then((p) => { setPruefer(p); setPrueferGespeichert(p); });
  }, [db, id]);
  if (!eintrag) return null;

  const einmalig = !!eintrag.einmalig;
  const intervall = eintragIntervall(eintrag);
  const berechnet = aufWerktag(intervallAddieren(datum, intervall));
  const naechster = naechsterFest ?? berechnet;
  const vonHand = !!naechsterFest && naechsterFest !== berechnet;

  const speichern = async () => {
    if (datum > heute()) return Alert.alert('Datum liegt in der Zukunft', 'Bitte ein Datum bis heute wählen.');
    if (!einmalig && naechster <= datum) return Alert.alert('Nächster Termin prüfen', 'Der nächste Termin muss nach dem Durchführungsdatum liegen.');
    setLaeuft(true);
    try {
      const r = await durchfuehrungAnlegen(db, {
        eintragId: id,
        datum,
        beschreibung: beschreibung || 'Durchgeführt',
        naechsterTermin: einmalig ? eintrag.naechster_termin : vonHand ? naechsterFest : null,
        ergebnis,
        notiz: ergebnis === 'ok' ? null : notiz,
        pruefer,
        hitze,
        staub,
      });
      for (const f of fotos) await fotoSpeichern(db, { durchfuehrungId: r.durchfuehrungId }, f);
      // Namen merken, wenn noch keiner eingestellt ist
      if (pruefer.trim() && !prueferGespeichert) await prueferSpeichern(db, pruefer);
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
      <View style={s.reihe}>
        <Taste titel="Heute" onPress={() => setDatum(heute())} art="sekundaer" klein style={{ flex: 1 }} />
        <Taste titel="Gestern" onPress={() => setDatum(plusTage(heute(), -1))} art="sekundaer" klein style={{ flex: 1 }} />
      </View>

      <Text style={s.label}>Ergebnis</Text>
      <View style={s.reihe}>
        {ERGEBNISSE.map((e) => {
          const f = ergebnisFarben(e);
          const aktiv = ergebnis === e;
          return (
            <Pressable key={e} onPress={() => setErgebnis(e)}
              style={({ pressed }) => [s.ergebnis, { borderColor: f.vorder }, aktiv && { backgroundColor: f.vorder }, pressed && { opacity: 0.7 }]}>
              <Text style={[s.ergebnisSymbol, { color: aktiv ? '#fff' : f.vorder }]}>{f.symbol}</Text>
              <Text style={[s.ergebnisText, { color: aktiv ? '#fff' : f.vorder }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {ergebnis !== 'ok' ? (
        <VorschlagEingabe
          feld="mangel"
          eintragId={id}
          label="Mangel (kurze Notiz, optional)"
          value={notiz}
          onChangeText={setNotiz}
          placeholder="z. B. Dichtung undicht, Plombe fehlt …"
          mehrzeilig
        />
      ) : null}

      <Text style={s.label}>⏱ Zulagen</Text>
      <StundenWahl symbol="🔥" label="Hitzestunden" wert={hitze} onChange={setHitze} />
      <StundenWahl symbol="🌫" label="Staubstunden" wert={staub} onChange={setStaub} />
      <View style={{ height: groessen.abstand - 10 }} />

      <VorschlagEingabe
        feld="beschreibung"
        eintragId={id}
        label="Was wurde gemacht?"
        value={beschreibung}
        onChangeText={setBeschreibung}
        placeholder="z. B. Sichtprüfung ohne Mängel, Dichtung getauscht …"
        mehrzeilig
      />

      <VorschlagEingabe feld="pruefer" label="Geprüft von" value={pruefer} onChangeText={setPruefer} placeholder="Name des Prüfers" />

      <FotoLeiste titel="Fotos" dateien={fotos} onKamera={() => hinzu(fotosMitKamera)} onGalerie={() => hinzu(fotosAusGalerie)} onLoeschen={(d) => setFotos((f) => f.filter((x) => x !== d))} />

      {einmalig ? (
        <View style={s.info}>
          <Text style={s.infoText}>1× Einmaliger Termin: Nach dem Speichern wandert der Eintrag in „Erledigt“.</Text>
        </View>
      ) : (
        <>
          <DatumFeld
            label="Nächstes Mal fällig am"
            wert={naechster}
            onChange={(d) => setNaechsterFest(d)}
            min={plusTage(datum, 1)}
            hinweis={[
              wochenendHinweis(naechsterFest),
              vonHand
                ? `Von Hand gewählt. Automatisch wäre: ${formatDeutsch(berechnet)} (${intervallText(intervall)}).`
                : `Neue Frist ab Erledigungsdatum: ${intervallText(intervall)}. Antippen, um ein anderes Datum zu wählen.`,
            ].filter(Boolean).join('\n')}
          />
          {vonHand ? (
            <Taste titel="↺ Wieder automatisch" onPress={() => setNaechsterFest(null)} art="sekundaer" klein style={{ marginTop: -6, marginBottom: groessen.abstand }} />
          ) : null}
        </>
      )}

      <Taste titel={laeuft ? 'Speichern …' : '✓ Als erledigt speichern'} onPress={speichern} deaktiviert={laeuft} />
      <Taste titel="Abbrechen" onPress={() => router.back()} art="sekundaer" style={{ marginTop: 10 }} />
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  titel: { fontSize: groessen.titel, fontWeight: '800', color: farben.text, marginBottom: 4 },
  aufgabe: { fontSize: groessen.schrift, color: farben.textLeicht, marginBottom: 20 },
  label: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 6 },
  reihe: { flexDirection: 'row', gap: 10, marginBottom: groessen.abstand },
  ergebnis: { flex: 1, minHeight: 76, borderWidth: 3, borderRadius: groessen.radius, backgroundColor: farben.karte, alignItems: 'center', justifyContent: 'center', padding: 6 },
  ergebnisSymbol: { fontSize: sz(24), fontWeight: '800' },
  ergebnisText: { fontSize: groessen.schriftKlein, fontWeight: '700', textAlign: 'center' },
  info: { backgroundColor: farben.gruenHell, borderRadius: groessen.radius, padding: 14, marginBottom: groessen.abstand },
  infoText: { fontSize: groessen.schrift, color: farben.gruen, fontWeight: '600' },
});
