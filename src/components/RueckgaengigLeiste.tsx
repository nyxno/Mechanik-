// Kurz eingeblendete Leiste "✓ Erledigt – Rückgängig" nach dem Schnell-Abhaken.
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { farben, groessen } from '@/theme';

interface Props {
  text: string | null;
  onRueckgaengig: () => void;
  onAblauf: () => void;
  sekunden?: number;
  unten: number;
  /** Optionale zweite Taste, z. B. "⏱ Zulagen". */
  zweite?: { text: string; onPress: () => void };
}

export function RueckgaengigLeiste({ text, onRueckgaengig, onAblauf, sekunden = 8, unten, zweite }: Props) {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(onAblauf, sekunden * 1000);
    return () => clearTimeout(t);
  }, [text, onAblauf, sekunden]);
  if (!text) return null;
  return (
    <View style={[s.leiste, { bottom: unten }]}>
      <Text style={s.text} numberOfLines={2}>{text}</Text>
      <View style={s.tasten}>
        {zweite ? (
          <Pressable onPress={zweite.onPress} style={({ pressed }) => [s.taste, s.zweite, pressed && { opacity: 0.7 }]} hitSlop={6}>
            <Text style={[s.tasteText, { color: '#fff' }]}>{zweite.text}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onRueckgaengig} style={({ pressed }) => [s.taste, pressed && { opacity: 0.7 }]} hitSlop={6}>
          <Text style={s.tasteText}>↺ Rückgängig</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  leiste: {
    position: 'absolute', left: groessen.abstand, right: groessen.abstand,
    backgroundColor: '#111827', borderRadius: groessen.radius, padding: 12, paddingLeft: 16,
    gap: 10, elevation: 6,
  },
  tasten: { flexDirection: 'row', gap: 10 },
  text: { color: '#fff', fontSize: groessen.schrift, fontWeight: '600' },
  taste: { flex: 1, backgroundColor: '#FBBF24', borderRadius: 10, paddingHorizontal: 14, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  zweite: { backgroundColor: '#EA580C' },
  tasteText: { color: '#111827', fontSize: groessen.schrift, fontWeight: '800' },
});
