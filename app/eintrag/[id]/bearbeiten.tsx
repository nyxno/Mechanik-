import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { eintragAendern, eintragIntervall, eintragLaden, eintragLoeschen, einstellungenLaden, fotoLoeschen, fotoSpeichern, fotosZuEintrag, kategorieAnlegen, kategorienLaden } from '@/db/repo';
import { erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import { STANDARD_UHRZEIT } from '@/lib/uhrzeit';
import type { EintragMitStatus, Foto, Kategorie } from '@/db/typen';
import { fotoDateiLoeschen, fotosAusGalerie, fotosMitKamera } from '@/lib/fotos';
import { Bildschirm } from '@/components/Bildschirm';
import { EintragFormular } from '@/components/EintragFormular';
import { Taste } from '@/components/Taste';

export default function EintragBearbeiten() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [eintrag, setEintrag] = useState<EintragMitStatus | null>(null);
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [standardUhrzeit, setStandardUhrzeit] = useState(STANDARD_UHRZEIT);

  const laden = useCallback(async () => {
    const [e, k, f, ein] = await Promise.all([eintragLaden(db, id), kategorienLaden(db), fotosZuEintrag(db, id), einstellungenLaden(db)]);
    setEintrag(e); setKategorien(k); setFotos(f); setStandardUhrzeit(ein.uhrzeit);
  }, [db, id]);
  useEffect(() => { laden(); }, [laden]);

  if (!eintrag) return null;

  const loeschen = () =>
    Alert.alert(`„${eintrag.name}“ löschen?`, 'Der Eintrag mit allen Durchführungen und Fotos wird gelöscht.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => { await eintragLoeschen(db, id); erinnerungenNeuPlanen(db); router.dismissTo('/'); } },
    ]);

  return (
    <Bildschirm>
      <EintragFormular
        neu={false}
        kategorien={kategorien}
        standardUhrzeit={standardUhrzeit}
        onNeueKategorie={async (name, elternId) => {
          const nid = await kategorieAnlegen(db, name, elternId);
          setKategorien(await kategorienLaden(db));
          return nid;
        }}
        letzteDurchfuehrung={eintrag.letzte_durchfuehrung}
        start={{
          kategorie_id: eintrag.kategorie_id, name: eintrag.name, aufgabe: eintrag.aufgabe, intervall: eintragIntervall(eintrag),
          zusatzinfo: eintrag.zusatzinfo, naechster_termin: eintrag.naechster_termin, uhrzeit: eintrag.uhrzeit,
          einmalig: !!eintrag.einmalig,
        }}
        vorhandeneFotos={fotos.map((f) => f.datei)}
        onFotoLoeschen={async (datei) => {
          const f = fotos.find((x) => x.datei === datei);
          if (!f) return;
          await fotoLoeschen(db, f.id);
          fotoDateiLoeschen(datei);
          setFotos((alle) => alle.filter((x) => x.id !== f.id));
        }}
        onFotoKamera={fotosMitKamera}
        onFotoGalerie={fotosAusGalerie}
        onAbbrechen={() => router.back()}
        onSpeichern={async ({ daten, neueFotos }) => {
          await eintragAendern(db, id, daten);
          for (const f of neueFotos) await fotoSpeichern(db, { eintragId: id }, f);
          erinnerungenNeuPlanen(db);
          router.back();
        }}
      />
      <Taste titel="🗑 Eintrag löschen" onPress={loeschen} art="gefahr" style={{ marginTop: 24 }} />
    </Bildschirm>
  );
}
