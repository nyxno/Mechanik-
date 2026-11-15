import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { fotoUri } from '@/lib/fotos';
import { farben, groessen } from '@/theme';
import { Taste } from './Taste';

interface Props {
  dateien: string[];
  onKamera?: () => void;
  onGalerie?: () => void;
  onLoeschen?: (datei: string) => void;
  onAnsehen?: (datei: string) => void;
  titel?: string;
}

/** Zeigt Fotos als Vorschau-Reihe, optional mit Tasten zum Hinzufügen und Löschen. */
export function FotoLeiste({ dateien, onKamera, onGalerie, onLoeschen, onAnsehen, titel }: Props) {
  const loeschen = (datei: string) => {
    if (!onLoeschen) return;
    Alert.alert('Foto löschen?', 'Das Foto wird entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => onLoeschen(datei) },
    ]);
  };
  return (
    <View style={s.block}>
      {titel ? <Text style={s.titel}>{titel}</Text> : null}
      {dateien.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.reihe}>
          {dateien.map((d) => (
            <Pressable key={d} onPress={() => onAnsehen?.(d)} onLongPress={() => loeschen(d)} style={s.bildRahmen}>
              <Image source={{ uri: fotoUri(d) }} style={s.bild} contentFit="cover" />
              {onLoeschen ? (
                <Pressable onPress={() => loeschen(d)} style={s.x} hitSlop={8}>
                  <Text style={s.xText}>✕</Text>
                </Pressable>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Text style={s.leer}>Keine Fotos</Text>
      )}
      {onKamera || onGalerie ? (
        <View style={s.tasten}>
          {onKamera ? <Taste titel="📷 Kamera" onPress={onKamera} art="sekundaer" klein style={{ flex: 1 }} /> : null}
          {onGalerie ? <Taste titel="🖼 Galerie" onPress={onGalerie} art="sekundaer" klein style={{ flex: 1 }} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  block: { marginBottom: groessen.abstand },
  titel: { fontSize: groessen.schrift, fontWeight: '600', color: farben.text, marginBottom: 8 },
  reihe: { gap: 10, paddingBottom: 6 },
  bildRahmen: { width: 120, height: 120, borderRadius: 12, overflow: 'hidden', backgroundColor: farben.grauHell },
  bild: { width: '100%', height: '100%' },
  x: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  xText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  leer: { color: farben.grau, fontSize: groessen.schriftKlein, marginBottom: 6 },
  tasten: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
