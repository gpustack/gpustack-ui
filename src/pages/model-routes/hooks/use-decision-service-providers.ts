import { queryModelsList } from '@/pages/llmodels/apis';
import { queryMaasProviders } from '@/pages/maas-provider/apis';
import { isDecisionServiceType } from '@/pages/maas-provider/config/providers';
import type { MaasProviderItem } from '@/pages/maas-provider/config/types';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import { useEffect, useState } from 'react';

// A locally deployed decision model (source B of the decision-service
// picker): the model id written to `modelId`, plus the name used to seed
// `decisionModel`.
export interface DecisionServiceModel {
  id: number;
  name: string;
}

// Same option shape as the route-target picker (use-target-source-models):
// `parent: false` + `isParent: true` marks a group row — core-ui's cascader
// only routes non-`parent` rows through `optionNode`, so groups must keep
// `parent` false for the logo row to render.
export interface DecisionCascaderOption {
  label: React.ReactNode;
  value: string | number;
  parent?: boolean;
  isParent?: boolean;
  providerType?: string;
  source?: string;
  data?: {
    [key: string]: any;
    model_id?: number;
    provider_id?: number;
    decision_model?: string;
  };
  children?: DecisionCascaderOption[];
}

// The decision-service picker is fed by two sources (design §6.2), arranged
// as the same two-level tree the route-target picker uses:
// - local deployments: /models?categories=decision&state=running (writes
//   `modelId`) — `running` is the /models servability gate (the `ready`
//   vocabulary belongs to /my-models), anything else cannot serve decision
//   traffic;
// - external services: ModelProviders filtered to config.type ==
//   "gpustack-lb-typesafe" (writes `providerId`), whose cached models are
//   the decision engines to pick as the child row.
// The two are mutually exclusive at submit time — a child selection writes
// either `providerId` or `modelId`, never both.
const useDecisionServiceProviders = () => {
  const intl = useIntl();
  const [providers, setProviders] = useState<MaasProviderItem[]>([]);
  const [localModels, setLocalModels] = useState<DecisionServiceModel[]>([]);

  // Load when the enabled editor mounts. Each mount ignores its own stale
  // responses if the plugin or Policy content is closed before they
  // complete.
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
    queryModelsList({
      page: -1,
      categories: 'decision',
      state: 'running'
    })
      .then((res) => {
        if (!cancelled) {
          setLocalModels(
            (res?.items || []).map((item) => ({
              id: item.id,
              name: item.name
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceOptions: DecisionCascaderOption[] = [
    {
      label: intl.formatMessage({
        id: 'routes.lb.systemone.provider.group.local'
      }),
      value: 'deployments',
      providerType: 'deployments',
      parent: false,
      isParent: true,
      children: localModels.map((item) => ({
        label: item.name,
        value: item.id,
        data: { model_id: item.id },
        source: 'deployment'
      }))
    },
    ...providers.map((provider) => ({
      label: provider.name,
      value: provider.id,
      // ProviderEnum mixes string and number values; the logo map and the
      // option rows take the raw key (same cast as the target picker).
      providerType: provider.config?.type as string,
      parent: false,
      isParent: true,
      children: _.uniqBy(
        (provider.models || [])
          .filter((model) => model?.name)
          .map((model) => ({
            label: model.name,
            value: model.name,
            data: {
              provider_id: provider.id,
              decision_model: model.name
            },
            source: 'providerModel'
          })),
        'value'
      )
    }))
  ].filter((group) => group.children && group.children.length > 0);

  return {
    sourceOptions,
    localModels,
    providers
  };
};

export default useDecisionServiceProviders;
