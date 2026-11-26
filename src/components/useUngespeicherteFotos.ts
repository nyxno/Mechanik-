// Neu aufgenommene Fotos, die nie gespeichert wurden (Abbrechen, Zurück-Taste), wieder vom Handy löschen.
import { useEffect, useRef } from 'react';
import { fotoDateiLoeschen } from '@/lib/fotos';

/** Gibt eine Funktion zurück, die nach erfolgreichem Speichern aufgerufen wird. */
export function useUngespeicherteFotos(dateien: string[]): () => void {
  const aktuell = useRef(dateien);
  aktuell.current = dateien;
  const gespeichert = useRef(false);
  useEffect(() => () => {
    if (!gespeichert.current) aktuell.current.forEach((d) => fotoDateiLoeschen(d));
  }, []);
  return () => { gespeichert.current = true; };
}
