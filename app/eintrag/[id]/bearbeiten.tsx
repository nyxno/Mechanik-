import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { eintragAendern, eintragIntervall, eintragLaden, eintragLoeschen, fotoLoeschen, fotoSpeichern, fotosZuEintrag, kategorienLaden } from '@/db/repo';
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

  const laden = useCallback(async () => {
    const [e, k, f] = await Promise.all([eintragLaden(db, id), kategorienLaden(db), fotosZuEintrag(db, id)]);
    setEintrag(e); setKategorien(k); setFotos(f);
  }, [db, id]);
  useEffect(() => { laden(); }, [laden]);

  if (!eintrag) return null;

  const loeschen = () =>
    Alert.alert(`„${eintrag.name}“ löschen?`, 'Der Eintrag mit allen Durchführungen und Fotos wird gelöscht.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => { await eintragLoeschen(db, id); router.dismissTo('/'); } },
    ]);

  return (
    <Bildschirm>
      <EintragFormular
        neu={false}
        kategorien={kategorien}
        start={{ kategorie_id: eintrag.kategorie_id, name: eintrag.name, aufgabe: eintrag.aufgabe, intervall: eintragIntervall(eintrag), zusatzinfo: eintrag.zusatzinfo }}
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
          router.back();
        }}
      />
      <Taste titel="🗑 Eintrag löschen" onPress={loeschen} art="gefahr" style={{ marginTop: 24 }} />
    </Bildschirm>
  );
}
