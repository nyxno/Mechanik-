// Zulagenstunden schnell eintragen: große Tasten statt Tippen.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { stundenText } from '@/lib/statistik';
import { farben, groessen, sz } from '@/theme';

interface Props {
  symbol: string;
  label: string;
  wert: number;
  onChange: (n: number) => void;
}

const SCHRITTE = [-0.5, 0.5, 1, 2];

export function StundenWahl({ symbol, label, wert, onChange }: Props) {
  return (
    <View style={s.block}>
      <View style={s.kopf}>
        <Text style={s.label}>{symbol} {label}</Text>
        <Text style={[s.wert, wert === 0 && { color: farben.grau }]}>{stundenText(wert)}</Text>
      </View>
      <View style={s.reihe}>
        {SCHRITTE.map((x) => (
          <Pressable key={x} onPress={() => onChange(Math.max(0, Math.min(24, wert + x)))} disabled={x < 0 && wert <= 0}
            style={({ pressed }) => [s.taste, x < 0 && s.minus, x < 0 && wert <= 0 && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}>
            <Text style={s.tasteText}>{x < 0 ? '−½' : `＋${x === 0.5 ? '½' : x}`}</Text>
          </Pressable>
        ))}
        {wert > 0 ? (
          <Pressable onPress={() => onChange(0)} style={({ pressed }) => [s.taste, s.minus, pressed && { opacity: 0.6 }]}>
            <Text style={s.tasteText}>0</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  block: { backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 12, marginBottom: 10 },
  kopf: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: groessen.schrift, fontWeight: '700', color: farben.text },
  wert: { fontSize: groessen.schriftGross, fontWeight: '800', color: farben.text },
  reihe: { flexDirection: 'row', gap: 8 },
  taste: { flex: 1, minHeight: groessen.tasteHoeheKlein, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center' },
  minus: { backgroundColor: farben.grauHell, borderColor: farben.rahmen },
  tasteText: { fontSize: sz(20), fontWeight: '800', color: farben.text },
});
