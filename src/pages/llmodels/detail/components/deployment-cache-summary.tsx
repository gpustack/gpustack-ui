import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import type { ListItem } from '../../config/types';
import {
  deploymentCacheBindings,
  type DeploymentMetadata
} from '../services/deployment-metadata';

export default function DeploymentCacheSummary({
  model,
  metadata
}: {
  model: ListItem;
  metadata: DeploymentMetadata | null;
}) {
  const intl = useIntl();
  return (
    <Flex vertical gap={4}>
      {deploymentCacheBindings(model).map((binding) => {
        const service =
          binding.serviceId == null
            ? null
            : metadata?.cacheServices[binding.serviceId];
        const status =
          binding.enabled == null
            ? '—'
            : intl.formatMessage({
                id: binding.enabled
                  ? 'common.button.enabled'
                  : 'common.button.disabled'
              });
        return (
          <span key={binding.role || 'deployment'}>
            {[
              binding.role,
              status,
              binding.enabled ? binding.mode : null,
              binding.serviceId == null
                ? null
                : service
                  ? [service.name, service.provider].filter(Boolean).join(' · ')
                  : `#${binding.serviceId}`
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        );
      })}
    </Flex>
  );
}
