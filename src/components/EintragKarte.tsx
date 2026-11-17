import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { EintragMitStatus } from '@/db/typen';
import { eintragFaelligkeit, eintragIntervall } from '@/db/repo';
import { intervallText } from '@/lib/intervall';
import { formatDeutsch, formatMitTag, heute } from '@/lib/datum';
import { farben, groessen, statusFarben } from '@/theme';
import { StatusBadge } from './StatusBadge';

interface Props {
  eintrag: EintragMitStatus;
  zeigeKategorie?: boolean;
  /** Wenn gesetzt: Taste "✓ Heute erledigt" direkt auf der Karte. */
  onSchnellErledigt?: (e: EintragMitStatus) => void;
  /** Wird beim Öffnen aufgerufen (z. B. um den Suchbegriff zu lernen). */
  onOeffnen?: () => void;
}

/** Eine Zeile in der Übersicht: Name, Kategorie, Ampel, nächster Termin. */
export function EintragKarte({ eintrag, zeigeKategorie = true, onSchnellErledigt, onOeffnen }: Props) {
  const h = heute();
  const f = eintragFaelligkeit(eintrag, h);
  const sf = statusFarben(f.status);
  const art = eintrag.einmalig ? '1× Einmalig' : intervallText(eintragIntervall(eintrag));
  const schlummert = !!eintrag.schlummern_bis && eintrag.schlummern_bis > h;
  return (
    <Pressable
      onPress={() => { onOeffnen?.(); router.push({ pathname: '/eintrag/[id]', params: { id: eintrag.id } }); }}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      style={({ pressed }) => [s.karte, { borderLeftColor: sf.vorder }, pressed && { opacity: 0.7 }]}
    >
      <View style={s.kopf}>
        <Text style={s.name} numberOfLines={2}>{eintrag.name}</Text>
        <StatusBadge status={f.status} />
      </View>
      <View style={s.zeile}>
        {zeigeKategorie ? <GebietMarke name={eintrag.kategorie_name} farbe={eintrag.kategorie_farbe} /> : null}
        <Text style={[s.klein, { marginTop: 0 }]}>{art}</Text>
      </View>
      <Text style={[s.faellig, { color: sf.vorder }]}>{f.text}</Text>
      {f.status !== 'erledigt' && eintrag.letzte_durchfuehrung ? (
        <Text style={s.klein}>Zuletzt: {formatDeutsch(eintrag.letzte_durchfuehrung)}</Text>
      ) : null}
      {eintrag.offene_maengel > 0 || schlummert ? (
        <View style={s.tags}>
          {eintrag.offene_maengel > 0 ? (
            <Text style={[s.tag, { backgroundColor: farben.rotHell, color: farben.rot }]}>
              ⚠ {eintrag.offene_maengel === 1 ? 'Mangel offen' : `${eintrag.offene_maengel} Mängel offen`}
            </Text>
          ) : null}
          {schlummert ? (
            <Text style={[s.tag, { backgroundColor: farben.grauHell, color: farben.text }]}>💤 bis {formatMitTag(eintrag.schlummern_bis!)}</Text>
          ) : null}
        </View>
      ) : null}
      {onSchnellErledigt && f.status !== 'erledigt' ? (
        <Pressable
          onPress={() => onSchnellErledigt(eintrag)}
          hitSlop={4}
          style={({ pressed }) => [s.schnell, pressed && { opacity: 0.6 }]}
        >
          <Text style={s.schnellText}>✓ Heute erledigt</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

/** Kleines farbiges Schild mit dem Gebiet (Kategorie). */
export function GebietMarke({ name, farbe }: { name: string; farbe: string | null }) {
  return (
    <View style={[s.marke, { backgroundColor: farbe ?? farben.grau }]}>
      <Text style={s.markeText} numberOfLines={1}>{name}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  zeile: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  marke: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 200 },
  markeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
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
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { fontSize: 14, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  schnell: {
    marginTop: 10, minHeight: groessen.tasteHoeheKlein, borderRadius: 12, borderWidth: 2, borderColor: farben.gruen,
    backgroundColor: farben.gruenHell, alignItems: 'center', justifyContent: 'center',
  },
  schnellText: { fontSize: groessen.schrift, fontWeight: '800', color: farben.gruen },
});
