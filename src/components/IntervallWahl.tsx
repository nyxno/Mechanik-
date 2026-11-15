import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { EINHEITEN, INTERVALL_VORLAGEN, Intervall, IntervallEinheit } from '@/lib/intervall';
import { farben, groessen } from '@/theme';

interface Props {
  wert: Intervall;
  onChange: (i: Intervall) => void;
}

/** Intervall wählen: Schnellauswahl oder Zahl + Einheit. */
export function IntervallWahl({ wert, onChange }: Props) {
  const istGleich = (a: Intervall, b: Intervall) => a.wert === b.wert && a.einheit === b.einheit;
  const [zahlText, setZahlText] = useState(String(wert.wert));
  useEffect(() => { if (parseInt(zahlText, 10) !== wert.wert) setZahlText(wert.wert ? String(wert.wert) : ''); }, [wert.wert]);
  return (
    <View style={s.block}>
      <Text style={s.label}>Intervall</Text>
      <View style={s.chips}>
        {INTERVALL_VORLAGEN.map((v) => {
          const aktiv = istGleich(v.intervall, wert);
          return (
            <Pressable key={v.label} onPress={() => onChange(v.intervall)} style={[s.chip, aktiv && s.chipAktiv]}>
              <Text style={[s.chipText, aktiv && s.chipTextAktiv]}>{v.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.hinweis}>Oder frei eingeben:</Text>
      <View style={s.frei}>
        <Text style={s.alle}>alle</Text>
        <TextInput
          value={zahlText}
          onChangeText={(t) => {
            const nurZiffern = t.replace(/\D/g, '');
            setZahlText(nurZiffern);
            const n = parseInt(nurZiffern, 10);
            onChange({ ...wert, wert: isNaN(n) ? 0 : n });
          }}
          placeholder="Zahl"
          keyboardType="number-pad"
          style={s.zahl}
          selectTextOnFocus
        />
        <View style={s.einheiten}>
          {EINHEITEN.map((e) => {
            const aktiv = e.key === wert.einheit;
            return (
              <Pressable key={e.key} onPress={() => onChange({ ...wert, einheit: e.key as IntervallEinheit })} style={[s.einheit, aktiv && s.chipAktiv]}>
                <Text style={[s.chipText, aktiv && s.chipTextAktiv]}>{e.mehrzahl}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  block: { marginBottom: groessen.abstand },
  label: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: 999, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center' },
  chipAktiv: { backgroundColor: farben.primaer, borderColor: farben.primaer },
  chipText: { fontSize: groessen.schriftKlein, fontWeight: '600', color: farben.text },
  chipTextAktiv: { color: '#fff' },
  hinweis: { marginTop: 12, marginBottom: 6, color: farben.textLeicht, fontSize: groessen.schriftKlein },
  frei: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  alle: { fontSize: groessen.schrift, color: farben.text },
  zahl: { width: 80, minHeight: 56, borderWidth: 2, borderColor: farben.rahmen, borderRadius: 12, backgroundColor: farben.karte, fontSize: groessen.schriftGross, textAlign: 'center', color: farben.text },
  einheiten: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  einheit: { backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, borderRadius: 12, paddingHorizontal: 12, minHeight: 56, justifyContent: 'center' },
});
