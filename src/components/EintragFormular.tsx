// Gemeinsames Formular für "Neuer Eintrag" und "Eintrag bearbeiten".
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Kategorie } from '@/db/typen';
import type { EintragDaten } from '@/db/repo';
import { Intervall, intervallAddieren, istGueltigesIntervall } from '@/lib/intervall';
import { aufWerktag, formatDeutsch, formatMitTag, heute, heuteOderMontag, wochentag } from '@/lib/datum';
import { textFarbe } from '@/lib/farben';
import { Eingabe } from './Eingabe';
import { DatumFeld, UhrzeitFeld } from './DatumFeld';
import { IntervallWahl } from './IntervallWahl';
import { VorschlagEingabe } from './Vorschlaege';
import { intervallText } from '@/lib/intervall';
import { VorbildEintrag, zuordnungVorschlag } from '@/lib/muster';
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
  /** Vorhandene Einträge, aus denen die App beim Anlegen Gebiet und Intervall ableitet. */
  vorbilder?: VorbildEintrag[];
  vorhandeneFotos?: string[];
  onFotoLoeschen?: (datei: string) => void;
  onFotoKamera: () => Promise<string[]>;
  onFotoGalerie: () => Promise<string[]>;
  onSpeichern: (e: FormularErgebnis) => Promise<void>;
  onAbbrechen: () => void;
}

export function EintragFormular({ kategorien, standardUhrzeit, letzteDurchfuehrung = null, start, neu, vorbilder = [], vorhandeneFotos = [], onFotoLoeschen, onFotoKamera, onFotoGalerie, onSpeichern, onAbbrechen }: Props) {
  const [kategorieId, setKategorieId] = useState(start?.kategorie_id ?? kategorien[0]?.id ?? '');
  const [name, setName] = useState(start?.name ?? '');
  const [aufgabe, setAufgabe] = useState(start?.aufgabe ?? '');
  const [intervall, setIntervall] = useState<Intervall>(start?.intervall ?? { wert: 1, einheit: 'jahre' });
  const [zusatzinfo, setZusatzinfo] = useState(start?.zusatzinfo ?? '');
  const [naechster, setNaechster] = useState<string | null>(start?.naechster_termin ?? null);
  const [uhrzeit, setUhrzeit] = useState<string | null>(start?.uhrzeit ?? null);
  const [einmalig, setEinmalig] = useState<boolean>(start?.einmalig ?? false);
  const [zuletzt, setZuletzt] = useState<string | null>(null);
  const [neueFotos, setNeueFotos] = useState<string[]>([]);
  const [laeuft, setLaeuft] = useState(false);
  // Automatische Zuordnung: nur beim Anlegen und solange das Gebiet nicht von Hand gewählt wurde
  const [kategorieVonHand, setKategorieVonHand] = useState(!neu || !!start?.kategorie_id);
  const [vorschlagUebernommen, setVorschlagUebernommen] = useState(false);
  const vorschlag = useMemo(
    () => (neu && name.trim().length >= 3 ? zuordnungVorschlag(name, vorbilder, kategorien) : null),
    [neu, name, vorbilder, kategorien],
  );
  useEffect(() => {
    if (vorschlag && !kategorieVonHand) setKategorieId(vorschlag.kategorie_id);
    setVorschlagUebernommen(false);
  }, [vorschlag?.kategorie_id, vorschlag?.vorbild]);
  // "Einmalig" gewählt und noch kein Datum: heute eintragen (Sa/So -> Montag)
  const einmaligSetzen = (e: boolean) => {
    setEinmalig(e);
    if (e && !naechster) setNaechster(heuteOderMontag(heute()));
  };
  const vorschlagKategorie = vorschlag ? kategorien.find((k) => k.id === vorschlag.kategorie_id) : null;
  const mehrUebernehmbar = !!vorschlag && (vorschlag.einmalig || !!vorschlag.intervall || !!vorschlag.aufgabe) && !vorschlagUebernommen;

  // Was ohne festes Datum herauskäme (nur Anzeige)
  const basis = neu ? zuletzt : letzteDurchfuehrung;
  const berechnet = !einmalig && basis && istGueltigesIntervall(intervall) ? aufWerktag(intervallAddieren(basis, intervall)) : null;
  const terminHinweis = einmalig
    ? 'Pflichtfeld bei „Einmalig“.'
    : naechster
      ? 'Fester Termin. Nach der nächsten Durchführung startet die neue Frist ab dem Erledigungsdatum.'
      : berechnet
        ? `Leer = automatisch: ${formatDeutsch(berechnet)} (letzte Durchführung + Intervall)`
        : 'Leer = wird nach der ersten Durchführung aus dem Intervall berechnet.';
  const wochenende = wochenendHinweis(naechster);

  const speichern = async () => {
    if (!name.trim()) return Alert.alert('Name fehlt', 'Bitte gib dem Eintrag einen Namen, z. B. „Therme Halle 2“.');
    if (!kategorieId) return Alert.alert('Kategorie fehlt', 'Bitte wähle eine Kategorie.');
    if (!einmalig && !istGueltigesIntervall(intervall)) return Alert.alert('Intervall ungültig', 'Bitte gib eine Zahl ab 1 ein.');
    if (einmalig && !naechster) return Alert.alert('Datum fehlt', 'Bei „Einmalig“ bitte eingeben, wann es fällig ist.');
    setLaeuft(true);
    try {
      await onSpeichern({
        daten: {
          kategorie_id: kategorieId, name, aufgabe, zusatzinfo, naechster_termin: naechster, uhrzeit, einmalig,
          intervall: istGueltigesIntervall(intervall) ? intervall : { wert: 1, einheit: 'jahre' },
        },
        zuletztAm: einmalig ? null : zuletzt,
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
            <Pressable key={k.id} onPress={() => { setKategorieId(k.id); setKategorieVonHand(true); }}
              style={[s.chip, k.farbe ? { borderColor: k.farbe } : null, aktiv && { backgroundColor: k.farbe ?? farben.primaer, borderColor: k.farbe ?? farben.primaer }]}>
              <Text style={[s.chipText, aktiv && { color: textFarbe(k.farbe ?? farben.primaer) }]}>{k.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Eingabe label="Name" value={name} onChangeText={setName} placeholder="z. B. Therme Halle 2" />
      {vorschlag && vorschlagKategorie ? (
        <View style={s.vorschlag}>
          <Text style={s.vorschlagText}>
            💡 {kategorieVonHand ? 'Passt vermutlich zu' : 'Automatisch zugeordnet:'} <Text style={{ fontWeight: '800', color: vorschlagKategorie.farbe ?? farben.primaer }}>{vorschlagKategorie.name}</Text>
            {vorschlag.vorbild ? ` (wie „${vorschlag.vorbild}“)` : ''}
          </Text>
          {kategorieVonHand && kategorieId !== vorschlag.kategorie_id ? (
            <Taste titel={`Gebiet ${vorschlagKategorie.name} wählen`} onPress={() => setKategorieId(vorschlag.kategorie_id)} art="sekundaer" klein />
          ) : null}
          {mehrUebernehmbar ? (
            <Taste
              titel={`Auch übernehmen: ${vorschlag.einmalig ? 'einmalig' : vorschlag.intervall ? intervallText(vorschlag.intervall) : ''}${vorschlag.aufgabe ? ' + Aufgabe' : ''}`}
              onPress={() => {
                setKategorieId(vorschlag.kategorie_id);
                if (vorschlag.einmalig) einmaligSetzen(true);
                else if (vorschlag.intervall) { setEinmalig(false); setIntervall(vorschlag.intervall); }
                if (vorschlag.aufgabe && !aufgabe.trim()) setAufgabe(vorschlag.aufgabe);
                setVorschlagUebernommen(true);
              }}
              art="sekundaer" klein
            />
          ) : null}
        </View>
      ) : null}
      <VorschlagEingabe feld="aufgabe" label="Was ist zu machen?" value={aufgabe} onChangeText={setAufgabe} placeholder="z. B. Sichtprüfung, Brenner reinigen, Abgasmessung" mehrzeilig />
      <IntervallWahl wert={intervall} onChange={setIntervall} einmalig={einmalig} onEinmaligChange={einmaligSetzen} />

      {neu && !einmalig ? (
        <DatumFeld
          label="Zuletzt gemacht am (optional)"
          wert={zuletzt}
          onChange={setZuletzt}
          max={heute()}
          leerText="Noch nie / unbekannt"
        />
      ) : null}
      <DatumFeld
        label={einmalig ? 'Fällig am' : 'Nächstes Mal fällig am'}
        wert={naechster}
        onChange={setNaechster}
        leerText={einmalig ? 'Datum wählen' : berechnet ? `Automatisch (${formatDeutsch(berechnet)})` : 'Automatisch berechnen'}
        hinweis={wochenende ? `${wochenende}\n${terminHinweis}` : terminHinweis}
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
  vorschlag: { backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#BFDBFE', borderRadius: groessen.radius, padding: 12, gap: 8, marginTop: -6, marginBottom: groessen.abstand },
  vorschlagText: { fontSize: groessen.schrift, color: farben.text },
  label: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 6 },
  chips: { gap: 8 },
  chip: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: 999, paddingHorizontal: 18, minHeight: 52, justifyContent: 'center' },
  chipAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  chipText: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text },
});

/** Hinweis, wenn ein Datum aufs Wochenende fällt (Sa -> Fr, So -> Mo). */
export function wochenendHinweis(iso: string | null): string | null {
  if (!iso) return null;
  const t = wochentag(iso);
  if (t !== 6 && t !== 0) return null;
  return `⚠ Fällt auf ${t === 6 ? 'Samstag' : 'Sonntag'} – Termin wird ${formatMitTag(aufWerktag(iso))}.`;
}
