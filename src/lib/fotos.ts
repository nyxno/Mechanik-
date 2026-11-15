// Fotos werden als Datei im App-Ordner "fotos" gespeichert; in der Datenbank steht nur der Dateiname.
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';

const ordner = () => {
  const d = new Directory(Paths.document, 'fotos');
  d.create({ intermediates: true, idempotent: true });
  return d;
};

/** Vollständige URI zu einem gespeicherten Foto. */
export function fotoUri(datei: string): string {
  return new File(Paths.document, 'fotos', datei).uri;
}

/** Kopiert ein ausgewähltes Bild dauerhaft in den App-Ordner. Gibt den Dateinamen zurück. */
export async function fotoUebernehmen(quellUri: string): Promise<string> {
  const quelle = new File(quellUri);
  const endung = (quelle.extension || '.jpg').toLowerCase();
  const name = `${Crypto.randomUUID()}${endung.startsWith('.') ? endung : `.${endung}`}`;
  const ziel = new File(ordner(), name);
  await quelle.copy(ziel);
  return name;
}

export function fotoDateiLoeschen(datei: string): void {
  try {
    const f = new File(Paths.document, 'fotos', datei);
    if (f.exists) f.delete();
  } catch {
    // Datei fehlt schon – egal.
  }
}

/** Kamera öffnen. Gibt gespeicherte Dateinamen zurück (leer bei Abbruch). */
export async function fotosMitKamera(): Promise<string[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return [];
  const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  if (res.canceled) return [];
  return Promise.all(res.assets.map((a) => fotoUebernehmen(a.uri)));
}

/** Galerie öffnen (Mehrfachauswahl). Gibt gespeicherte Dateinamen zurück. */
export async function fotosAusGalerie(): Promise<string[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
  });
  if (res.canceled) return [];
  return Promise.all(res.assets.map((a) => fotoUebernehmen(a.uri)));
}
