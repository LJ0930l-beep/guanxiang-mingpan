import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useApp } from '@/state/app-context';

export function useRequireAuth() {
  const router = useRouter();
  const { ready, user } = useApp();

  useEffect(() => {
    if (ready && !user) router.replace('/');
  }, [ready, router, user]);

  return { ready, authenticated: Boolean(user) };
}

