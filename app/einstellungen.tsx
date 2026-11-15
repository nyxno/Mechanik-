// Einstellungen für Erinnerungen: an/aus, Standard-Uhrzeit, Vorwarnung, Test mit Signalton.
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { einstellungenLaden, einstellungenSpeichern } from '@/db/repo';
import type { ErinnerungsEinstellungen } from '@/lib/erinnerungsplan';
import { berechtigungAnfragen, berechtigungStatus, erinnerungenNeuPlanen, genaueUhrzeitErlauben, testErinnerung } from '@/lib/erinnerungen';
import { Bildschirm } from '@/components/Bildschirm';
import { UhrzeitFeld } from '@/components/DatumFeld';
import { Taste } from '@/components/Taste';
import { farben, groessen } from '@/theme';

const VORWARNUNG = [
  { tage: 0, text: 'Nur am Tag' },
  { tage: 1, text: '1 Tag vorher' },
  { tage: 3, text: '3 Tage vorher' },
  { tage: 7, text: '1 Woche vorher' },
  { tage: 14, text: '2 Wochen vorher' },
  { tage: 30, text: '1 Monat vorher' },
];

export default function Einstellungen() {
  const db = useSQLiteContext();
  const [e, setE] = useState<ErinnerungsEinstellungen | null>(null);
  const [status, setStatus] = useState<{ erlaubt: boolean; genau: boolean } | null>(null);
  const [geplant, setGeplant] = useState<number | null>(null);

  const laden = useCallback(async () => {
    setE(await einstellungenLaden(db));
    setStatus(await berechtigungStatus());
    setGeplant(await erinnerungenNeuPlanen(db));
  }, [db]);
  useFocusEffect(useCallback(() => { laden(); }, [laden]));

  const aendern = async (neu: ErinnerungsEinstellungen) => {
    setE(neu);
    await einstellungenSpeichern(db, neu);
    setGeplant(await erinnerungenNeuPlanen(db));
  };

  if (!e || !status) return null;

  return (
    <Bildschirm>
      {!status.erlaubt ? (
        <View style={[s.box, s.warnung]}>
          <Text style={s.boxTitel}>⚠ Benachrichtigungen sind nicht erlaubt</Text>
          <Text style={s.boxText}>Ohne Erlaubnis kann die App dich nicht erinnern.</Text>
          <Taste titel="Erlauben" klein onPress={async () => {
            const ok = await berechtigungAnfragen();
            if (!ok) {
              Alert.alert('Bitte in den Einstellungen erlauben', 'Android fragt nicht mehr nach. Öffne die App-Einstellungen und schalte „Benachrichtigungen“ ein.', [
                { text: 'Abbrechen', style: 'cancel' },
                { text: 'Einstellungen öffnen', onPress: () => Linking.openSettings() },
              ]);
            }
            laden();
          }} />
        </View>
      ) : null}

      <Text style={s.label}>Erinnerungen</Text>
      <View style={s.reihe}>
        <Wahl aktiv={e.aktiv} text="🔔 An" onPress={() => aendern({ ...e, aktiv: true })} />
        <Wahl aktiv={!e.aktiv} text="🔕 Aus" onPress={() => aendern({ ...e, aktiv: false })} />
      </View>

      <UhrzeitFeld
        label="Standard-Uhrzeit"
        wert={e.uhrzeit}
        onChange={(u) => u && aendern({ ...e, uhrzeit: u })}
        hinweis="Gilt für alle Einträge ohne eigene Uhrzeit, und für die Meldung über Überfälliges."
      />

      <Text style={s.label}>Vorwarnung</Text>
      <View style={[s.reihe, { flexWrap: 'wrap', marginBottom: 6 }]}>
        {VORWARNUNG.map((v) => (
          <Wahl key={v.tage} aktiv={e.vorwarnTage === v.tage} text={v.text} onPress={() => aendern({ ...e, vorwarnTage: v.tage })} />
        ))}
      </View>
      <Text style={s.hinweis}>Du bekommst eine Meldung zur Vorwarnung und eine am Tag der Fälligkeit.</Text>

      <View style={s.box}>
        <Text style={s.boxTitel}>Ton testen</Text>
        <Text style={s.boxText}>Taste drücken, Handy sperren – nach 5 Sekunden kommt die Meldung mit dem Signalton.</Text>
        <Taste titel="🔊 Test-Erinnerung" klein onPress={async () => {
          const ok = await testErinnerung(5);
          if (!ok) Alert.alert('Nicht erlaubt', 'Bitte zuerst Benachrichtigungen erlauben.');
          laden();
        }} />
      </View>

      {status.erlaubt && !status.genau ? (
        <View style={[s.box, s.warnung]}>
          <Text style={s.boxTitel}>Pünktliche Erinnerungen</Text>
          <Text style={s.boxText}>
            Android kann Meldungen zum Stromsparen etwas verzögern. Wenn du „Wecker und Erinnerungen“ erlaubst, kommen sie auf die Minute genau.
          </Text>
          <Taste titel="Genaue Uhrzeit erlauben" klein onPress={async () => { await genaueUhrzeitErlauben(); laden(); }} />
        </View>
      ) : null}

      <Text style={s.hinweis}>
        {e.aktiv && status.erlaubt ? `Geplante Erinnerungen: ${geplant ?? '…'}` : 'Keine Erinnerungen geplant.'}
      </Text>
      <Pressable onPress={() => Linking.openSettings()} style={{ paddingVertical: 14 }}>
        <Text style={s.link}>Ton oder Lautstärke ändern → Android-Einstellungen der App</Text>
      </Pressable>
    </Bildschirm>
  );
}

function Wahl({ aktiv, text, onPress }: { aktiv: boolean; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.wahl, aktiv && s.wahlAktiv, pressed && { opacity: 0.7 }]}>
      <Text style={[s.wahlText, aktiv && { color: '#fff' }]}>{text}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  label: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 6 },
  reihe: { flexDirection: 'row', gap: 8, marginBottom: groessen.abstand },
  wahl: { flexGrow: 1, minHeight: 56, paddingHorizontal: 16, borderRadius: groessen.radius, borderWidth: 2, borderColor: farben.rahmen, backgroundColor: farben.karte, alignItems: 'center', justifyContent: 'center' },
  wahlAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  wahlText: { fontSize: groessen.schrift, fontWeight: '700', color: farben.text },
  hinweis: { color: farben.textLeicht, fontSize: groessen.schriftKlein, marginBottom: groessen.abstand },
  box: { backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 16, gap: 10, marginBottom: groessen.abstand },
  warnung: { backgroundColor: farben.gelbHell, borderWidth: 2, borderColor: farben.gelb },
  boxTitel: { fontSize: groessen.schrift, fontWeight: '700', color: farben.text },
  boxText: { fontSize: groessen.schriftKlein, color: farben.text, lineHeight: 22 },
  link: { color: farben.primaer, fontSize: groessen.schriftKlein, fontWeight: '600' },
});
