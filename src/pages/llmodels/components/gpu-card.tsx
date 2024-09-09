import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import React from 'react';
import '../style/gpu-card.less';

const GPUCard: React.FC<{
  data: any;
}> = ({ data }) => {
  const intl = useIntl();
  return (
    <div className="gpu-card">
      <div className="header">
        {data.label}({data.worker_name})[
        {intl.formatMessage({ id: 'resources.table.index' })}:{data.index}]
      </div>
      <div className="info">
        <span>{intl.formatMessage({ id: 'resources.table.vram' })}:</span>
        <span>
          {intl.formatMessage({ id: 'resources.table.total' })}{' '}
          {convertFileSize(data?.memory?.total || 0)}
        </span>
        <span>
          {intl.formatMessage({ id: 'resources.table.used' })}{' '}
          {convertFileSize(data?.memory?.used || 0)}
        </span>
        <span>
          {intl.formatMessage({ id: 'resources.table.utilization' })}{' '}
          {_.round(data?.memory?.utilization_rate || 0, 2)}%
        </span>
      </div>
    </div>
  );
};

export default GPUCard;
