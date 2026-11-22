// Untere Leiste mit 4 großen Tasten: Start · Woche · Kalender · Einstellungen.
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { farben, groessen, sz } from '@/theme';
import { formatMitTag, heute } from '@/lib/datum';

function Symbol({ zeichen, aktiv }: { zeichen: string; aktiv: boolean }) {
  return <Text style={{ fontSize: sz(26), opacity: aktiv ? 1 : 0.55 }}>{zeichen}</Text>;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: farben.karte },
        headerTitleStyle: { fontSize: sz(20), fontWeight: '700' },
        headerTintColor: farben.primaer,
        sceneStyle: { backgroundColor: farben.hintergrund },
        tabBarActiveTintColor: farben.primaer,
        tabBarInactiveTintColor: farben.textLeicht,
        tabBarStyle: {
          height: groessen.tasteHoehe + 18 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
          borderTopWidth: 2,
          borderTopColor: farben.rahmen,
          backgroundColor: farben.karte,
        },
        tabBarLabelStyle: { fontSize: sz(12), fontWeight: '800' },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: `Heute · ${formatMitTag(heute())}`, tabBarLabel: 'Start', tabBarIcon: ({ focused }) => <Symbol zeichen="🏠" aktiv={focused} /> }} />
      <Tabs.Screen name="woche" options={{ title: 'Diese & nächste Woche', tabBarLabel: 'Woche', tabBarIcon: ({ focused }) => <Symbol zeichen="📅" aktiv={focused} /> }} />
      <Tabs.Screen name="kalender" options={{ title: 'Kalender', tabBarLabel: 'Kalender', tabBarIcon: ({ focused }) => <Symbol zeichen="🗓" aktiv={focused} /> }} />
      <Tabs.Screen name="einstellungen" options={{ title: 'Einstellungen', tabBarLabel: 'Einstellungen', tabBarIcon: ({ focused }) => <Symbol zeichen="⚙" aktiv={focused} /> }} />
    </Tabs>
  );
}
