import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { farben, groessen } from '@/theme';

interface Props extends TextInputProps {
  label: string;
  hinweis?: string;
  mehrzeilig?: boolean;
}

/** Textfeld mit Beschriftung, groß genug für Handschuhe. */
export function Eingabe({ label, hinweis, mehrzeilig, style, ...rest }: Props) {
  return (
    <View style={s.block}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        {...rest}
        multiline={mehrzeilig}
        placeholderTextColor={farben.grau}
        style={[s.feld, mehrzeilig && s.mehrzeilig, style]}
      />
      {hinweis ? <Text style={s.hinweis}>{hinweis}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  block: { marginBottom: groessen.abstand },
  label: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 6 },
  feld: {
    backgroundColor: farben.karte,
    borderWidth: 2,
    borderColor: farben.rahmen,
    borderRadius: groessen.radius,
    paddingHorizontal: 16,
    minHeight: groessen.tasteHoehe,
    fontSize: groessen.schrift,
    color: farben.text,
  },
  mehrzeilig: { minHeight: 120, paddingTop: 14, textAlignVertical: 'top' },
  hinweis: { marginTop: 4, color: farben.textLeicht, fontSize: groessen.schriftKlein },
});
