import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { LoadingScreen } from '@/components/loading-screen';
import { fontFamilies, palette, spacing } from '@/constants/guanxiang';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { QuietScreen } from '@/screens/quiet-screen';
import { exportBackupFile, pickBackupFile } from '@/services/local-backup-io';
import type { ImportMode, ImportPreview } from '@/storage/import-plan';
import { useApp } from '@/state/app-context';

export default function SettingsRoute() {
  const router = useRouter();
  const { ready, authenticated } = useRequireAuth();
  const { signOut, clearLocalData, createLocalBackup, previewLocalBackup, restoreLocalBackup, createEncryptedLocalBackup, previewEncryptedLocalBackup, restoreEncryptedLocalBackup, profiles, readings, storageBlockedKeys } = useApp();
  const [error, setError] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  if (!ready || !authenticated) return <LoadingScreen />;

  const clearBlocked = storageBlockedKeys.length > 0;

  const formatImportPreview = (preview: ImportPreview) => {
    const current = preview.currentSummary;
    const incoming = preview.incomingSummary;
    const conflictText = preview.conflicts.length === 0
      ? '未发现重复 ID。'
      : `发现 ${preview.conflicts.length} 个重复 ID；合并导入默认保留本机，替换导入才会使用文件版本。`;
    return `导入前不会写入本机。\n\n当前：${current.profileCount} 个命主、${current.readingCount} 条记录、${current.feedbackCount} 条反馈、${current.baziDeepSnapshotCount} 条八字深度快照。\n文件：${incoming.profileCount} 个命主、${incoming.readingCount} 条记录、${incoming.feedbackCount} 条反馈、${incoming.baziDeepSnapshotCount} 条八字深度快照。\n\n${conflictText}`;
  };

  const presentImportPreview = (
    preview: ImportPreview,
    restore: (mode: ImportMode) => Promise<void>,
    successMessage: string,
  ) => {
    const runRestore = async (mode: ImportMode) => {
      try {
        await restore(mode);
        Alert.alert('恢复完成', successMessage);
      } catch (operationError) {
        setError(operationError instanceof Error ? operationError.message : '备份版本不兼容，无法恢复。');
      } finally {
        setBackupBusy(false);
      }
    };
    Alert.alert(
      '导入预览',
      formatImportPreview(preview),
      [
        { text: '取消', style: 'cancel', onPress: () => setBackupBusy(false) },
        { text: '合并导入', onPress: () => { void runRestore('merge'); } },
        { text: '替换本机', style: 'destructive', onPress: () => { void runRestore('replace'); } },
      ],
    );
  };

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

  const exportEncryptedBackup = async () => {
    setError('');
    setBackupBusy(true);
    try {
      const text = await createEncryptedLocalBackup(backupPassword);
      const mode = await exportBackupFile(text, { encrypted: true });
      Alert.alert(mode === 'downloaded' ? '加密备份已下载' : '加密备份已准备好', '请将文件与备份密码分开保存；应用不会替你找回密码。');
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : '导出加密备份失败，请稍后重试。');
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
      const preview = previewLocalBackup(raw, 'merge');
      presentImportPreview(preview, (mode) => restoreLocalBackup(raw, mode), '本机资料已经恢复。');
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : '选择备份文件失败，请稍后重试。');
      setBackupBusy(false);
    }
  };

  const importEncryptedBackup = async () => {
    setError('');
    setBackupBusy(true);
    try {
      const raw = await pickBackupFile();
      if (!raw) {
        setBackupBusy(false);
        return;
      }
      const preview = await previewEncryptedLocalBackup(raw, backupPassword, 'merge');
      presentImportPreview(preview, (mode) => restoreEncryptedLocalBackup(raw, backupPassword, mode), '加密备份中的本机资料已经恢复。');
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : '选择加密备份文件失败，请稍后重试。');
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
      description="账户仅用于身份与未来权益；命主与命盘仍保存在本机。你可以用密码保护的文件在设备之间主动迁移。"
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
          <Text style={styles.backupHint}>普通 JSON 便于检查；加密备份使用本机密码保护。密码不会上传，也无法找回。</Text>
          <View style={styles.backupActions}>
            <ActionButton accessibilityLabel="导出本机备份文件" disabled={clearBlocked || backupBusy} loading={backupBusy} onPress={exportBackup} style={styles.backupButton}>导出备份</ActionButton>
            <ActionButton accessibilityLabel="导入本机备份文件" disabled={clearBlocked || backupBusy} onPress={importBackup} style={styles.backupButton} variant="quiet">导入备份</ActionButton>
          </View>
          <TextInput accessibilityLabel="加密备份密码" autoCapitalize="none" autoCorrect={false} onChangeText={setBackupPassword} placeholder="加密备份密码（至少 8 位）" placeholderTextColor="#65736D" secureTextEntry style={styles.passwordInput} value={backupPassword} />
          <View style={styles.backupActions}>
            <ActionButton accessibilityLabel="导出加密本机备份文件" disabled={clearBlocked || backupBusy} loading={backupBusy} onPress={exportEncryptedBackup} style={styles.backupButton}>导出加密备份</ActionButton>
            <ActionButton accessibilityLabel="导入加密本机备份文件" disabled={clearBlocked || backupBusy} onPress={importEncryptedBackup} style={styles.backupButton} variant="quiet">导入加密备份</ActionButton>
          </View>
          <Text style={styles.backupWarning}>普通备份是可读 JSON；加密备份采用 scrypt + AES-256-GCM。请把文件和密码分开保管。</Text>
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
  passwordInput: { minHeight: 44, marginTop: spacing.x4, borderWidth: 1, borderColor: palette.hairline, borderRadius: 10, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 12, paddingHorizontal: spacing.x3 },
  backupWarning: { marginTop: spacing.x3, color: '#C8A38E', fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  error: { marginTop: spacing.x3, color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18, textAlign: 'center' },
});
