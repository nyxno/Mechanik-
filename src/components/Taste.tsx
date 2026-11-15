import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { farben, groessen } from '@/theme';

type Art = 'primaer' | 'sekundaer' | 'gefahr';

interface Props {
  titel: string;
  onPress: () => void;
  art?: Art;
  klein?: boolean;
  deaktiviert?: boolean;
  style?: ViewStyle;
}

/** Große, gut treffbare Taste. */
export function Taste({ titel, onPress, art = 'primaer', klein, deaktiviert, style }: Props) {
  const hinter = art === 'primaer' ? farben.primaer : art === 'gefahr' ? farben.gefahr : farben.karte;
  const vorder = art === 'sekundaer' ? farben.text : farben.primaerText;
  return (
    <Pressable
      onPress={onPress}
      disabled={deaktiviert}
      android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
      style={({ pressed }) => [
        s.taste,
        { backgroundColor: hinter, minHeight: klein ? groessen.tasteHoeheKlein : groessen.tasteHoehe },
        art === 'sekundaer' && s.rahmen,
        (pressed || deaktiviert) && { opacity: 0.6 },
        style,
      ]}
    >
      <Text style={[s.text, { color: vorder, fontSize: klein ? groessen.schrift : groessen.schriftGross }]}>{titel}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  taste: {
    borderRadius: groessen.radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  rahmen: { borderWidth: 2, borderColor: farben.rahmen },
  text: { fontWeight: '700', textAlign: 'center' },
});
