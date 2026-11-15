import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { EintragMitStatus } from '@/db/typen';
import { eintragIntervall } from '@/db/repo';
import { berechneFaelligkeit } from '@/lib/faelligkeit';
import { intervallText } from '@/lib/intervall';
import { formatDeutsch, heute } from '@/lib/datum';
import { farben, groessen, statusFarben } from '@/theme';
import { StatusBadge } from './StatusBadge';

/** Eine Zeile in der Übersicht: Name, Kategorie, Ampel, nächster Termin. */
export function EintragKarte({ eintrag, zeigeKategorie = true }: { eintrag: EintragMitStatus; zeigeKategorie?: boolean }) {
  const f = berechneFaelligkeit(eintrag.letzte_durchfuehrung, eintragIntervall(eintrag), heute());
  const sf = statusFarben(f.status);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/eintrag/[id]', params: { id: eintrag.id } })}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      style={({ pressed }) => [s.karte, { borderLeftColor: sf.vorder }, pressed && { opacity: 0.7 }]}
    >
      <View style={s.kopf}>
        <Text style={s.name} numberOfLines={2}>{eintrag.name}</Text>
        <StatusBadge status={f.status} />
      </View>
      {zeigeKategorie ? <Text style={s.klein}>{eintrag.kategorie_name} · {intervallText(eintragIntervall(eintrag))}</Text> : <Text style={s.klein}>{intervallText(eintragIntervall(eintrag))}</Text>}
      <Text style={[s.faellig, { color: sf.vorder }]}>{f.text}</Text>
      {eintrag.letzte_durchfuehrung ? (
        <Text style={s.klein}>Zuletzt: {formatDeutsch(eintrag.letzte_durchfuehrung)}</Text>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  karte: {
    backgroundColor: farben.karte,
    borderRadius: groessen.radius,
    borderLeftWidth: 10,
    padding: 14,
    marginBottom: 12,
    minHeight: groessen.tasteHoehe,
  },
  kopf: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: groessen.schriftGross, fontWeight: '700', color: farben.text },
  klein: { fontSize: groessen.schriftKlein, color: farben.textLeicht, marginTop: 4 },
  faellig: { fontSize: groessen.schrift, fontWeight: '600', marginTop: 6 },
});
