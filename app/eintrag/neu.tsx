import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungAnlegen, eintraegeLaden, eintragAnlegen, EintragDaten, eintragIntervall, eintragLaden, einstellungenLaden, fotoSpeichern, kategorienLaden } from '@/db/repo';
import { heute, heuteOderMontag } from '@/lib/datum';
import type { VorbildEintrag } from '@/lib/muster';
import { erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import { STANDARD_UHRZEIT } from '@/lib/uhrzeit';
import type { Kategorie } from '@/db/typen';
import { fotosAusGalerie, fotosMitKamera } from '@/lib/fotos';
import { Bildschirm } from '@/components/Bildschirm';
import { EintragFormular } from '@/components/EintragFormular';
import { Taste } from '@/components/Taste';
import { groessen } from '@/theme';

export default function NeuerEintrag() {
  const db = useSQLiteContext();
  const { kategorieId, vonId } = useLocalSearchParams<{ kategorieId?: string; vonId?: string }>();
  // Beim Kopieren: Vorlage aus dem bestehenden Eintrag (ohne Fotos, Verlauf, festen Termin)
  const [vorlage, setVorlage] = useState<Partial<EintragDaten> | null>(vonId ? null : { kategorie_id: kategorieId });
  const [kategorien, setKategorien] = useState<Kategorie[] | null>(null);
  const [standardUhrzeit, setStandardUhrzeit] = useState(STANDARD_UHRZEIT);
  const [vorbilder, setVorbilder] = useState<VorbildEintrag[]>([]);

  useEffect(() => {
    kategorienLaden(db).then(setKategorien);
    einstellungenLaden(db).then((e) => setStandardUhrzeit(e.uhrzeit));
    eintraegeLaden(db).then((l) => setVorbilder(l.map((e) => ({
      name: e.name, kategorie_id: e.kategorie_id, intervall: eintragIntervall(e), einmalig: !!e.einmalig, aufgabe: e.aufgabe,
    }))));
    if (vonId) {
      eintragLaden(db, vonId).then((e) => setVorlage(e ? {
        kategorie_id: e.kategorie_id,
        name: `${e.name} (Kopie)`,
        aufgabe: e.aufgabe,
        intervall: eintragIntervall(e),
        einmalig: !!e.einmalig,
        zusatzinfo: e.zusatzinfo,
        uhrzeit: e.uhrzeit,
        naechster_termin: e.einmalig ? heuteOderMontag(heute()) : null,
      } : {}));
    }
  }, [db, vonId]);

  if (!kategorien || !vorlage) return null;
  if (kategorien.length === 0) {
    return (
      <Bildschirm>
        <Text style={{ fontSize: groessen.schrift, marginBottom: 16 }}>Zuerst brauchst du mindestens eine Kategorie.</Text>
        <Taste titel="Kategorien anlegen" onPress={() => router.replace('/kategorien')} />
      </Bildschirm>
    );
  }

  return (
    <Bildschirm>
      {vonId ? <Stack.Screen options={{ title: 'Eintrag kopieren' }} /> : null}
      <EintragFormular
        neu
        kategorien={kategorien}
        standardUhrzeit={standardUhrzeit}
        vorbilder={vorbilder}
        start={vorlage}
        onFotoKamera={fotosMitKamera}
        onFotoGalerie={fotosAusGalerie}
        onAbbrechen={() => router.back()}
        onSpeichern={async ({ daten, zuletztAm, neueFotos }) => {
          const id = await eintragAnlegen(db, daten);
          for (const f of neueFotos) await fotoSpeichern(db, { eintragId: id }, f);
          if (zuletztAm) await durchfuehrungAnlegen(db, { eintragId: id, datum: zuletztAm, beschreibung: 'Übernommen beim Anlegen des Eintrags', naechsterTermin: daten.naechster_termin });
          erinnerungenNeuPlanen(db);
          router.replace({ pathname: '/eintrag/[id]', params: { id } });
        }}
      />
    </Bildschirm>
  );
}

