import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { farben, groessen } from '@/theme';

/** Einheitlicher Seitenrahmen: Hintergrund, Rand, scrollbar, Tastatur schiebt Inhalt hoch. */
export function Bildschirm({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const inhalt = scroll ? (
    <ScrollView contentContainerStyle={s.inhalt} keyboardShouldPersistTaps="handled">{children}</ScrollView>
  ) : (
    <View style={[s.inhalt, { flex: 1 }]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView style={s.seite} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {inhalt}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  seite: { flex: 1, backgroundColor: farben.hintergrund },
  inhalt: { padding: groessen.abstand, paddingBottom: 48 },
});
