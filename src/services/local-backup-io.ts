import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

const BACKUP_MIME_TYPE = 'application/json';

function backupFilename() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return `guanxiang-backup-${stamp}.json`;
}

export async function exportBackupFile(text: string): Promise<'downloaded' | 'shared'> {
  const filename = backupFilename();

  if (Platform.OS === 'web') {
    if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
      throw new Error('当前环境不支持下载备份文件。');
    }
    const blob = new Blob([text], { type: `${BACKUP_MIME_TYPE};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return 'downloaded';
  }

  if (!FileSystem.cacheDirectory) throw new Error('当前设备没有可用的临时文件目录。');
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, text, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('当前设备没有可用的分享面板，请稍后重试。');
  await Sharing.shareAsync(uri, {
    dialogTitle: '导出观象本机备份',
    mimeType: BACKUP_MIME_TYPE,
    UTI: 'public.json',
  });
  return 'shared';
}

export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: BACKUP_MIME_TYPE,
    copyToCacheDirectory: true,
    multiple: false,
    base64: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (Platform.OS === 'web' && asset.file) return asset.file.text();
  return FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
}
