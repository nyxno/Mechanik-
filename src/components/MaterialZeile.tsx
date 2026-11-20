// Eine Zeile der Materialliste: Foto, Name, Menge, Gerät, Abhaken.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { Material } from '@/db/typen';
import { fotoUri } from '@/lib/fotos';
import { farben, groessen, sz } from '@/theme';

export function mengeText(m: Pick<Material, 'menge' | 'einheit'>): string {
  if (m.menge === null || m.menge === undefined) return '';
  return `${m.menge.toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${m.einheit}`;
}

export function MaterialZeile({ m, onAbhaken, zeigeGeraet = true }: { m: Material; onAbhaken: (m: Material) => void; zeigeGeraet?: boolean }) {
  const besorgt = !!m.besorgt;
  return (
    <Pressable onPress={() => router.push({ pathname: '/material/[id]', params: { id: m.id } })}
      style={({ pressed }) => [s.zeile, besorgt && { opacity: 0.6 }, pressed && { opacity: 0.7 }]}>
      {m.erstes_foto ? (
        <Image source={{ uri: fotoUri(m.erstes_foto) }} style={s.bild} contentFit="cover" />
      ) : (
        <View style={[s.bild, s.keinBild]}><Text style={{ fontSize: sz(26) }}>📦</Text></View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.name, besorgt && { textDecorationLine: 'line-through' }]} numberOfLines={2}>{m.name}</Text>
        {mengeText(m) ? <Text style={s.menge}>{mengeText(m)}</Text> : null}
        {zeigeGeraet && m.eintrag_name ? <Text style={s.klein} numberOfLines={1}>🔧 {m.eintrag_name}</Text> : null}
        {m.notiz ? <Text style={s.klein} numberOfLines={1}>{m.notiz}</Text> : null}
        {(m.fotos_anzahl ?? 0) > 1 ? <Text style={s.klein}>📷 {m.fotos_anzahl} Fotos</Text> : null}
      </View>
      <Pressable onPress={() => onAbhaken(m)} hitSlop={6}
        style={({ pressed }) => [s.haken, besorgt && s.hakenAn, pressed && { opacity: 0.6 }]}>
        <Text style={[s.hakenText, besorgt && { color: '#fff' }]}>✓</Text>
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  zeile: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 10, marginBottom: 10 },
  bild: { width: 72, height: 72, borderRadius: 10, backgroundColor: farben.grauHell },
  keinBild: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: groessen.schrift, fontWeight: '800', color: farben.text },
  menge: { fontSize: groessen.schrift, fontWeight: '700', color: farben.primaer },
  klein: { fontSize: groessen.schriftKlein, color: farben.textLeicht },
  haken: { width: 60, height: 60, borderRadius: 14, borderWidth: 3, borderColor: farben.gruen, alignItems: 'center', justifyContent: 'center' },
  hakenAn: { backgroundColor: farben.gruen },
  hakenText: { fontSize: sz(28), fontWeight: '900', color: farben.gruen },
});
