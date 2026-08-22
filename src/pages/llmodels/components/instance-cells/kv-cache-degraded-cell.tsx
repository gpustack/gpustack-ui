import { WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import React from 'react';
import { ModelInstanceListItem } from '../../config/types';

interface KVCacheDegradedCellProps {
  record: ModelInstanceListItem;
}

// Warns that a shared-KV-cache deployment is running without the cache
// service attached (the instance fell back to local KV cache).
const KVCacheDegradedCell: React.FC<KVCacheDegradedCellProps> = ({
  record
}) => {
  const intl = useIntl();
  const cacheConfig = record.cache_config;

  if (!cacheConfig || cacheConfig.injected !== false) {
    return null;
  }

  const tips = intl.formatMessage({ id: 'models.kvCache.degraded.tips' });

  return (
    <Tooltip
      title={cacheConfig.reason ? `${tips}: ${cacheConfig.reason}` : tips}
    >
      <WarningOutlined style={{ color: 'var(--ant-color-warning)' }} />
    </Tooltip>
  );
};

export default KVCacheDegradedCell;
