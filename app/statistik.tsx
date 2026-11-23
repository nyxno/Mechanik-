// Monatsstatistik: Zulagenstunden, erledigte Arbeiten, wo am meisten, Vergleich, Ausblick, Tagesliste.
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungenImBereich, eintraegeLaden, eintragIntervall, statistikGezeigtSpeichern, zulagenImBereich } from '@/db/repo';
import type { EintragMitStatus } from '@/db/typen';
import { formatDeutsch, formatMitTag, heute, zuDate } from '@/lib/datum';
import { monatsGrenzen, termineImBereich } from '@/lib/kalender';
import { monatsSchluessel, monatsStatistik, Rangplatz, StatZeile, stundenText, TagesZulage } from '@/lib/statistik';
import { Bildschirm } from '@/components/Bildschirm';
import { ergebnisFarben, farben, groessen, sz } from '@/theme';

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function ausParam(p?: string): { j: number; m: number } {
  const t = p?.match(/^(\d{4})-(\d{2})$/);
  if (t) return { j: Number(t[1]), m: Number(t[2]) - 1 };
  const d = zuDate(heute());
  return { j: d.getFullYear(), m: d.getMonth() };
}

export default function Statistik() {
  const db = useSQLiteContext();
  const { monat: param } = useLocalSearchParams<{ monat?: string }>();
  const [monat, setMonat] = useState(() => ausParam(param));
  const [zeilen, setZeilen] = useState<StatZeile[]>([]);
  const [vorher, setVorher] = useState<StatZeile[]>([]);
  const [direkt, setDirekt] = useState<TagesZulage[]>([]);
  const [direktVorher, setDirektVorher] = useState<TagesZulage[]>([]);
  const [eintraege, setEintraege] = useState<EintragMitStatus[]>([]);
  const [tageOffen, setTageOffen] = useState(false);

  const laden = useCallback(async () => {
    const g = monatsGrenzen(monat.j, monat.m);
    const vJahr = monat.m === 0 ? monat.j - 1 : monat.j;
    const vg = monatsGrenzen(vJahr, monat.m === 0 ? 11 : monat.m - 1);
    const [a, b, e, za, zb] = await Promise.all([
      durchfuehrungenImBereich(db, g.von, g.bis), durchfuehrungenImBereich(db, vg.von, vg.bis), eintraegeLaden(db),
      zulagenImBereich(db, g.von, g.bis), zulagenImBereich(db, vg.von, vg.bis),
    ]);
    setZeilen(a); setVorher(b); setEintraege(e); setDirekt(za); setDirektVorher(zb);
    statistikGezeigtSpeichern(db, monatsSchluessel(monat.j, monat.m)).catch(() => {});
  }, [db, monat.j, monat.m]);
  useFocusEffect(useCallback(() => { laden(); }, [laden]));

  const st = useMemo(() => monatsStatistik(zeilen, direkt), [zeilen, direkt]);
  const vst = useMemo(() => monatsStatistik(vorher, direktVorher), [vorher, direktVorher]);

  // Ausblick: was im Folgemonat fällig wird, und offene Mängel
  const ausblick = useMemo(() => {
    const n = new Date(monat.j, monat.m + 1, 1);
    const g = monatsGrenzen(n.getFullYear(), n.getMonth());
    const t = termineImBereich(
      eintraege.map((e) => ({ id: e.id, letzte: e.letzte_durchfuehrung, intervall: eintragIntervall(e), festerTermin: e.naechster_termin, einmalig: !!e.einmalig })),
      g.von, g.bis, heute(),
    );
    return { monat: MONATE[n.getMonth()], faellig: [...t.values()].reduce((s, l) => s + l.length, 0), maengel: eintraege.reduce((s, e) => s + e.offene_maengel, 0) };
  }, [eintraege, monat.j, monat.m]);

  const wechseln = (delta: number) => {
    const d = new Date(monat.j, monat.m + delta, 1);
    setMonat({ j: d.getFullYear(), m: d.getMonth() });
    setTageOffen(false);
  };
  const vorName = MONATE[(monat.m + 11) % 12];

  return (
    <Bildschirm>
      <View style={s.kopf}>
        <Pressable onPress={() => wechseln(-1)} style={({ pressed }) => [s.pfeil, pressed && { opacity: 0.6 }]}><Text style={s.pfeilText}>◀</Text></Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.titel}>{MONATE[monat.m]} {monat.j}</Text>
          <Text style={s.unter}>Monatsübersicht</Text>
        </View>
        <Pressable onPress={() => wechseln(1)} style={({ pressed }) => [s.pfeil, pressed && { opacity: 0.6 }]}><Text style={s.pfeilText}>▶</Text></Pressable>
      </View>

      {/* Hauptzahlen */}
      <View style={s.kacheln}>
        <Kachel symbol="🔥" wert={stundenText(st.hitze)} text="Hitzestunden" unter={`an ${st.tageHitze} Tagen`} />
        <Kachel symbol="🌫" wert={stundenText(st.staub)} text="Staubstunden" unter={`an ${st.tageStaub} Tagen`} />
      </View>
      <View style={s.kacheln}>
        <Kachel symbol="➕" wert={stundenText(st.stunden)} text="Zulagen gesamt" unter={vergleich(st.stunden, vst.stunden, vorName, true)} />
        <Kachel symbol="✓" wert={String(st.arbeiten)} text="Arbeiten erledigt" unter={vergleich(st.arbeiten, vst.arbeiten, vorName, false)} />
      </View>

      {st.stunden > 0 ? (
        <Abschnitt titel="📈 Zulagen pro Tag">
          <TagesSaeulen jahr={monat.j} monat={monat.m} tage={st.proTag} />
        </Abschnitt>
      ) : null}

      {st.direktStunden > 0 ? <Text style={s.hinweis}>davon {stundenText(st.direktStunden)} über die Zulagen-Taste eingetragen</Text> : null}

      {st.arbeiten === 0 && st.stunden === 0 ? (
        <Text style={s.leer}>In diesem Monat wurde noch nichts erfasst.</Text>
      ) : (
        <>
          <Abschnitt titel="📍 Wo am meisten Zulagen (Eintrag)">
            <Rangliste liste={st.proEintrag.filter((r) => r.stunden > 0).slice(0, 6)} wert={(r) => r.stunden} text={(r) => `${stundenText(r.stunden)} · ${r.arbeiten}×`}
              onPress={(r) => router.push({ pathname: '/eintrag/[id]', params: { id: r.id } })} leer="Keine Zulagenstunden bei Arbeiten (nur über die Zulagen-Taste)." />
          </Abschnitt>

          <Abschnitt titel="🏷 Nach Gebiet (Arbeiten)">
            <Rangliste liste={[...st.proGebiet].sort((a, b) => b.arbeiten - a.arbeiten)} wert={(r) => r.arbeiten}
              text={(r) => `${r.arbeiten}×${r.stunden > 0 ? ` · ${stundenText(r.stunden)}` : ''}`} />
          </Abschnitt>

          <Abschnitt titel="📆 Nach Wochentag (Arbeiten)">
            <View style={s.wochentage}>
              {st.proWochentag.map((n, i) => {
                const max = Math.max(1, ...st.proWochentag);
                return (
                  <View key={i} style={s.wtSpalte}>
                    <Text style={s.wtZahl}>{n || ''}</Text>
                    <View style={s.wtSpur}><View style={[s.wtBalken, { height: `${(n / max) * 100}%` }]} /></View>
                    <Text style={s.wtTag}>{TAGE[i]}</Text>
                  </View>
                );
              })}
            </View>
          </Abschnitt>

          <Abschnitt titel="🔍 Ergebnisse">
            <View style={s.ergebnisse}>
              {(['ok', 'maengel', 'ausser_betrieb'] as const).map((e) => {
                const f = ergebnisFarben(e);
                return (
                  <View key={e} style={[s.ergebnis, { borderColor: f.vorder, backgroundColor: f.hinter }]}>
                    <Text style={[s.ergebnisZahl, { color: f.vorder }]}>{f.symbol} {st.ergebnisse[e]}</Text>
                    <Text style={s.ergebnisText}>{f.label}</Text>
                  </View>
                );
              })}
            </View>
          </Abschnitt>

          <Abschnitt titel="⭐ Auffällig">
            <Zeile text="Arbeitstage mit Einträgen" wert={String(st.arbeitstage)} />
            <Zeile text="Ø Zulagen je Arbeitstag" wert={stundenText(st.arbeitstage ? Math.round((st.stunden / st.arbeitstage) * 10) / 10 : 0)} />
            {st.staerksterTag ? <Zeile text="Stärkster Tag" wert={`${formatMitTag(st.staerksterTag.datum)} · ${stundenText(st.staerksterTag.stunden)}`} /> : null}
            {st.proEintrag[0] ? <Zeile text="Am häufigsten" wert={`${st.proEintrag.slice().sort((a, b) => b.arbeiten - a.arbeiten)[0].name} (${st.proEintrag.slice().sort((a, b) => b.arbeiten - a.arbeiten)[0].arbeiten}×)`} /> : null}
          </Abschnitt>

          <Abschnitt titel="🧾 Zulagen pro Tag">
            <Pressable onPress={() => setTageOffen((x) => !x)} style={({ pressed }) => [s.aufklapp, pressed && { opacity: 0.7 }]}>
              <Text style={s.aufklappText}>{tageOffen ? '▲ Tagesliste zuklappen' : `▼ Tagesliste anzeigen (${st.proTag.filter((t) => t.hitze + t.staub > 0).length} Tage)`}</Text>
            </Pressable>
            {tageOffen ? (
              <View style={s.tabelle}>
                <View style={[s.tzeile, s.tkopf]}>
                  <Text style={[s.tzelle, { flex: 2 }]}>Datum</Text><Text style={s.tzelle}>🔥 Hitze</Text><Text style={s.tzelle}>🌫 Staub</Text>
                </View>
                {st.proTag.filter((t) => t.hitze + t.staub > 0).map((t) => (
                  <View key={t.datum} style={s.tzeile}>
                    <Text style={[s.tzelle, { flex: 2 }]}>{formatMitTag(t.datum)}</Text>
                    <Text style={s.tzelle}>{t.hitze ? stundenText(t.hitze) : '–'}</Text>
                    <Text style={s.tzelle}>{t.staub ? stundenText(t.staub) : '–'}</Text>
                  </View>
                ))}
                <View style={[s.tzeile, s.tkopf]}>
                  <Text style={[s.tzelle, { flex: 2 }]}>Summe</Text><Text style={s.tzelle}>{stundenText(st.hitze)}</Text><Text style={s.tzelle}>{stundenText(st.staub)}</Text>
                </View>
              </View>
            ) : null}
          </Abschnitt>
        </>
      )}

      <Abschnitt titel={`🔭 Ausblick ${ausblick.monat}`}>
        <Zeile text={`Im ${ausblick.monat} fällig`} wert={`${ausblick.faellig} Arbeiten`} />
        <Zeile text="Offene Mängel (aktuell)" wert={String(ausblick.maengel)} />
      </Abschnitt>
      <Text style={s.hinweis}>Stand: {formatDeutsch(heute())}. Erfasst werden Hitze- und Staubstunden beim Abhaken einer Durchführung.</Text>
    </Bildschirm>
  );
}

function vergleich(jetzt: number, vorher: number, vorName: string, stunden: boolean): string {
  const d = Math.round((jetzt - vorher) * 100) / 100;
  if (vorher === 0 && jetzt === 0) return `wie ${vorName}`;
  const t = stunden ? stundenText(Math.abs(d)) : String(Math.abs(d));
  return d === 0 ? `gleich wie ${vorName}` : `${d > 0 ? '▲ +' : '▼ −'}${t} zu ${vorName}`;
}

/** Säulen: Zulagenstunden (Hitze + Staub) für jeden Tag des Monats. */
function TagesSaeulen({ jahr, monat, tage }: { jahr: number; monat: number; tage: { datum: string; hitze: number; staub: number }[] }) {
  const { von, bis } = monatsGrenzen(jahr, monat);
  const anzahl = Number(bis.slice(8, 10));
  const proTag = new Map(tage.map((t) => [Number(t.datum.slice(8, 10)), t.hitze + t.staub]));
  const max = Math.max(0.5, ...proTag.values());
  const heuteTag = heute().slice(0, 7) === von.slice(0, 7) ? Number(heute().slice(8, 10)) : 0;
  return (
    <View>
      <Text style={s.saeulenMax}>höchster Tag: {stundenText(max)}</Text>
      <View style={s.saeulen}>
        {Array.from({ length: anzahl }, (_, i) => i + 1).map((t) => {
          const w = proTag.get(t) ?? 0;
          return (
            <View key={t} style={s.saeulenSpalte}>
              <View style={[s.saeule, { height: `${(w / max) * 100}%`, backgroundColor: w ? '#EA580C' : 'transparent' }, t === heuteTag && { borderWidth: 2, borderColor: farben.text }]} />
            </View>
          );
        })}
      </View>
      <View style={s.saeulenAchse}>
        {[1, 8, 15, 22, anzahl].map((t) => <Text key={t} style={s.achsenText}>{t}.</Text>)}
      </View>
    </View>
  );
}

function Kachel({ symbol, wert, text, unter }: { symbol: string; wert: string; text: string; unter: string }) {
  return (
    <View style={s.kachel}>
      <Text style={s.kachelText}>{symbol} {text}</Text>
      <Text style={s.kachelWert}>{wert}</Text>
      <Text style={s.kachelUnter}>{unter}</Text>
    </View>
  );
}

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <View style={s.abschnitt}>
      <Text style={s.abschnittTitel}>{titel}</Text>
      {children}
    </View>
  );
}

function Zeile({ text, wert }: { text: string; wert: string }) {
  return (
    <View style={s.zeile}>
      <Text style={s.zeileText}>{text}</Text>
      <Text style={s.zeileWert}>{wert}</Text>
    </View>
  );
}

/** Waagrechte Balken, direkt beschriftet (Name + Wert als Text), Farbe = Gebiet. */
function Rangliste({ liste, wert, text, onPress, leer }: { liste: Rangplatz[]; wert: (r: Rangplatz) => number; text: (r: Rangplatz) => string; onPress?: (r: Rangplatz) => void; leer?: string }) {
  if (liste.length === 0) return <Text style={s.leerKlein}>{leer ?? 'Nichts.'}</Text>;
  const max = Math.max(...liste.map(wert), 0.0001);
  return (
    <View style={{ gap: 10 }}>
      {liste.map((r) => (
        <Pressable key={r.id} onPress={onPress ? () => onPress(r) : undefined} style={({ pressed }) => [pressed && onPress && { opacity: 0.7 }]}>
          <View style={s.balkenKopf}>
            <Text style={s.balkenName} numberOfLines={1}>{r.name}</Text>
            <Text style={s.balkenWert}>{text(r)}</Text>
          </View>
          <View style={s.spur}>
            <View style={[s.balken, { width: `${Math.max(3, (wert(r) / max) * 100)}%`, backgroundColor: r.farbe ?? farben.primaer }]} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  kopf: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pfeil: { width: 60, height: 60, borderRadius: groessen.radius, backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, alignItems: 'center', justifyContent: 'center' },
  pfeilText: { fontSize: sz(24), fontWeight: '800', color: farben.text },
  titel: { fontSize: groessen.titel, fontWeight: '800', color: farben.text },
  unter: { fontSize: sz(13), color: farben.textLeicht },
  kacheln: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kachel: { flex: 1, backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 14, gap: 2 },
  kachelText: { fontSize: groessen.schriftKlein, fontWeight: '700', color: farben.textLeicht },
  kachelWert: { fontSize: sz(30), fontWeight: '900', color: farben.text },
  kachelUnter: { fontSize: sz(13), color: farben.textLeicht },
  leer: { fontSize: groessen.schrift, color: farben.textLeicht, textAlign: 'center', padding: 24 },
  leerKlein: { fontSize: groessen.schriftKlein, color: farben.grau },
  abschnitt: { backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 14, marginTop: 6, marginBottom: 10 },
  abschnittTitel: { fontSize: groessen.schrift, fontWeight: '800', color: farben.text, marginBottom: 12 },
  balkenKopf: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  balkenName: { flex: 1, fontSize: groessen.schriftKlein, fontWeight: '700', color: farben.text },
  balkenWert: { fontSize: groessen.schriftKlein, fontWeight: '700', color: farben.textLeicht },
  spur: { height: 14, borderRadius: 4, backgroundColor: farben.grauHell, overflow: 'hidden' },
  balken: { height: '100%', borderRadius: 4 },
  saeulenMax: { fontSize: sz(12), color: farben.textLeicht, marginBottom: 4, textAlign: 'right' },
  saeulen: { flexDirection: 'row', height: 90, alignItems: 'flex-end', gap: 2, borderBottomWidth: 1, borderBottomColor: farben.rahmen },
  saeulenSpalte: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  saeule: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 0 },
  saeulenAchse: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  achsenText: { fontSize: sz(12), color: farben.textLeicht },
  wochentage: { flexDirection: 'row', gap: 6, height: 130 },
  wtSpalte: { flex: 1, alignItems: 'center' },
  wtZahl: { fontSize: sz(13), fontWeight: '700', color: farben.text, height: 18 },
  wtSpur: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  wtBalken: { width: '100%', backgroundColor: farben.primaer, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  wtTag: { fontSize: sz(13), fontWeight: '700', color: farben.textLeicht, marginTop: 4 },
  ergebnisse: { flexDirection: 'row', gap: 8 },
  ergebnis: { flex: 1, borderWidth: 2, borderRadius: 12, padding: 10, alignItems: 'center' },
  ergebnisZahl: { fontSize: sz(22), fontWeight: '900' },
  ergebnisText: { fontSize: sz(13), fontWeight: '700', color: farben.text, textAlign: 'center' },
  zeile: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: farben.grauHell },
  zeileText: { fontSize: groessen.schriftKlein, color: farben.textLeicht, flexShrink: 1 },
  zeileWert: { fontSize: groessen.schriftKlein, fontWeight: '800', color: farben.text, textAlign: 'right', flexShrink: 1 },
  aufklapp: { minHeight: 52, borderRadius: 12, backgroundColor: farben.grauHell, alignItems: 'center', justifyContent: 'center' },
  aufklappText: { fontSize: groessen.schriftKlein, fontWeight: '800', color: farben.text },
  tabelle: { marginTop: 10 },
  tzeile: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: farben.grauHell },
  tkopf: { backgroundColor: farben.hintergrund },
  tzelle: { flex: 1, fontSize: groessen.schriftKlein, color: farben.text, fontWeight: '600', paddingHorizontal: 4 },
  hinweis: { color: farben.grau, fontSize: groessen.schriftKlein, marginTop: 6 },
});
