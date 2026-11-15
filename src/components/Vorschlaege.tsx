// Lernende Vorschläge: große Tasten unter einem Eingabefeld mit dem, was früher oft geschrieben wurde.
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { vorschlaegeLaden, vorschlagLoeschen, VorschlagFeld } from '@/db/repo';
import { farben, groessen } from '@/theme';
import { Eingabe } from './Eingabe';

interface LeisteProps {
  feld: VorschlagFeld;
  eingabe: string;
  eintragId?: string;
  sichtbar: boolean;
  onWahl: (text: string) => void;
}

export function VorschlagLeiste({ feld, eingabe, eintragId, sichtbar, onWahl }: LeisteProps) {
  const db = useSQLiteContext();
  const [liste, setListe] = useState<string[]>([]);
  const [neuLaden, setNeuLaden] = useState(0);

  useEffect(() => {
    if (!sichtbar) return;
    let aktiv = true;
    vorschlaegeLaden(db, feld, eingabe, eintragId).then((l) => { if (aktiv) setListe(l); });
    return () => { aktiv = false; };
  }, [db, feld, eingabe, eintragId, sichtbar, neuLaden]);

  if (!sichtbar || liste.length === 0) return null;
  return (
    <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false} contentContainerStyle={s.reihe} style={s.leiste}>
      {liste.map((t) => (
        <Pressable
          key={t}
          onPress={() => onWahl(t)}
          onLongPress={() => Alert.alert('Vorschlag löschen?', `„${t}“ wird nicht mehr vorgeschlagen.`, [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Löschen', style: 'destructive', onPress: async () => { await vorschlagLoeschen(db, feld, t); setNeuLaden((n) => n + 1); } },
          ])}
          style={({ pressed }) => [s.chip, pressed && { opacity: 0.6 }]}
        >
          <Text style={s.text} numberOfLines={2}>💡 {t}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

type EingabeProps = React.ComponentProps<typeof Eingabe> & {
  feld: VorschlagFeld;
  eintragId?: string;
  value: string;
  onChangeText: (t: string) => void;
};

/** Eingabefeld mit lernenden Vorschlägen darunter (erscheinen beim Antippen des Feldes). */
export function VorschlagEingabe({ feld, eintragId, value, onChangeText, onFocus, onBlur, ...rest }: EingabeProps) {
  const [fokus, setFokus] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <View>
      <Eingabe
        {...rest}
        value={value}
        onChangeText={onChangeText}
        onFocus={(e) => { if (timer.current) clearTimeout(timer.current); setFokus(true); onFocus?.(e); }}
        // Kurz warten, damit ein Tipp auf einen Vorschlag noch ankommt
        onBlur={(e) => { timer.current = setTimeout(() => setFokus(false), 250); onBlur?.(e); }}
      />
      <VorschlagLeiste feld={feld} eingabe={value} eintragId={eintragId} sichtbar={fokus} onWahl={onChangeText} />
    </View>
  );
}

const s = StyleSheet.create({
  leiste: { marginTop: -8, marginBottom: groessen.abstand },
  reihe: { gap: 8 },
  chip: {
    maxWidth: 260, minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#BFDBFE', borderRadius: 12,
  },
  text: { fontSize: groessen.schriftKlein, fontWeight: '600', color: farben.primaer },
});
