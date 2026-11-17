import { StyleSheet, Text, View } from 'react-native';
import type { Status } from '@/lib/faelligkeit';
import { statusFarben, sz } from '@/theme';

export function StatusBadge({ status, text }: { status: Status; text?: string }) {
  const f = statusFarben(status);
  return (
    <View style={[s.badge, { backgroundColor: f.vorder }]}>
      <Text style={s.text}>{text ?? f.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  text: { color: '#fff', fontWeight: '700', fontSize: sz(14) },
});
