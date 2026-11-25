// Etikett fotografieren und Text erkennen (am Handy, Google ML Kit über die Play-Dienste).
import * as ImagePicker from 'expo-image-picker';
import { extractTextFromImage, isSupported } from 'expo-text-extractor';
import { fotoUebernehmen } from './fotos';
import { zeilenAusTexten } from './etikett';

export const etikettLesenMoeglich = isSupported;

/** Kamera öffnen, Etikett fotografieren, Text erkennen. null = abgebrochen. Das Foto wird gespeichert. */
export async function etikettFotografieren(): Promise<{ zeilen: string[]; datei: string } | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ quality: 0.9 });
  if (res.canceled || !res.assets?.[0]) return null;
  const uri = res.assets[0].uri;
  const texte = await extractTextFromImage(uri);
  const datei = await fotoUebernehmen(uri);
  return { zeilen: zeilenAusTexten(texte), datei };
}
