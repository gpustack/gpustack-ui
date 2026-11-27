import { ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import type { ListItem } from '../../config/types';
import {
  deploymentCacheBindings,
  type DeploymentMetadata
} from '../services/deployment-metadata';

export default function DeploymentCacheSummary({
  model,
  metadata,
  tagged = false
}: {
  model: ListItem;
  metadata: DeploymentMetadata | null;
  tagged?: boolean;
}) {
  const intl = useIntl();
  return (
    <Flex
      vertical
      gap={4}
      align={tagged ? 'flex-end' : undefined}
      style={tagged ? { minWidth: 0 } : undefined}
    >
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
        const text = [
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
          .join(' · ');
        const key = binding.role || 'deployment';
        return tagged && binding.enabled != null ? (
          <ThemeTag
            key={key}
            style={{
              height: 'auto',
              maxWidth: '100%',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              textAlign: 'end'
            }}
          >
            {text}
          </ThemeTag>
        ) : (
          <span key={key}>{text}</span>
        );
      })}
    </Flex>
  );
}
