# Hinweise für KI-Assistenten (Claude, Copilot …)

- Expo/React Native-App, **Expo SDK 58**. Expo ändert sich schnell: vor Änderungen an Expo-APIs
  die passende Doku lesen: `https://docs.expo.dev/versions/v58.0.0/` und `https://docs.expo.dev/llms.txt`.
- Pakete immer mit `npx expo install <paket>` hinzufügen (passende Versionen zum SDK).
- `npm install` braucht derzeit `--legacy-peer-deps` (Peer-Konflikt react-dom in Expo-Abhängigkeiten).
- Vor Abschluss: `npm test` und `npx tsc --noEmit`.
- Ordner `android/` und `ios/` werden generiert (`npx expo prebuild`) und nicht eingecheckt.
  Natives verhalten über `app.json` und Config-Plugins steuern.
- Alle Datenbankzugriffe gehören in `src/db/repo.ts`; Bildschirme in `app/`; Logik in `src/lib/`.
- Sprache in Oberfläche, Kommentaren und Doku: Deutsch. Der Nutzer ist Handwerker, kein Programmierer:
  Änderungen einfach erklären.
