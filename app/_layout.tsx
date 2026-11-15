import { Suspense, useEffect } from 'react';
import { ActivityIndicator, Alert, AppState, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { DB_NAME, migrieren } from '@/db/schema';
import { AKTION_SCHLUMMERN, berechtigungAnfragen, erinnerungenEinrichten, erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import { eintragLaden, eintragSchlummern } from '@/db/repo';
import { formatMitTag, heute, schlummerZiel } from '@/lib/datum';
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
    // Taste "Morgen erinnern" in der Benachrichtigung: nur die Erinnerung verschieben, Prüffrist bleibt.
    const schlummern = async (n: Notifications.Notification) => {
      const id = n.request.content.data?.eintragId;
      Notifications.dismissNotificationAsync(n.request.identifier).catch(() => {});
      if (typeof id !== 'string' || !id) return;
      const ziel = schlummerZiel(heute());
      await eintragSchlummern(db, id, ziel);
      await erinnerungenNeuPlanen(db);
      const e = await eintragLaden(db, id);
      Alert.alert('💤 Verschoben', `${e?.name ?? 'Erinnerung'}: kommt wieder am ${formatMitTag(ziel)}.`);
    };
    const antwort = (r: Notifications.NotificationResponse) => {
      if (r.actionIdentifier === AKTION_SCHLUMMERN) schlummern(r.notification);
      else if (r.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) oeffnen(r.notification);
    };
    const letzte = Notifications.getLastNotificationResponse();
    if (letzte?.notification) {
      setTimeout(() => antwort(letzte), 300);
      Notifications.clearLastNotificationResponse();
    }
    const sub = Notifications.addNotificationResponseReceivedListener(antwort);
    return () => sub.remove();
  }, [db]);

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
          <Stack.Screen name="einstellungen" options={{ title: 'Einstellungen' }} />
          <Stack.Screen name="woche" options={{ title: 'Diese & nächste Woche' }} />
          <Stack.Screen name="erledigt" options={{ title: 'Erledigt' }} />
          <Stack.Screen name="eintrag/neu" options={{ title: 'Neuer Eintrag' }} />
          <Stack.Screen name="eintrag/[id]/index" options={{ title: 'Eintrag' }} />
          <Stack.Screen name="eintrag/[id]/bearbeiten" options={{ title: 'Eintrag bearbeiten' }} />
          <Stack.Screen name="eintrag/[id]/durchfuehrung" options={{ title: 'Durchführung erfassen' }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
