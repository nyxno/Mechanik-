// Erinnerungen am Handy: Kanal mit eigenem Signalton einrichten, Berechtigung holen, Termine planen.
// Alle Erinnerungen werden lokal am Handy geplant – es braucht keinen Server und kein Internet.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { eintraegeLaden, einstellungenLaden, zuPlanEintraegen } from '@/db/repo';
import { erinnerungsPlan } from './erinnerungsplan';
import { monatsSchluessel, naechsteStatistik } from './statistik';

/** Android: Ton eines Kanals lässt sich nach dem Anlegen nicht mehr ändern -> neuer Ton = neue Kanal-ID. */
export const KANAL_ID = 'pruefungen-signal-v1';
export const TON = 'pruefung_signal.wav';
/** Benachrichtigungen zu einem Eintrag bekommen die Taste "Morgen erinnern". */
export const KATEGORIE_EINTRAG = 'eintrag-erinnerung';
export const AKTION_SCHLUMMERN = 'schlummern';

let eingerichtet = false;

/** Einmal beim App-Start: wie Meldungen angezeigt werden, wenn die App offen ist, und Kanal anlegen. */
export async function erinnerungenEinrichten(): Promise<void> {
  if (eingerichtet) return;
  eingerichtet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  await Notifications.setNotificationCategoryAsync(KATEGORIE_EINTRAG, [
    { identifier: AKTION_SCHLUMMERN, buttonTitle: '💤 Morgen erinnern', options: { opensAppToForeground: true } },
  ]).catch(() => {});
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(KANAL_ID, {
      name: 'Fällige Prüfungen und Wartungen',
      description: 'Erinnert an anstehende und überfällige Prüfungen.',
      importance: Notifications.AndroidImportance.HIGH,
      sound: TON,
      vibrationPattern: [0, 400, 200, 400, 200, 400],
      enableVibrate: true,
      lightColor: '#1D4ED8',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

/** Fragt (falls nötig) die Erlaubnis für Benachrichtigungen. true = erlaubt. */
export async function berechtigungAnfragen(): Promise<boolean> {
  await erinnerungenEinrichten();
  const aktuell = await Notifications.getPermissionsAsync();
  if (aktuell.granted) return true;
  if (!aktuell.canAskAgain) return false;
  const neu = await Notifications.requestPermissionsAsync();
  return neu.granted;
}

export async function berechtigungStatus(): Promise<{ erlaubt: boolean; genau: boolean }> {
  const p = await Notifications.getPermissionsAsync();
  let genau = true;
  if (Platform.OS === 'android') {
    try { genau = (await Notifications.getExactAlarmPermissionsAsync()).granted; } catch { genau = false; }
  }
  return { erlaubt: p.granted, genau };
}

/** Öffnet die Android-Einstellung "Wecker und Erinnerungen", damit Meldungen pünktlich kommen. */
export async function genaueUhrzeitErlauben(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try { return (await Notifications.requestExactAlarmPermissionsAsync()).granted; } catch { return false; }
}

let laeuft: Promise<number> | null = null;
let nochmal = false;

/**
 * Löscht alle geplanten Erinnerungen und plant sie aus den aktuellen Daten neu.
 * Wird bei App-Start, beim Verlassen der App und nach Änderungen aufgerufen. Gibt die Anzahl zurück.
 */
export function erinnerungenNeuPlanen(db: SQLiteDatabase): Promise<number> {
  if (laeuft) { nochmal = true; return laeuft; }
  laeuft = (async () => {
    let anzahl = 0;
    try {
      do {
        nochmal = false;
        anzahl = await planen(db);
      } while (nochmal);
    } catch (e) {
      console.warn('Erinnerungen konnten nicht geplant werden', e);
    } finally {
      laeuft = null;
    }
    return anzahl;
  })();
  return laeuft;
}

async function planen(db: SQLiteDatabase): Promise<number> {
  await erinnerungenEinrichten();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const [eintraege, einstellungen, recht] = await Promise.all([eintraegeLaden(db), einstellungenLaden(db), Notifications.getPermissionsAsync()]);
  if (!recht.granted) return 0;
  const plan = erinnerungsPlan(zuPlanEintraegen(eintraege), einstellungen, new Date());
  for (const e of plan) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: e.titel,
        body: e.text,
        sound: TON,
        data: { eintragId: e.eintragId },
        categoryIdentifier: e.eintragId ? KATEGORIE_EINTRAG : undefined,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: e.wann,
        channelId: KANAL_ID,
      },
    });
  }
  // Monatsübersicht am letzten Werktag des Monats
  if (einstellungen.aktiv) {
    const n = naechsteStatistik(new Date());
    const name = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][n.monat];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📊 Deine Monatsübersicht ${name}`,
        body: 'Zulagenstunden, erledigte Arbeiten und wo du am meisten warst – antippen zum Ansehen.',
        sound: TON,
        data: { ziel: 'statistik', monat: monatsSchluessel(n.jahr, n.monat) },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.wann, channelId: KANAL_ID },
    });
  }
  return plan.length;
}

/** Test: Meldung mit Signalton in wenigen Sekunden. */
export async function testErinnerung(sekunden = 5): Promise<boolean> {
  const ok = await berechtigungAnfragen();
  if (!ok) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: '🔧 Test: So klingt die Erinnerung', body: 'Wenn du das hörst und siehst, funktionieren die Erinnerungen.', sound: TON, data: { eintragId: null } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: sekunden, channelId: KANAL_ID },
  });
  return true;
}
