import { queryMaasProviders } from '@/pages/maas-provider/apis';
import { isDecisionServiceType } from '@/pages/maas-provider/config/providers';
import type { MaasProviderItem } from '@/pages/maas-provider/config/types';
import { useEffect, useState } from 'react';

const useDecisionServiceProviders = (providerId?: number | null) => {
  const [providers, setProviders] = useState<MaasProviderItem[]>([]);

  // Load when the enabled editor mounts. Each mount ignores its own stale
  // response if the plugin or Policy content is closed before it completes.
  useEffect(() => {
    let cancelled = false;
    queryMaasProviders({ page: -1 })
      .then((res) => {
        if (!cancelled) {
          setProviders(
            (res?.items || []).filter((item) =>
              isDecisionServiceType(item.config?.type)
            )
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const providerOptions = providers.map((item) => ({
    label: item.name,
    value: item.id
  }));
  // Engines come from the selected provider's cached models; changing the
  // selection does not request an endpoint that may be intranet-only.
  const decisionModelOptions = (
    providers.find((item) => item.id === providerId)?.models || []
  )
    .filter((model) => model?.name)
    .map((model) => ({ label: model.name, value: model.name }));

  return { providerOptions, decisionModelOptions };
};

export default useDecisionServiceProviders;
