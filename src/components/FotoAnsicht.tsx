import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { fotoUri } from '@/lib/fotos';
import { sz } from '@/theme';

/** Vollbild-Anzeige eines Fotos. */
export function FotoAnsicht({ datei, onSchliessen }: { datei: string | null; onSchliessen: () => void }) {
  return (
    <Modal visible={!!datei} transparent animationType="fade" onRequestClose={onSchliessen}>
      <View style={s.hinter}>
        {datei ? <Image source={{ uri: fotoUri(datei) }} style={s.bild} contentFit="contain" /> : null}
        <Pressable onPress={onSchliessen} style={s.schliessen}>
          <Text style={s.schliessenText}>Schließen</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  hinter: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  bild: { width: '100%', height: '80%' },
  schliessen: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 14 },
  schliessenText: { fontSize: sz(20), fontWeight: '700' },
});
