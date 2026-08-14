import { LoadingScreen } from '@/components/loading-screen';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { RecordsScreen } from '@/screens/records-screen';

export default function RecordsRoute() {
  const { ready, authenticated } = useRequireAuth();
  if (!ready || !authenticated) return <LoadingScreen />;
  return <RecordsScreen />;
}
