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

  // The server's reason already names the subject ("Not attached on the
  // 'decode' role …"), so prefixing it with this cell's own sentence said the
  // same thing twice before the reader got to the part only the server knows.
  // The generic line stays for the case where there is no reason to show.
  const title = !endpointDead && cacheConfig.reason ? cacheConfig.reason : tips;

  return (
    <Tooltip title={title} styles={{ container: { maxWidth: 320 } }}>
      <WarningOutlined style={{ color: 'var(--ant-color-warning)' }} />
    </Tooltip>
  );
};

export default KVCacheDegradedCell;
