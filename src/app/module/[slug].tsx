import { useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { StatePanel } from '@/components/state-panel';
import { moduleBySlug } from '@/data/modules';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useScrollToTopOnMount } from '@/hooks/use-scroll-to-top-on-mount';
import { ModuleWorkspace } from '@/screens/module-workspace';
import { DivinationModule } from '@/types/domain';

export default function ModuleRoute() {
  const router = useRouter();
  useScrollToTopOnMount();
  const params = useLocalSearchParams<{ slug: string }>();
  const { ready, authenticated } = useRequireAuth();
  const slug = params.slug as DivinationModule;
  const module = moduleBySlug[slug];

  if (!ready || !authenticated) return <LoadingScreen />;
  if (!module) {
    return (
      <StatePanel
        actionLabel="返回观象首页"
        body="这个术数入口不存在或链接已失效，请从首页重新选择。"
        onAction={() => router.replace('/home')}
        state="unknown"
        testID="module-unknown-route"
        title="找不到这个术数入口"
      />
    );
  }

  return <ModuleWorkspace slug={slug} />;
}
