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
import { useUngespeicherteFotos } from './useUngespeicherteFotos';
import { fotoDateiLoeschen } from '@/lib/fotos';
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
  /** Neue Abteilung (elternId null) oder Unterkategorie anlegen; gibt die neue Id zurück. */
  onNeueKategorie?: (name: string, elternId: string | null) => Promise<string>;
  onFotoGalerie: () => Promise<string[]>;
  onSpeichern: (e: FormularErgebnis) => Promise<void>;
  onAbbrechen: () => void;
}

export function EintragFormular({ onNeueKategorie, kategorien, standardUhrzeit, letzteDurchfuehrung = null, start, neu, vorbilder = [], vorhandeneFotos = [], onFotoLoeschen, onFotoKamera, onFotoGalerie, onSpeichern, onAbbrechen }: Props) {
  // Beim neuen Eintrag nichts vorauswählen (sonst landet man leicht in der falschen Abteilung)
  const [kategorieId, setKategorieId] = useState(start?.kategorie_id ?? (neu ? '' : kategorien[0]?.id ?? ''));
  const [name, setName] = useState(start?.name ?? '');
  const [aufgabe, setAufgabe] = useState(start?.aufgabe ?? '');
  const [intervall, setIntervall] = useState<Intervall>(start?.intervall ?? { wert: 1, einheit: 'jahre' });
  const [zusatzinfo, setZusatzinfo] = useState(start?.zusatzinfo ?? '');
  const [naechster, setNaechster] = useState<string | null>(start?.naechster_termin ?? null);
  const [uhrzeit, setUhrzeit] = useState<string | null>(start?.uhrzeit ?? null);
  const [einmalig, setEinmalig] = useState<boolean>(start?.einmalig ?? false);
  const [zuletzt, setZuletzt] = useState<string | null>(null);
  // Beim Anlegen mit Intervall: erster Termin steht immer da (änderbar). Von Hand gewählt -> nicht mehr automatisch anpassen.
  const [terminVonHand, setTerminVonHand] = useState(!neu || !!start?.naechster_termin);
  const [neueFotos, setNeueFotos] = useState<string[]>([]);
  const fotosGespeichert = useUngespeicherteFotos(neueFotos);
  const [laeuft, setLaeuft] = useState(false);
  const [neueAbt, setNeueAbt] = useState<string | null>(null);
  const [neueUnter, setNeueUnter] = useState<string | null>(null);
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
  // Unterkategorien: erst Hauptkategorie wählen, darunter erscheinen ihre Unterkategorien
  const haupt = kategorien.filter((k) => !k.eltern_id || !kategorien.some((x) => x.id === k.eltern_id));
  const gewaehlt = kategorien.find((k) => k.id === kategorieId);
  const hauptId = gewaehlt ? (haupt.some((h) => h.id === gewaehlt.id) ? gewaehlt.id : gewaehlt.eltern_id) : null;
  const unter = hauptId ? kategorien.filter((k) => k.eltern_id === hauptId) : [];
  useEffect(() => {
    if (!neu || terminVonHand) return;
    if (einmalig) { if (!naechster) setNaechster(heuteOderMontag(heute())); return; }
    setNaechster(zuletzt && istGueltigesIntervall(intervall) ? aufWerktag(intervallAddieren(zuletzt, intervall)) : heuteOderMontag(heute()));
  }, [neu, terminVonHand, einmalig, zuletzt, intervall.wert, intervall.einheit]);

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
    if (!kategorieId) return Alert.alert('Abteilung fehlt', 'Bitte wähle eine Abteilung oder lege mit „＋ Neue Abteilung“ eine an.');
    if (!einmalig && !istGueltigesIntervall(intervall)) return Alert.alert('Intervall ungültig', 'Bitte gib eine Zahl ab 1 ein.');
    if (einmalig && !naechster) return Alert.alert('Datum fehlt', 'Bei „Einmalig“ bitte eingeben, wann es fällig ist.');
    setLaeuft(true);
    // Vor dem Speichern als "behalten" markieren: nach dem Speichern wechselt die Seite sofort
    fotosGespeichert();
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
      <Text style={s.label}>1. Abteilung</Text>
      <View style={s.chipsWrap}>
        {haupt.map((k) => (
          <KatChip key={k.id} k={k} aktiv={k.id === hauptId} text={k.name}
            onPress={() => { setKategorieId(k.id); setKategorieVonHand(true); setNeueUnter(null); }} />
        ))}
        {onNeueKategorie ? (
          <Pressable onPress={() => setNeueAbt(neueAbt === null ? '' : null)} style={[s.chip, s.chipNeu]}>
            <Text style={s.chipText}>＋ Neue Abteilung</Text>
          </Pressable>
        ) : null}
      </View>
      {neueAbt !== null ? (
        <NeuZeile wert={neueAbt} setWert={setNeueAbt} platzhalter="z. B. KE, HE" onAnlegen={async () => {
          const id = await onNeueKategorie!(neueAbt, null);
          setKategorieId(id); setKategorieVonHand(true); setNeueAbt(null);
        }} />
      ) : null}

      {hauptId ? (
        <>
          <Text style={s.label}>2. Unterkategorie (optional)</Text>
          <View style={s.chipsWrap}>
            <Pressable onPress={() => { setKategorieId(hauptId); setKategorieVonHand(true); }}
              style={[s.chip, kategorieId === hauptId && s.chipAktivGrau]}>
              <Text style={[s.chipText, kategorieId === hauptId && { color: '#fff' }]}>Ohne</Text>
            </Pressable>
            {unter.map((k) => (
              <KatChip key={k.id} k={k} aktiv={k.id === kategorieId} text={k.name}
                onPress={() => { setKategorieId(k.id); setKategorieVonHand(true); }} />
            ))}
            {onNeueKategorie ? (
              <Pressable onPress={() => setNeueUnter(neueUnter === null ? '' : null)} style={[s.chip, s.chipNeu]}>
                <Text style={s.chipText}>＋ Neue Unterkategorie</Text>
              </Pressable>
            ) : null}
          </View>
          {neueUnter !== null ? (
            <NeuZeile wert={neueUnter} setWert={setNeueUnter} platzhalter="z. B. Kühlturm, Pumpe" onAnlegen={async () => {
              const id = await onNeueKategorie!(neueUnter, hauptId);
              setKategorieId(id); setKategorieVonHand(true); setNeueUnter(null);
            }} />
          ) : null}
        </>
      ) : null}
      <View style={{ height: 8 }} />

      <Eingabe label="Name" value={name} onChangeText={setName} placeholder="z. B. Therme Halle 2" />
      {vorschlag && vorschlagKategorie ? (
        <View style={s.vorschlag}>
          <Text style={s.vorschlagText}>
            💡 {kategorieVonHand ? 'Passt vermutlich zu' : 'Automatisch zugeordnet:'} <Text style={{ fontWeight: '800', color: vorschlagKategorie.farbe ?? farben.primaer }}>{vorschlagKategorie.name}</Text>
            {vorschlag.vorbild ? ` (wie „${vorschlag.vorbild}“)` : ''}
          </Text>
          {kategorieVonHand && kategorieId !== vorschlag.kategorie_id ? (
            <Taste titel={`${vorschlagKategorie.name} wählen`} onPress={() => setKategorieId(vorschlag.kategorie_id)} art="sekundaer" klein />
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
        label={einmalig ? 'Fällig am' : neu ? 'Erstes Mal fällig am' : 'Nächstes Mal fällig am'}
        wert={naechster}
        onChange={(d) => { setNaechster(d); setTerminVonHand(true); }}
        leerText={neu ? undefined : einmalig ? 'Datum wählen' : berechnet ? `Automatisch (${formatDeutsch(berechnet)})` : 'Automatisch berechnen'}
        hinweis={[
          wochenende,
          neu && !einmalig
            ? `📅 Antippen, um das Datum zu ändern. Danach gilt das Intervall (${intervallText(intervall)}) ab der jeweiligen Erledigung.`
            : terminHinweis,
        ].filter(Boolean).join('\n')}
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
          if (neueFotos.includes(d)) { fotoDateiLoeschen(d); setNeueFotos((f) => f.filter((x) => x !== d)); }
          else onFotoLoeschen?.(d);
        }}
      />

      <Taste titel={laeuft ? 'Speichern …' : '✓ Speichern'} onPress={speichern} deaktiviert={laeuft} />
      <Taste titel="Abbrechen" onPress={onAbbrechen} art="sekundaer" style={{ marginTop: 10 }} />
    </View>
  );
}

const s = StyleSheet.create({
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chipNeu: { borderStyle: 'dashed', borderColor: farben.primaer },
  chipAktivGrau: { backgroundColor: farben.grau, borderColor: farben.grau },
  neuZeile: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
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

function KatChip({ k, aktiv, text, onPress }: { k: Kategorie; aktiv: boolean; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}
      style={[s.chip, k.farbe ? { borderColor: k.farbe } : null, aktiv && { backgroundColor: k.farbe ?? farben.primaer, borderColor: k.farbe ?? farben.primaer }]}>
      <Text style={[s.chipText, aktiv && { color: textFarbe(k.farbe ?? farben.primaer) }]}>{text}</Text>
    </Pressable>
  );
}

/** Eingabezeile zum schnellen Anlegen einer Abteilung / Unterkategorie. */
function NeuZeile({ wert, setWert, platzhalter, onAnlegen }: { wert: string; setWert: (t: string) => void; platzhalter: string; onAnlegen: () => Promise<void> }) {
  return (
    <View style={s.neuZeile}>
      <View style={{ flex: 1 }}>
        <Eingabe label="Name" value={wert} onChangeText={setWert} placeholder={platzhalter} autoFocus onSubmitEditing={() => { if (wert.trim()) onAnlegen(); }} returnKeyType="done" />
      </View>
      <Taste titel="＋" onPress={() => { if (wert.trim()) onAnlegen(); }} deaktiviert={!wert.trim()} style={{ width: 64, marginTop: 30 }} />
    </View>
  );
}
