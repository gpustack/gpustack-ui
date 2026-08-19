import { WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import React from 'react';
import { ModelInstanceListItem } from '../../config/types';

interface KVCacheDegradedCellProps {
  record: ModelInstanceListItem;
}

// Warns that a shared-KV-cache deployment is running without a working
// cache attachment: either the instance started degraded (fell back to
// local KV cache), or it started attached and the cache endpoint has
// since gone away (endpoint_live tracks the present).
const KVCacheDegradedCell: React.FC<KVCacheDegradedCellProps> = ({
  record
}) => {
  const intl = useIntl();
  const cacheConfig = record.cache_config;

  if (!cacheConfig) {
    return null;
  }

  const endpointDead =
    cacheConfig.injected === true && cacheConfig.endpoint_live === false;
  if (cacheConfig.injected !== false && !endpointDead) {
    return null;
  }

  const tips = intl.formatMessage({
    id: endpointDead
      ? 'models.kvCache.endpointDead.tips'
      : 'models.kvCache.degraded.tips'
  });

  return (
    <Tooltip
      title={
        !endpointDead && cacheConfig.reason
          ? `${tips}: ${cacheConfig.reason}`
          : tips
      }
    >
      <WarningOutlined style={{ color: 'var(--ant-color-warning)' }} />
    </Tooltip>
  );
};

export default KVCacheDegradedCell;
