import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { Atmosphere } from '@/components/atmosphere';
import { BrandMark } from '@/components/brand-mark';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { UI_STATE_COPY } from '@/constants/ui-copy';
import { useApp } from '@/state/app-context';

export function LoginScreen() {
  const { width } = useWindowDimensions();
  const { signInWithPhone, signInWithProvider } = useApp();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'info' | 'error'>('info');
  const [loading, setLoading] = useState(false);
  const phoneInputRef = useRef<TextInput | null>(null);
  const codeInputRef = useRef<TextInput | null>(null);
  const isWide = width >= 820;

  const submit = async () => {
    setLoading(true);
    setMessage('');
    const result = await signInWithPhone(phone, code);
    if (!result.ok) {
      setMessageTone('error');
      setMessage(result.message ?? UI_STATE_COPY.failure.body);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Atmosphere />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.brandColumn, isWide && styles.brandColumnWide]}>
            <BrandMark size={72} />
            <Text style={styles.eyebrow}>PRIVATE OBSERVATORY</Text>
            <Text accessibilityRole="header" style={styles.title}>
              观象<Text style={styles.titleDot}>·</Text>命盘
            </Text>
            <Text style={styles.tagline}>以星为镜，以象观心</Text>
            <View style={styles.axisLine} />
            <Text style={styles.intro}>
              八字、六爻、紫微与星盘，统一记录每一次推演的输入、过程与结果。
            </Text>
          </View>

          <View
            accessibilityLabel="账户登录表单"
            style={[styles.loginPanel, isWide && styles.loginPanelWide]}
            testID="login-panel">
            <Text style={styles.panelKicker}>进入观象台</Text>
            <Text accessibilityRole="header" style={styles.panelTitle}>登录你的账户</Text>
            <Text style={styles.panelDescription}>
              首版仅在当前设备保存命盘；手机号、Apple、微信入口目前均为本地原型，不连接真实服务。
            </Text>

            <Text style={styles.inputLabel}>手机号</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+86</Text>
              </View>
              <TextInput
                accessibilityLabel="手机号"
                autoComplete="tel"
                keyboardType="phone-pad"
                maxLength={11}
                onChangeText={setPhone}
                onSubmitEditing={() => codeInputRef.current?.focus()}
                placeholder="请输入 11 位手机号"
                placeholderTextColor="#65736D"
                ref={phoneInputRef}
                returnKeyType="next"
                style={[styles.input, styles.phoneInput]}
                textContentType="telephoneNumber"
                value={phone}
              />
            </View>

            <Text style={styles.inputLabel}>验证码</Text>
            <View style={styles.codeRow}>
              <TextInput
                accessibilityLabel="短信验证码"
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={setCode}
                onSubmitEditing={() => void submit()}
                placeholder="6 位验证码"
                placeholderTextColor="#65736D"
                ref={codeInputRef}
                returnKeyType="done"
                style={[styles.input, styles.codeInput]}
                value={code}
              />
              <Pressable
                accessibilityLabel="获取验证码"
                accessibilityHint="当前为本地原型，不会发送短信；输入任意 6 位数字即可继续。"
                accessibilityRole="button"
                onPress={() => {
                  setMessageTone('info');
                  setMessage('当前为本地原型，不会发送短信；请输入任意 6 位数字。');
                  codeInputRef.current?.focus();
                }}
                style={({ pressed }) => [styles.codeButton, pressed && styles.pressed]}>
                <Text style={styles.codeButtonText}>获取验证码</Text>
              </Pressable>
            </View>

            {!!message && (
              <Text
                accessibilityLabel={messageTone === 'error' ? `错误：${message}` : message}
                accessibilityLiveRegion="polite"
                accessibilityRole={messageTone === 'error' ? 'alert' : 'text'}
                style={[styles.helperText, messageTone === 'error' && styles.errorText]}>
                {message}
              </Text>
            )}

            <ActionButton
              accessibilityLabel={loading ? '正在使用手机号进入观象' : '使用手机号进入观象'}
              accessibilityHint="本地原型会在当前设备保存身份信息。"
              loading={loading}
              onPress={submit}
              style={styles.primaryButton}>
              进入观象
            </ActionButton>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>其他方式</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.providerRow}>
              <ActionButton
                accessibilityLabel="使用 Apple 登录"
                accessibilityHint="当前为本地原型，不连接 Apple 服务。"
                onPress={() => signInWithProvider('apple')}
                style={styles.providerButton}
                variant="secondary">
                Apple 登录
              </ActionButton>
              <ActionButton
                accessibilityLabel="使用微信登录"
                accessibilityHint="当前为本地原型，不连接微信服务。"
                onPress={() => signInWithProvider('wechat')}
                style={styles.providerButton}
                variant="secondary">
                微信登录
              </ActionButton>
            </View>

            <Text style={styles.privacyText}>
              登录即表示你已阅读并同意《用户协议》与《隐私政策》。命理结果仅供文化研究与自我观察。
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: palette.obsidian },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.mobileGutter,
    paddingVertical: spacing.x8,
    gap: spacing.x8,
  },
  scrollContentWide: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.desktopGutter,
    gap: spacing.x18,
  },
  brandColumn: { alignItems: 'center' },
  brandColumnWide: { flex: 1, alignItems: 'flex-start', paddingLeft: spacing.x6 },
  eyebrow: {
    marginTop: spacing.x6,
    color: palette.brass,
    fontFamily: fontFamilies.data,
    fontSize: 10,
    letterSpacing: 3.2,
  },
  title: {
    marginTop: spacing.x3,
    color: palette.ricePaper,
    fontFamily: fontFamilies.display,
    fontSize: 42,
    letterSpacing: 5,
  },
  titleDot: { color: palette.brass },
  tagline: {
    marginTop: spacing.x2,
    color: palette.paleBrass,
    fontFamily: fontFamilies.display,
    fontSize: 17,
    letterSpacing: 5,
  },
  axisLine: {
    width: 56,
    height: 1,
    marginTop: spacing.x6,
    backgroundColor: palette.brass,
  },
  intro: {
    maxWidth: 430,
    marginTop: spacing.x5,
    color: palette.ashGreen,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  loginPanel: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: radii.panel,
    backgroundColor: 'rgba(8, 26, 22, 0.88)',
    padding: spacing.x6,
  },
  loginPanelWide: { flex: 1, padding: spacing.x8 },
  panelKicker: {
    color: palette.brass,
    fontFamily: fontFamilies.body,
    fontSize: 11,
    letterSpacing: 3,
  },
  panelTitle: {
    marginTop: spacing.x2,
    color: palette.ricePaper,
    fontFamily: fontFamilies.display,
    fontSize: 28,
    letterSpacing: 2,
  },
  panelDescription: {
    marginTop: spacing.x3,
    marginBottom: spacing.x6,
    color: palette.ashGreen,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 21,
  },
  inputLabel: {
    marginBottom: spacing.x2,
    color: palette.ricePaper,
    fontFamily: fontFamilies.body,
    fontSize: 13,
  },
  phoneRow: { flexDirection: 'row', marginBottom: spacing.x4 },
  countryCode: {
    width: 62,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: palette.hairlineStrong,
    borderTopLeftRadius: radii.input,
    borderBottomLeftRadius: radii.input,
    backgroundColor: palette.obsidian,
  },
  countryCodeText: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 14 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
    backgroundColor: palette.obsidian,
    color: palette.ricePaper,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    paddingHorizontal: spacing.x4,
  },
  phoneInput: { flex: 1, borderTopRightRadius: radii.input, borderBottomRightRadius: radii.input },
  codeRow: { flexDirection: 'row', gap: spacing.x3 },
  codeInput: { flex: 1, minWidth: 0, flexShrink: 1, borderRadius: radii.input },
  codeButton: {
    width: 108,
    flexShrink: 0,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
    borderRadius: radii.input,
  },
  codeButtonText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 13 },
  helperText: {
    marginTop: spacing.x3,
    color: palette.patina,
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: { color: '#E4A89A' },
  primaryButton: { marginTop: spacing.x5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, marginVertical: spacing.x6 },
  divider: { flex: 1, height: 1, backgroundColor: palette.hairline },
  dividerText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12 },
  providerRow: { flexDirection: 'row', gap: spacing.x3 },
  providerButton: { flex: 1 },
  privacyText: {
    marginTop: spacing.x6,
    color: '#718078',
    fontFamily: fontFamilies.body,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: { opacity: 0.7 },
});
