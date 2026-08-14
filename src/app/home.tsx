import { LoadingScreen } from '@/components/loading-screen';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { HomeScreen } from '@/screens/home-screen';

export default function HomeRoute() {
  const { ready, authenticated } = useRequireAuth();
  if (!ready || !authenticated) return <LoadingScreen />;
  return <HomeScreen />;
}

