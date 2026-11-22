// Fenster: Hitze-/Staubstunden einer erledigten Arbeit eintragen oder ändern.
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { durchfuehrungZulagenSetzen } from '@/db/repo';
import { farben, groessen } from '@/theme';
import { StundenWahl } from './StundenWahl';
import { Taste } from './Taste';

export interface ZulagenZiel { id: string; titel: string; hitze: number; staub: number }

export function ZulagenDialog({ ziel, onFertig }: { ziel: ZulagenZiel | null; onFertig: (geaendert: boolean) => void }) {
  const db = useSQLiteContext();
  const [hitze, setHitze] = useState(0);
  const [staub, setStaub] = useState(0);
  useEffect(() => { if (ziel) { setHitze(ziel.hitze); setStaub(ziel.staub); } }, [ziel]);

  return (
    <Modal visible={!!ziel} transparent animationType="slide" onRequestClose={() => onFertig(false)}>
      <View style={s.hinter}>
        <View style={s.fenster}>
          <Text style={s.titel}>⏱ Zulagen</Text>
          {ziel ? <Text style={s.unter}>{ziel.titel}</Text> : null}
          <StundenWahl symbol="🔥" label="Hitzestunden" wert={hitze} onChange={setHitze} />
          <StundenWahl symbol="🌫" label="Staubstunden" wert={staub} onChange={setStaub} />
          <Taste titel="✓ Speichern" onPress={async () => {
            if (ziel) await durchfuehrungZulagenSetzen(db, ziel.id, hitze, staub);
            onFertig(true);
          }} />
          <Taste titel="Abbrechen" art="sekundaer" onPress={() => onFertig(false)} style={{ marginTop: 10 }} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  hinter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  fenster: { backgroundColor: farben.hintergrund, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: groessen.abstand, paddingBottom: 32 },
  titel: { fontSize: groessen.titel, fontWeight: '800', color: farben.text },
  unter: { fontSize: groessen.schrift, color: farben.textLeicht, marginBottom: 12 },
});
