import { LoadingScreen } from '@/components/loading-screen';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { ProfilesScreen } from '@/screens/profiles-screen';

export default function ProfilesRoute() {
  const { ready, authenticated } = useRequireAuth();
  if (!ready || !authenticated) return <LoadingScreen />;
  return <ProfilesScreen />;
}

