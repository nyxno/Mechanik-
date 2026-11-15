// Gemeinsames Formular für "Neuer Eintrag" und "Eintrag bearbeiten".
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Kategorie } from '@/db/typen';
import type { EintragDaten } from '@/db/repo';
import { Intervall, intervallAddieren, istGueltigesIntervall } from '@/lib/intervall';
import { formatDeutsch, heute } from '@/lib/datum';
import { Eingabe } from './Eingabe';
import { DatumFeld, UhrzeitFeld } from './DatumFeld';
import { IntervallWahl } from './IntervallWahl';
import { Taste } from './Taste';
import { FotoLeiste } from './FotoLeiste';
import { farben, groessen } from '@/theme';

export interface FormularErgebnis {
  daten: EintragDaten;
  /** Nur beim Anlegen: optional "zuletzt gemacht am" (ISO). */
  zuletztAm: string | null;
  /** Neu hinzugefügte Fotodateien. */
  neueFotos: string[];
}

interface Props {
  kategorien: Kategorie[];
  /** Standard-Uhrzeit aus den Einstellungen, nur zur Anzeige. */
  standardUhrzeit: string;
  /** Beim Bearbeiten: letzte Durchführung, um den berechneten Termin anzuzeigen. */
  letzteDurchfuehrung?: string | null;
  start?: Partial<EintragDaten>;
  neu: boolean;
  vorhandeneFotos?: string[];
  onFotoLoeschen?: (datei: string) => void;
  onFotoKamera: () => Promise<string[]>;
  onFotoGalerie: () => Promise<string[]>;
  onSpeichern: (e: FormularErgebnis) => Promise<void>;
  onAbbrechen: () => void;
}

export function EintragFormular({ kategorien, standardUhrzeit, letzteDurchfuehrung = null, start, neu, vorhandeneFotos = [], onFotoLoeschen, onFotoKamera, onFotoGalerie, onSpeichern, onAbbrechen }: Props) {
  const [kategorieId, setKategorieId] = useState(start?.kategorie_id ?? kategorien[0]?.id ?? '');
  const [name, setName] = useState(start?.name ?? '');
  const [aufgabe, setAufgabe] = useState(start?.aufgabe ?? '');
  const [intervall, setIntervall] = useState<Intervall>(start?.intervall ?? { wert: 1, einheit: 'jahre' });
  const [zusatzinfo, setZusatzinfo] = useState(start?.zusatzinfo ?? '');
  const [naechster, setNaechster] = useState<string | null>(start?.naechster_termin ?? null);
  const [uhrzeit, setUhrzeit] = useState<string | null>(start?.uhrzeit ?? null);
  const [zuletzt, setZuletzt] = useState<string | null>(null);
  const [neueFotos, setNeueFotos] = useState<string[]>([]);
  const [laeuft, setLaeuft] = useState(false);

  // Was ohne festes Datum herauskäme (nur Anzeige)
  const basis = neu ? zuletzt : letzteDurchfuehrung;
  const berechnet = basis && istGueltigesIntervall(intervall) ? intervallAddieren(basis, intervall) : null;
  const terminHinweis = naechster
    ? 'Fester Termin. Nach der nächsten Durchführung wird wieder mit dem Intervall gerechnet.'
    : berechnet
      ? `Leer = automatisch: ${formatDeutsch(berechnet)} (letzte Durchführung + Intervall)`
      : 'Leer = wird nach der ersten Durchführung aus dem Intervall berechnet.';

  const speichern = async () => {
    if (!name.trim()) return Alert.alert('Name fehlt', 'Bitte gib dem Eintrag einen Namen, z. B. „Therme Halle 2“.');
    if (!kategorieId) return Alert.alert('Kategorie fehlt', 'Bitte wähle eine Kategorie.');
    if (!istGueltigesIntervall(intervall)) return Alert.alert('Intervall ungültig', 'Bitte gib eine Zahl ab 1 ein.');
    setLaeuft(true);
    try {
      await onSpeichern({
        daten: { kategorie_id: kategorieId, name, aufgabe, intervall, zusatzinfo, naechster_termin: naechster, uhrzeit },
        zuletztAm: zuletzt,
        neueFotos,
      });
    } finally {
      setLaeuft(false);
    }
  };

  const fotosHinzu = async (fn: () => Promise<string[]>) => {
    const dateien = await fn();
    if (dateien.length) setNeueFotos((f) => [...f, ...dateien]);
  };

  return (
    <View>
      <Text style={s.label}>Kategorie</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ marginBottom: groessen.abstand }}>
        {kategorien.map((k) => {
          const aktiv = k.id === kategorieId;
          return (
            <Pressable key={k.id} onPress={() => setKategorieId(k.id)} style={[s.chip, aktiv && s.chipAktiv]}>
              <Text style={[s.chipText, aktiv && { color: '#fff' }]}>{k.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Eingabe label="Name" value={name} onChangeText={setName} placeholder="z. B. Therme Halle 2" />
      <Eingabe label="Was ist zu machen?" value={aufgabe} onChangeText={setAufgabe} placeholder="z. B. Sichtprüfung, Brenner reinigen, Abgasmessung" mehrzeilig />
      <IntervallWahl wert={intervall} onChange={setIntervall} />

      {neu ? (
        <DatumFeld
          label="Zuletzt gemacht am (optional)"
          wert={zuletzt}
          onChange={setZuletzt}
          max={heute()}
          leerText="Noch nie / unbekannt"
        />
      ) : null}
      <DatumFeld
        label="Nächstes Mal fällig am"
        wert={naechster}
        onChange={setNaechster}
        leerText={berechnet ? `Automatisch (${formatDeutsch(berechnet)})` : 'Automatisch berechnen'}
        hinweis={terminHinweis}
      />
      <UhrzeitFeld
        label="Uhrzeit der Erinnerung"
        wert={uhrzeit}
        onChange={setUhrzeit}
        leerText={`Standard (${standardUhrzeit} Uhr)`}
        hinweis="Um diese Uhrzeit kommt die Benachrichtigung aufs Handy."
      />

      <Eingabe label="Zusatzinfo" value={zusatzinfo} onChangeText={setZusatzinfo} placeholder="Standort, Typ, Seriennummer, Hinweise …" mehrzeilig />

      <FotoLeiste
        titel="Fotos zum Eintrag"
        dateien={[...vorhandeneFotos, ...neueFotos]}
        onKamera={() => fotosHinzu(onFotoKamera)}
        onGalerie={() => fotosHinzu(onFotoGalerie)}
        onLoeschen={(d) => {
          if (neueFotos.includes(d)) setNeueFotos((f) => f.filter((x) => x !== d));
          else onFotoLoeschen?.(d);
        }}
      />

      <Taste titel={laeuft ? 'Speichern …' : '✓ Speichern'} onPress={speichern} deaktiviert={laeuft} />
      <Taste titel="Abbrechen" onPress={onAbbrechen} art="sekundaer" style={{ marginTop: 10 }} />
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 6 },
  chips: { gap: 8 },
  chip: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: 999, paddingHorizontal: 18, minHeight: 52, justifyContent: 'center' },
  chipAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  chipText: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text },
});
