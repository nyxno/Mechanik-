import { Suspense } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { DB_NAME, migrieren } from '@/db/schema';
import { farben, groessen } from '@/theme';

function Laden() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: farben.hintergrund }}>
      <ActivityIndicator size="large" color={farben.primaer} />
      <Text style={{ marginTop: 12, fontSize: groessen.schrift }}>Daten werden geladen …</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <Suspense fallback={<Laden />}>
      <SQLiteProvider databaseName={DB_NAME} onInit={migrieren} useSuspense>
        <StatusBar style="dark" />
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
          <Stack.Screen name="eintrag/neu" options={{ title: 'Neuer Eintrag' }} />
          <Stack.Screen name="eintrag/[id]/index" options={{ title: 'Eintrag' }} />
          <Stack.Screen name="eintrag/[id]/bearbeiten" options={{ title: 'Eintrag bearbeiten' }} />
          <Stack.Screen name="eintrag/[id]/durchfuehrung" options={{ title: 'Durchführung erfassen' }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
