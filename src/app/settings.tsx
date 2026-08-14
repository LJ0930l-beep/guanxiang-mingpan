import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { LoadingScreen } from '@/components/loading-screen';
import { fontFamilies, palette, spacing } from '@/constants/guanxiang';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { QuietScreen } from '@/screens/quiet-screen';
import { useApp } from '@/state/app-context';

export default function SettingsRoute() {
  const router = useRouter();
  const { ready, authenticated } = useRequireAuth();
  const { signOut, clearLocalData, profiles, readings, storageBlockedKeys } = useApp();
  const [error, setError] = useState('');
  if (!ready || !authenticated) return <LoadingScreen />;

  const clearBlocked = storageBlockedKeys.length > 0;
  const confirmClear = () => {
    Alert.alert(
      '清除本机全部数据',
      '会删除账户原型、命主、排盘记录和当前选择，且无法撤销。确定继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearLocalData();
              router.replace('/');
            } catch (operationError) {
              setError(operationError instanceof Error ? operationError.message : '当前数据版本不兼容，无法安全清除。');
            }
          },
        },
      ],
    );
  };

  return (
    <QuietScreen
      actionLabel="退出当前账户"
      description="账户仅用于身份与未来权益；命主与命盘仍保存在本机。加密备份与跨设备恢复仍在开发中。"
      kicker="ACCOUNT & PRIVACY"
      onAction={async () => {
        await signOut();
        router.replace('/');
      }}
      title="我的观象台"
    >
      <View style={styles.dataPanel}>
        <Text style={styles.dataTitle}>本机数据</Text>
        <Text style={styles.dataText}>命主 {profiles.length} 位 · 排盘记录 {readings.length} 条</Text>
        <Text style={styles.dataHint}>当前版本默认只保存在设备本地。清除前请先完成你需要的备份。</Text>
        {clearBlocked && <Text style={styles.error}>检测到更新版本写入的数据，当前只读，清除操作已锁定。</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <ActionButton accessibilityLabel="清除本机全部数据" disabled={clearBlocked} onPress={confirmClear} style={styles.clearButton} variant="quiet">清除本机全部数据</ActionButton>
      </View>
    </QuietScreen>
  );
}

const styles = StyleSheet.create({
  dataPanel: { width: '100%', marginTop: spacing.x8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x5 },
  dataTitle: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 18, textAlign: 'center' },
  dataText: { marginTop: spacing.x2, color: palette.paleBrass, fontFamily: fontFamilies.data, fontSize: 12, textAlign: 'center' },
  dataHint: { marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18, textAlign: 'center' },
  clearButton: { marginTop: spacing.x4 },
  error: { marginTop: spacing.x3, color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18, textAlign: 'center' },
});
