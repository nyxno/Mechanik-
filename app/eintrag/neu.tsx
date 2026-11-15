import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungAnlegen, eintragAnlegen, einstellungenLaden, fotoSpeichern, kategorienLaden } from '@/db/repo';
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
  const { kategorieId } = useLocalSearchParams<{ kategorieId?: string }>();
  const [kategorien, setKategorien] = useState<Kategorie[] | null>(null);
  const [standardUhrzeit, setStandardUhrzeit] = useState(STANDARD_UHRZEIT);

  useEffect(() => {
    kategorienLaden(db).then(setKategorien);
    einstellungenLaden(db).then((e) => setStandardUhrzeit(e.uhrzeit));
  }, [db]);

  if (!kategorien) return null;
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
      <EintragFormular
        neu
        kategorien={kategorien}
        standardUhrzeit={standardUhrzeit}
        start={{ kategorie_id: kategorieId }}
        onFotoKamera={fotosMitKamera}
        onFotoGalerie={fotosAusGalerie}
        onAbbrechen={() => router.back()}
        onSpeichern={async ({ daten, zuletztAm, neueFotos }) => {
          const id = await eintragAnlegen(db, daten);
          for (const f of neueFotos) await fotoSpeichern(db, { eintragId: id }, f);
          if (zuletztAm) await durchfuehrungAnlegen(db, id, zuletztAm, 'Übernommen beim Anlegen des Eintrags', daten.naechster_termin);
          erinnerungenNeuPlanen(db);
          router.replace({ pathname: '/eintrag/[id]', params: { id } });
        }}
      />
    </Bildschirm>
  );
}

