// Liste: was ist überfällig, was steht diese Woche und nächste Woche an (Montag bis Sonntag).
import { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { eintraegeLaden, eintragFaelligkeit } from '@/db/repo';
import type { EintragMitStatus } from '@/db/typen';
import { formatDeutsch, heute } from '@/lib/datum';
import { wochenGrenzen, wochenGruppe } from '@/lib/woche';
import { EintragKarte } from '@/components/EintragKarte';
import { farben, groessen } from '@/theme';

export default function Woche() {
  const db = useSQLiteContext();
  const [eintraege, setEintraege] = useState<EintragMitStatus[]>([]);
  useFocusEffect(useCallback(() => { eintraegeLaden(db).then(setEintraege); }, [db]));

  const h = heute();
  const w = wochenGrenzen(h);
  const kurz = (iso: string) => formatDeutsch(iso).slice(0, 6);

  const abschnitte = useMemo(() => {
    const gruppen = { ueberfaellig: [] as { e: EintragMitStatus; n: string }[], diese: [] as { e: EintragMitStatus; n: string }[], naechste: [] as { e: EintragMitStatus; n: string }[] };
    for (const e of eintraege) {
      const f = eintragFaelligkeit(e, h);
      const g = wochenGruppe(f, h);
      if (g) gruppen[g].push({ e, n: f.naechster! });
    }
    const sortiert = (l: { e: EintragMitStatus; n: string }[]) => l.sort((a, b) => a.n.localeCompare(b.n) || a.e.name.localeCompare(b.e.name, 'de')).map((x) => x.e);
    return [
      { key: 'ueberfaellig', titel: '❗ Überfällig', farbe: farben.rot, data: sortiert(gruppen.ueberfaellig) },
      { key: 'diese', titel: `📅 Diese Woche (${kurz(w.dieseVon)} – ${kurz(w.dieseBis)})`, farbe: farben.gelb, data: sortiert(gruppen.diese) },
      { key: 'naechste', titel: `📅 Nächste Woche (${kurz(w.naechsteVon)} – ${kurz(w.naechsteBis)})`, farbe: farben.primaer, data: sortiert(gruppen.naechste) },
    ];
  }, [eintraege, h, w.dieseVon, w.dieseBis, w.naechsteVon, w.naechsteBis]);

  return (
    <SectionList
      style={{ backgroundColor: farben.hintergrund }}
      contentContainerStyle={s.liste}
      sections={abschnitte}
      keyExtractor={(e) => e.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={[s.kopf, { borderLeftColor: section.farbe }]}>
          <Text style={s.kopfText}>{section.titel}</Text>
          <Text style={s.anzahl}>{section.data.length}</Text>
        </View>
      )}
      renderSectionFooter={({ section }) => (section.data.length === 0 ? <Text style={s.leer}>Nichts.</Text> : null)}
      renderItem={({ item }) => <EintragKarte eintrag={item} />}
    />
  );
}

const s = StyleSheet.create({
  liste: { padding: groessen.abstand, paddingBottom: 48 },
  kopf: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: farben.karte, borderLeftWidth: 8, borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 10 },
  kopfText: { fontSize: groessen.schrift, fontWeight: '800', color: farben.text, flex: 1 },
  anzahl: { fontSize: groessen.schriftGross, fontWeight: '800', color: farben.text },
  leer: { color: farben.grau, fontSize: groessen.schriftKlein, marginBottom: 12, marginLeft: 4 },
});
