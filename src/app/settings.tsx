import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { LoadingScreen } from '@/components/loading-screen';
import { fontFamilies, palette, spacing } from '@/constants/guanxiang';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { QuietScreen } from '@/screens/quiet-screen';
import { exportBackupFile, pickBackupFile } from '@/services/local-backup-io';
import { useApp } from '@/state/app-context';

export default function SettingsRoute() {
  const router = useRouter();
  const { ready, authenticated } = useRequireAuth();
  const { signOut, clearLocalData, createLocalBackup, restoreLocalBackup, profiles, readings, storageBlockedKeys } = useApp();
  const [error, setError] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  if (!ready || !authenticated) return <LoadingScreen />;

  const clearBlocked = storageBlockedKeys.length > 0;

  const exportBackup = async () => {
    setError('');
    setBackupBusy(true);
    try {
      const mode = await exportBackupFile(createLocalBackup());
      Alert.alert(mode === 'downloaded' ? '备份已下载' : '备份已准备好', mode === 'downloaded' ? '请将下载的 JSON 文件保存在安全位置。' : '请在系统分享面板中选择保存到“文件”或发送到你的私人设备。');
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : '导出备份失败，请稍后重试。');
    } finally {
      setBackupBusy(false);
    }
  };

  const importBackup = async () => {
    setError('');
    setBackupBusy(true);
    try {
      const raw = await pickBackupFile();
      if (!raw) {
        setBackupBusy(false);
        return;
      }
      Alert.alert(
        '确认恢复本机备份',
        '恢复会替换当前账户、命主、排盘记录和当前选择。建议先导出一份当前备份。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确认恢复',
            style: 'destructive',
            onPress: async () => {
              setBackupBusy(true);
              try {
                await restoreLocalBackup(raw);
                Alert.alert('恢复完成', '本机资料已经恢复。');
              } catch (operationError) {
                setError(operationError instanceof Error ? operationError.message : '备份版本不兼容，无法恢复。');
              } finally {
                setBackupBusy(false);
              }
            },
          },
        ],
      );
      setBackupBusy(false);
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : '选择备份文件失败，请稍后重试。');
      setBackupBusy(false);
    }
  };

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
        <View style={styles.backupPanel}>
          <Text style={styles.backupTitle}>本机备份</Text>
          <Text style={styles.backupHint}>导出或恢复命主与排盘记录，文件只在你选择的位置流转。</Text>
          <View style={styles.backupActions}>
            <ActionButton accessibilityLabel="导出本机备份文件" disabled={clearBlocked || backupBusy} loading={backupBusy} onPress={exportBackup} style={styles.backupButton}>导出备份</ActionButton>
            <ActionButton accessibilityLabel="导入本机备份文件" disabled={clearBlocked || backupBusy} onPress={importBackup} style={styles.backupButton} variant="quiet">导入备份</ActionButton>
          </View>
          <Text style={styles.backupWarning}>当前备份为可读 JSON，尚未加密；请勿上传到公共位置。</Text>
        </View>
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
  backupPanel: { marginTop: spacing.x6, borderWidth: 1, borderColor: palette.hairline, borderRadius: 12, padding: spacing.x4 },
  backupTitle: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 15, textAlign: 'center' },
  backupHint: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18, textAlign: 'center' },
  backupActions: { flexDirection: 'row', gap: spacing.x3, marginTop: spacing.x4 },
  backupButton: { flex: 1, paddingHorizontal: spacing.x2 },
  backupWarning: { marginTop: spacing.x3, color: '#C8A38E', fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  error: { marginTop: spacing.x3, color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18, textAlign: 'center' },
});
