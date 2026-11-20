// Zulagen-Taste: Hitze- und Staubstunden einfach mit − / ＋ eintragen. Zählt in die Monatsstatistik.
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungenImBereich, zulageLaden, zulageSetzen, zulagenImBereich } from '@/db/repo';
import { formatMitTag, heute, plusTage, zuDate } from '@/lib/datum';
import { monatsGrenzen } from '@/lib/kalender';
import { monatsStatistik, stundenText } from '@/lib/statistik';
import { Bildschirm } from '@/components/Bildschirm';
import { Taste } from '@/components/Taste';
import { farben, groessen, sz } from '@/theme';

const SCHRITT = 0.5;

export default function Zulagen() {
  const db = useSQLiteContext();
  const [tag, setTag] = useState(heute());
  const [hitze, setHitze] = useState(0);
  const [staub, setStaub] = useState(0);
  const [ausArbeiten, setAusArbeiten] = useState({ hitze: 0, staub: 0 });
  const [monat, setMonat] = useState({ hitze: 0, staub: 0 });

  const laden = useCallback(async (t: string) => {
    const z = await zulageLaden(db, t);
    setHitze(z.hitze); setStaub(z.staub);
    const d = zuDate(t);
    const g = monatsGrenzen(d.getFullYear(), d.getMonth());
    const [zeilen, direkt] = await Promise.all([durchfuehrungenImBereich(db, g.von, g.bis), zulagenImBereich(db, g.von, g.bis)]);
    const st = monatsStatistik(zeilen, direkt);
    setMonat({ hitze: st.hitze, staub: st.staub });
    const heuteArbeit = zeilen.filter((x) => x.datum === t);
    setAusArbeiten({ hitze: heuteArbeit.reduce((s, x) => s + x.hitze, 0), staub: heuteArbeit.reduce((s, x) => s + x.staub, 0) });
  }, [db]);
  useFocusEffect(useCallback(() => { laden(tag); }, [laden, tag]));

  const setzen = async (h: number, s: number) => {
    const nh = Math.max(0, Math.min(24, h)), ns = Math.max(0, Math.min(24, s));
    setHitze(nh); setStaub(ns);
    await zulageSetzen(db, tag, nh, ns);
    laden(tag);
  };

  const istHeute = tag === heute();
  return (
    <Bildschirm>
      <View style={s.kopf}>
        <Pressable onPress={() => setTag(plusTage(tag, -1))} style={({ pressed }) => [s.pfeil, pressed && { opacity: 0.6 }]}><Text style={s.pfeilText}>◀</Text></Pressable>
        <Pressable onPress={() => setTag(heute())} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.titel}>{istHeute ? 'Heute' : formatMitTag(tag)}</Text>
          <Text style={s.unter}>{istHeute ? formatMitTag(tag) : 'antippen = heute'}</Text>
        </Pressable>
        <Pressable onPress={() => setTag(plusTage(tag, 1))} disabled={istHeute} style={({ pressed }) => [s.pfeil, istHeute && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}><Text style={s.pfeilText}>▶</Text></Pressable>
      </View>

      <Zaehler symbol="🔥" text="Hitzestunden" wert={hitze} extra={ausArbeiten.hitze} onMinus={() => setzen(hitze - SCHRITT, staub)} onPlus={() => setzen(hitze + SCHRITT, staub)} />
      <Zaehler symbol="🌫" text="Staubstunden" wert={staub} extra={ausArbeiten.staub} onMinus={() => setzen(hitze, staub - SCHRITT)} onPlus={() => setzen(hitze, staub + SCHRITT)} />

      <View style={s.monat}>
        <Text style={s.monatTitel}>Dieser Monat bisher</Text>
        <Text style={s.monatZeile}>🔥 Hitze: <Text style={s.fett}>{stundenText(monat.hitze)}</Text>     🌫 Staub: <Text style={s.fett}>{stundenText(monat.staub)}</Text></Text>
        <Text style={s.hinweis}>Wird am Monatsende automatisch in der Statistik zusammengerechnet.</Text>
      </View>
      <Taste titel="📊 Monatsstatistik ansehen" onPress={() => router.push('/statistik')} art="sekundaer" klein />
    </Bildschirm>
  );
}

function Zaehler({ symbol, text, wert, extra, onMinus, onPlus }: { symbol: string; text: string; wert: number; extra: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={s.zaehler}>
      <Text style={s.zaehlerText}>{symbol} {text}</Text>
      <View style={s.zaehlerReihe}>
        <Pressable onPress={onMinus} disabled={wert <= 0} style={({ pressed }) => [s.knopf, s.minus, wert <= 0 && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}>
          <Text style={s.knopfText}>−</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.wert}>{stundenText(wert)}</Text>
          {extra > 0 ? <Text style={s.extra}>+ {stundenText(extra)} aus Arbeiten</Text> : null}
        </View>
        <Pressable onPress={onPlus} style={({ pressed }) => [s.knopf, s.plus, pressed && { opacity: 0.6 }]}>
          <Text style={[s.knopfText, { color: '#fff' }]}>＋</Text>
        </Pressable>
      </View>
      <Text style={s.schritt}>je Tipp ½ Stunde</Text>
    </View>
  );
}

const s = StyleSheet.create({
  kopf: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  pfeil: { width: 60, height: 60, borderRadius: groessen.radius, backgroundColor: farben.karte, borderWidth: 2, borderColor: farben.rahmen, alignItems: 'center', justifyContent: 'center' },
  pfeilText: { fontSize: sz(24), fontWeight: '800', color: farben.text },
  titel: { fontSize: groessen.titel, fontWeight: '800', color: farben.text },
  unter: { fontSize: sz(13), color: farben.textLeicht },
  zaehler: { backgroundColor: farben.karte, borderRadius: groessen.radius, padding: 16, marginBottom: 14 },
  zaehlerText: { fontSize: groessen.schriftGross, fontWeight: '800', color: farben.text, marginBottom: 10 },
  zaehlerReihe: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  knopf: { width: sz(84), height: sz(84), borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  minus: { backgroundColor: farben.grauHell, borderWidth: 2, borderColor: farben.rahmen },
  plus: { backgroundColor: farben.primaer },
  knopfText: { fontSize: sz(44), fontWeight: '900', color: farben.text, marginTop: -4 },
  wert: { fontSize: sz(36), fontWeight: '900', color: farben.text },
  extra: { fontSize: sz(13), color: farben.textLeicht, fontWeight: '600' },
  schritt: { fontSize: sz(13), color: farben.grau, textAlign: 'center', marginTop: 6 },
  monat: { backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#BFDBFE', borderRadius: groessen.radius, padding: 14, gap: 6, marginBottom: 12 },
  monatTitel: { fontSize: groessen.schrift, fontWeight: '800', color: farben.text },
  monatZeile: { fontSize: groessen.schrift, color: farben.text },
  fett: { fontWeight: '900' },
  hinweis: { fontSize: groessen.schriftKlein, color: farben.textLeicht },
});
