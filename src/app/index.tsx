import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { LoadingScreen } from '@/components/loading-screen';
import { LoginScreen } from '@/screens/login-screen';
import { useApp } from '@/state/app-context';

export default function IndexScreen() {
  const router = useRouter();
  const { ready, user } = useApp();

  useEffect(() => {
    if (ready && user) router.replace('/home');
  }, [ready, router, user]);

  if (!ready || user) return <LoadingScreen />;
  return <LoginScreen />;
}

