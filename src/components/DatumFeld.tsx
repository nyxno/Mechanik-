// Große Taste, die den Kalender bzw. die Uhr von Android öffnet. Kein Tippen nötig.
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ausDate, formatDeutsch, heute, zuDate } from '@/lib/datum';
import { uhrzeitAusDate } from '@/lib/uhrzeit';
import { farben, groessen } from '@/theme';

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

interface Basis {
  label: string;
  hinweis?: string;
  /** Wenn gesetzt, erscheint eine Taste zum Leeren. */
  leerText?: string;
  fehler?: boolean;
}

interface DatumProps extends Basis {
  wert: string | null; // "JJJJ-MM-TT"
  onChange: (iso: string | null) => void;
  min?: string;
  max?: string;
}

interface UhrProps extends Basis {
  wert: string | null; // "HH:MM"
  onChange: (uhrzeit: string | null) => void;
}

function oeffnen(mode: 'date' | 'time', start: Date, onSet: (d: Date) => void, setIos: (v: boolean) => void, min?: Date, max?: Date) {
  if (Platform.OS === 'android') {
    DateTimePickerAndroid.open({
      value: start,
      mode,
      is24Hour: true,
      minimumDate: min,
      maximumDate: max,
      onValueChange: (_e, d) => { if (d) onSet(d); },
    });
  } else {
    setIos(true);
  }
}

export function DatumFeld({ label, hinweis, leerText, fehler, wert, onChange, min, max }: DatumProps) {
  const [ios, setIos] = useState(false);
  const start = wert ? zuDate(wert) : zuDate(heute());
  const anzeige = wert ? `${WOCHENTAGE[zuDate(wert).getDay()]}, ${formatDeutsch(wert)}` : leerText ?? 'Datum wählen';
  const minD = min ? zuDate(min) : undefined;
  const maxD = max ? zuDate(max) : undefined;
  return (
    <Feld label={label} hinweis={hinweis} fehler={fehler} anzeige={anzeige} leer={!wert} symbol="📅"
      onPress={() => oeffnen('date', start, (d) => onChange(ausDate(d)), setIos, minD, maxD)}
      onLeeren={leerText && wert ? () => onChange(null) : undefined}
    >
      {ios ? <DateTimePicker value={start} mode="date" display="inline" minimumDate={minD} maximumDate={maxD}
        onValueChange={(_e, d) => { setIos(false); if (d) onChange(ausDate(d)); }} onDismiss={() => setIos(false)} /> : null}
    </Feld>
  );
}

export function UhrzeitFeld({ label, hinweis, leerText, fehler, wert, onChange }: UhrProps) {
  const [ios, setIos] = useState(false);
  const start = new Date();
  if (wert) { const [h, m] = wert.split(':').map(Number); start.setHours(h, m, 0, 0); } else start.setHours(7, 0, 0, 0);
  return (
    <Feld label={label} hinweis={hinweis} fehler={fehler} anzeige={wert ? `${wert} Uhr` : leerText ?? 'Uhrzeit wählen'} leer={!wert} symbol="🕒"
      onPress={() => oeffnen('time', start, (d) => onChange(uhrzeitAusDate(d)), setIos)}
      onLeeren={leerText && wert ? () => onChange(null) : undefined}
    >
      {ios ? <DateTimePicker value={start} mode="time" is24Hour display="spinner"
        onValueChange={(_e, d) => { setIos(false); if (d) onChange(uhrzeitAusDate(d)); }} onDismiss={() => setIos(false)} /> : null}
    </Feld>
  );
}

function Feld(p: { label: string; hinweis?: string; fehler?: boolean; anzeige: string; leer: boolean; symbol: string; onPress: () => void; onLeeren?: () => void; children?: React.ReactNode }) {
  return (
    <View style={s.block}>
      <Text style={s.label}>{p.label}</Text>
      <View style={s.reihe}>
        <Pressable onPress={p.onPress} android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          style={({ pressed }) => [s.taste, p.fehler && { borderColor: farben.gefahr }, pressed && { opacity: 0.7 }]}>
          <Text style={s.symbol}>{p.symbol}</Text>
          <Text style={[s.wert, p.leer && { color: farben.grau, fontWeight: '500' }]}>{p.anzeige}</Text>
        </Pressable>
        {p.onLeeren ? (
          <Pressable onPress={p.onLeeren} style={({ pressed }) => [s.leeren, pressed && { opacity: 0.7 }]} hitSlop={6}>
            <Text style={s.leerenText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      {p.children}
      {p.hinweis ? <Text style={[s.hinweis, p.fehler && { color: farben.gefahr }]}>{p.hinweis}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  block: { marginBottom: groessen.abstand },
  label: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 6 },
  reihe: { flexDirection: 'row', gap: 8 },
  taste: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: groessen.radius,
    minHeight: groessen.tasteHoehe, paddingHorizontal: 16,
  },
  symbol: { fontSize: 24 },
  wert: { fontSize: groessen.schriftGross, fontWeight: '700', color: farben.text, flexShrink: 1 },
  leeren: { width: groessen.tasteHoehe, minHeight: groessen.tasteHoehe, borderRadius: groessen.radius, backgroundColor: farben.grauHell, alignItems: 'center', justifyContent: 'center' },
  leerenText: { fontSize: 22, fontWeight: '700', color: farben.text },
  hinweis: { marginTop: 4, color: farben.textLeicht, fontSize: groessen.schriftKlein },
});
