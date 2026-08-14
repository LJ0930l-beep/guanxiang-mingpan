import { useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { QuietScreen } from '@/screens/quiet-screen';
import { useApp } from '@/state/app-context';

export default function SettingsRoute() {
  const router = useRouter();
  const { ready, authenticated } = useRequireAuth();
  const { signOut } = useApp();
  if (!ready || !authenticated) return <LoadingScreen />;

  return (
    <QuietScreen
      actionLabel="退出当前账户"
      description="账户仅用于身份与未来权益；命主与命盘仍保存在本机。加密备份入口将在排盘核心完成后开放。"
      kicker="ACCOUNT & PRIVACY"
      onAction={async () => {
        await signOut();
        router.replace('/');
      }}
      title="我的观象台"
    />
  );
}

