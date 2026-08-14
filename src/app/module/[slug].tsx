import { useLocalSearchParams } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { moduleBySlug } from '@/data/modules';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useScrollToTopOnMount } from '@/hooks/use-scroll-to-top-on-mount';
import { ModuleWorkspace } from '@/screens/module-workspace';
import { DivinationModule } from '@/types/domain';

export default function ModuleRoute() {
  useScrollToTopOnMount();
  const params = useLocalSearchParams<{ slug: string }>();
  const { ready, authenticated } = useRequireAuth();
  const slug = params.slug as DivinationModule;
  const module = moduleBySlug[slug];

  if (!ready || !authenticated) return <LoadingScreen />;
  if (!module) return null;

  return <ModuleWorkspace slug={slug} />;
}
