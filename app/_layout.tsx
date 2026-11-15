import { Suspense, useEffect } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { DB_NAME, migrieren } from '@/db/schema';
import { berechtigungAnfragen, erinnerungenEinrichten, erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import { farben, groessen } from '@/theme';

function Laden() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: farben.hintergrund }}>
      <ActivityIndicator size="large" color={farben.primaer} />
      <Text style={{ marginTop: 12, fontSize: groessen.schrift }}>Daten werden geladen …</Text>
    </View>
  );
}

/** Richtet Erinnerungen ein, plant sie neu und öffnet den Eintrag, wenn eine Meldung angetippt wird. */
function ErinnerungsSteuerung() {
  const db = useSQLiteContext();

  useEffect(() => {
    (async () => {
      await erinnerungenEinrichten();
      await berechtigungAnfragen();
      await erinnerungenNeuPlanen(db);
    })();
    // Beim Öffnen und Verlassen der App neu planen (z. B. für die Überfällig-Meldung).
    const sub = AppState.addEventListener('change', (z) => {
      if (z === 'active' || z === 'background') erinnerungenNeuPlanen(db);
    });
    return () => sub.remove();
  }, [db]);

  useEffect(() => {
    const oeffnen = (n: Notifications.Notification) => {
      const id = n.request.content.data?.eintragId;
      if (typeof id === 'string' && id) router.push({ pathname: '/eintrag/[id]', params: { id } });
      else router.navigate('/');
    };
    const letzte = Notifications.getLastNotificationResponse();
    if (letzte?.notification) {
      setTimeout(() => oeffnen(letzte.notification), 300);
      Notifications.clearLastNotificationResponse();
    }
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      if (r.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) oeffnen(r.notification);
    });
    return () => sub.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <Suspense fallback={<Laden />}>
      <SQLiteProvider databaseName={DB_NAME} onInit={migrieren} useSuspense>
        <StatusBar style="dark" />
        <ErinnerungsSteuerung />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: farben.karte },
            headerTitleStyle: { fontSize: 20, fontWeight: '700' },
            headerTintColor: farben.primaer,
            headerBackTitle: 'Zurück',
            contentStyle: { backgroundColor: farben.hintergrund },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Übersicht' }} />
          <Stack.Screen name="kategorien" options={{ title: 'Kategorien' }} />
          <Stack.Screen name="einstellungen" options={{ title: 'Erinnerungen' }} />
          <Stack.Screen name="eintrag/neu" options={{ title: 'Neuer Eintrag' }} />
          <Stack.Screen name="eintrag/[id]/index" options={{ title: 'Eintrag' }} />
          <Stack.Screen name="eintrag/[id]/bearbeiten" options={{ title: 'Eintrag bearbeiten' }} />
          <Stack.Screen name="eintrag/[id]/durchfuehrung" options={{ title: 'Durchführung erfassen' }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
