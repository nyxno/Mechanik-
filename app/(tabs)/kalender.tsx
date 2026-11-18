// Monatskalender: was ist wann eingeplant. Punkte in der Farbe des Gebiets.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungenImBereich, eintraegeLaden, eintragIntervall } from '@/db/repo';
import { stundenText, StatZeile } from '@/lib/statistik';
import { GebietMarke } from '@/components/EintragKarte';
import { Taste } from '@/components/Taste';
import { ergebnisFarben } from '@/theme';
import type { EintragMitStatus } from '@/db/typen';
import { formatMitTag, heute, zuDate } from '@/lib/datum';
import { monatsGrenzen, monatsRaster, termineImBereich } from '@/lib/kalender';
import { Bildschirm } from '@/components/Bildschirm';
import { EintragKarte } from '@/components/EintragKarte';
import { farben, groessen, sz } from '@/theme';

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function Kalender() {
  const db = useSQLiteContext();
  const h = heute();
  const [eintraege, setEintraege] = useState<EintragMitStatus[]>([]);
  const [monat, setMonat] = useState(() => ({ j: zuDate(h).getFullYear(), m: zuDate(h).getMonth() }));
  const [tag, setTag] = useState<string | null>(h);
  const [erledigt, setErledigt] = useState<StatZeile[]>([]);
  const raster = monatsRaster(monat.j, monat.m);
  const ladeErledigt = useCallback(() => { durchfuehrungenImBereich(db, raster[0], raster[41]).then(setErledigt); }, [db, raster[0], raster[41]]);
  useFocusEffect(useCallback(() => { eintraegeLaden(db).then(setEintraege); ladeErledigt(); }, [db, ladeErledigt]));
  useEffect(() => { ladeErledigt(); }, [ladeErledigt]);
  const erledigtProTag = useMemo(() => {
    const m = new Map<string, StatZeile[]>();
    for (const z of erledigt) m.set(z.datum, [...(m.get(z.datum) ?? []), z]);
    return m;
  }, [erledigt]);

  const { von, bis } = monatsGrenzen(monat.j, monat.m);
  const termine = useMemo(() => termineImBereich(
    eintraege.map((e) => ({ id: e.id, letzte: e.letzte_durchfuehrung, intervall: eintragIntervall(e), festerTermin: e.naechster_termin, einmalig: !!e.einmalig })),
    raster[0], raster[41], h,
  ), [eintraege, raster[0], raster[41], h]);
  const nachId = useMemo(() => new Map(eintraege.map((e) => [e.id, e])), [eintraege]);
  const anzahlImMonat = [...termine.entries()].filter(([d]) => d >= von && d <= bis).reduce((n, [, l]) => n + l.length, 0);

  const wechseln = (delta: number) => {
    const d = new Date(monat.j, monat.m + delta, 1);
    setMonat({ j: d.getFullYear(), m: d.getMonth() });
    setTag(null);
  };

  const tagListe = tag ? (termine.get(tag) ?? []).map((t) => nachId.get(t.id)).filter(Boolean) as EintragMitStatus[] : [];

  return (
    <Bildschirm>
      <View style={s.kopf}>
        <Pressable onPress={() => wechseln(-1)} style={({ pressed }) => [s.pfeil, pressed && { opacity: 0.6 }]}><Text style={s.pfeilText}>◀</Text></Pressable>
        <Pressable onPress={() => { setMonat({ j: zuDate(h).getFullYear(), m: zuDate(h).getMonth() }); setTag(h); }} style={s.titelFeld}>
          <Text style={s.titel}>{MONATE[monat.m]} {monat.j}</Text>
          <Text style={s.unter}>{anzahlImMonat} geplant · antippen = heute</Text>
        </Pressable>
        <Pressable onPress={() => wechseln(1)} style={({ pressed }) => [s.pfeil, pressed && { opacity: 0.6 }]}><Text style={s.pfeilText}>▶</Text></Pressable>
      </View>

      <Taste
        titel={`📊 Monatsstatistik ${MONATE[monat.m]}`}
        onPress={() => router.push({ pathname: '/statistik', params: { monat: `${monat.j}-${String(monat.m + 1).padStart(2, '0')}` } })}
        art="sekundaer" klein style={{ marginBottom: 12 }}
      />
      <View style={s.wochentage}>{TAGE.map((t) => <Text key={t} style={[s.wochentag, (t === 'Sa' || t === 'So') && { color: farben.grau }]}>{t}</Text>)}</View>
      <View style={s.raster}>
        {raster.map((d) => {
          const imMonat = d >= von && d <= bis;
          const l = termine.get(d) ?? [];
          const ueber = l.some((t) => t.ueberfaellig);
          const gewaehlt = d === tag;
          return (
            <Pressable key={d} onPress={() => setTag(d)}
              style={[s.zelle, !imMonat && { opacity: 0.35 }, d === h && s.heute, ueber && s.ueber, gewaehlt && s.gewaehlt]}>
              <Text style={[s.zahl, gewaehlt && { color: '#fff' }]}>{zuDate(d).getDate()}</Text>
              <View style={s.punkte}>
                {l.slice(0, 4).map((t) => (
                  <View key={t.id} style={[s.punkt, { backgroundColor: nachId.get(t.id)?.kategorie_farbe ?? farben.grau }]} />
                ))}
              </View>
              {l.length > 4 ? <Text style={[s.mehr, gewaehlt && { color: '#fff' }]}>+{l.length - 4}</Text> : null}
              {erledigtProTag.get(d)?.length ? (
                <Text style={[s.erledigtZahl, gewaehlt && { color: '#fff' }]}>✓{erledigtProTag.get(d)!.length}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {tag ? (
        <View style={{ marginTop: groessen.abstand }}>
          <Text style={s.tagTitel}>{formatMitTag(tag)}{tag === h ? ' – heute' : ''}</Text>

          {tag <= h ? (
            <>
              <Text style={s.abschnitt}>✓ Erledigt{tag === h ? ' heute' : ''}</Text>
              {(erledigtProTag.get(tag) ?? []).length === 0 ? <Text style={s.leer}>Nichts erledigt.</Text> : null}
              {(erledigtProTag.get(tag) ?? []).map((z, i) => {
                const ef = ergebnisFarben(z.ergebnis);
                return (
                  <Pressable key={`${z.eintragId}-${i}`} onPress={() => router.push({ pathname: '/eintrag/[id]', params: { id: z.eintragId } })}
                    style={({ pressed }) => [s.erledigtZeile, pressed && { opacity: 0.7 }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={s.erledigtName}>{z.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <GebietMarke name={z.kategorieName} farbe={z.farbe} />
                        <Text style={[s.erledigtInfo, { color: ef.vorder }]}>{ef.symbol} {ef.label}</Text>
                      </View>
                      {z.hitze > 0 || z.staub > 0 ? (
                        <Text style={s.erledigtInfo}>
                          {z.hitze > 0 ? `🔥 ${stundenText(z.hitze)}  ` : ''}{z.staub > 0 ? `🌫 ${stundenText(z.staub)}` : ''}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
              <Text style={s.abschnitt}>{tag === h ? '📅 Noch geplant' : '❗ Damals fällig (überfällig)'}</Text>
            </>
          ) : <Text style={s.abschnitt}>📅 Geplant</Text>}
          {tagListe.length === 0 ? <Text style={s.leer}>Nichts.</Text> : tagListe.map((e) => <EintragKarte key={e.id} eintrag={e} />)}
          {tag > h ? <Text style={s.hinweis}>Spätere Termine sind vorausberechnet. Sie verschieben sich, wenn eine Arbeit früher oder später erledigt wird.</Text> : null}
        </View>
      ) : null}
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  kopf: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pfeil: { width: 60, height: 60, borderRadius: groessen.radius, backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, alignItems: 'center', justifyContent: 'center' },
  pfeilText: { fontSize: sz(24), fontWeight: '800', color: farben.text },
  titelFeld: { flex: 1, alignItems: 'center' },
  titel: { fontSize: groessen.titel, fontWeight: '800', color: farben.text },
  unter: { fontSize: sz(13), color: farben.textLeicht },
  wochentage: { flexDirection: 'row' },
  wochentag: { flex: 1, textAlign: 'center', fontWeight: '700', color: farben.textLeicht, marginBottom: 4 },
  raster: { flexDirection: 'row', flexWrap: 'wrap' },
  zelle: { width: `${100 / 7}%`, height: 74, padding: 3, borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  heute: { borderColor: farben.primaer },
  ueber: { backgroundColor: farben.rotHell },
  gewaehlt: { backgroundColor: farben.primaer },
  zahl: { fontSize: groessen.schrift, fontWeight: '700', color: farben.text },
  punkte: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3, marginTop: 4 },
  punkt: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.35)' },
  mehr: { fontSize: sz(11), fontWeight: '700', color: farben.textLeicht },
  erledigtZahl: { fontSize: sz(11), fontWeight: '800', color: farben.gruen },
  abschnitt: { fontSize: groessen.schrift, fontWeight: '800', color: farben.text, marginTop: 8, marginBottom: 8 },
  erledigtZeile: { flexDirection: 'row', backgroundColor: farben.karte, borderRadius: groessen.radius, borderLeftWidth: 10, borderLeftColor: farben.gruen, padding: 12, marginBottom: 10 },
  erledigtName: { fontSize: groessen.schrift, fontWeight: '700', color: farben.text },
  erledigtInfo: { fontSize: groessen.schriftKlein, fontWeight: '600', color: farben.textLeicht },
  tagTitel: { fontSize: groessen.schriftGross, fontWeight: '800', color: farben.text, marginBottom: 10 },
  leer: { color: farben.grau, fontSize: groessen.schrift },
  hinweis: { color: farben.grau, fontSize: groessen.schriftKlein, marginTop: 4 },
});
