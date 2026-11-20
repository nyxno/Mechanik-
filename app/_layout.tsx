import { Suspense, useEffect } from 'react';
import { ActivityIndicator, Alert, AppState, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { DB_NAME, migrieren } from '@/db/schema';
import { AKTION_SCHLUMMERN, berechtigungAnfragen, erinnerungenEinrichten, erinnerungenNeuPlanen } from '@/lib/erinnerungen';
import { eintragLaden, eintragSchlummern, statistikGezeigtLaden } from '@/db/repo';
import { automatischZeigen, monatsSchluessel } from '@/lib/statistik';
import { formatMitTag, heute, schlummerZiel } from '@/lib/datum';
import { farben, groessen, sz } from '@/theme';

function Laden() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: farben.hintergrund }}>
      <ActivityIndicator size="large" color={farben.primaer} />
      <Text style={{ marginTop: 12, fontSize: groessen.schrift }}>Daten werden geladen …</Text>
    </View>
  );
}

let statistikGeoeffnet: string | null = null;

/** Richtet Erinnerungen ein, plant sie neu und öffnet den Eintrag, wenn eine Meldung angetippt wird. */
function ErinnerungsSteuerung() {
  const db = useSQLiteContext();

  useEffect(() => {
    (async () => {
      await erinnerungenEinrichten();
      await berechtigungAnfragen();
      await erinnerungenNeuPlanen(db);
    })();
    // Monatsübersicht automatisch zeigen (am Monatsende bzw. nachholen in den ersten Tagen des neuen Monats)
    const statistikPruefen = async () => {
      const ziel = automatischZeigen(new Date(), await statistikGezeigtLaden(db));
      if (!ziel) return;
      const key = monatsSchluessel(ziel.jahr, ziel.monat);
      if (statistikGeoeffnet === key) return; // nicht doppelt öffnen
      statistikGeoeffnet = key;
      router.push({ pathname: '/statistik', params: { monat: key } });
    };
    setTimeout(() => { statistikPruefen().catch(() => {}); }, 800);
    // Beim Öffnen und Verlassen der App neu planen (z. B. für die Überfällig-Meldung).
    const sub = AppState.addEventListener('change', (z) => {
      if (z === 'active' || z === 'background') erinnerungenNeuPlanen(db);
      if (z === 'active') statistikPruefen().catch(() => {});
    });
    return () => sub.remove();
  }, [db]);

  useEffect(() => {
    const oeffnen = (n: Notifications.Notification) => {
      const daten = n.request.content.data ?? {};
      if (daten.ziel === 'statistik') {
        router.push({ pathname: '/statistik', params: typeof daten.monat === 'string' ? { monat: daten.monat } : {} });
        return;
      }
      const id = daten.eintragId;
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
            headerTitleStyle: { fontSize: sz(20), fontWeight: '700' },
            headerTintColor: farben.primaer,
            headerBackTitle: 'Zurück',
            contentStyle: { backgroundColor: farben.hintergrund },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Übersicht' }} />
          <Stack.Screen name="kategorien" options={{ title: 'Kategorien' }} />
          <Stack.Screen name="erledigt" options={{ title: 'Erledigt' }} />
          <Stack.Screen name="hinweise" options={{ title: 'Erkannte Muster' }} />
          <Stack.Screen name="statistik" options={{ title: 'Monatsstatistik' }} />
          <Stack.Screen name="zulagen" options={{ title: 'Zulagen eintragen' }} />
          <Stack.Screen name="material/index" options={{ title: 'Materialliste' }} />
          <Stack.Screen name="material/[id]" options={{ title: 'Material' }} />
          <Stack.Screen name="eintrag/neu" options={{ title: 'Neuer Eintrag' }} />
          <Stack.Screen name="eintrag/[id]/index" options={{ title: 'Eintrag' }} />
          <Stack.Screen name="eintrag/[id]/bearbeiten" options={{ title: 'Eintrag bearbeiten' }} />
          <Stack.Screen name="eintrag/[id]/durchfuehrung" options={{ title: 'Durchführung erfassen' }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
