import AutoTooltip from '@/components/auto-tooltip';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import React from 'react';
import '../style/gpu-card.less';

const GPUCard: React.FC<{
  data: any;
  header?: React.ReactNode;
  info?: React.ReactNode;
}> = ({ data, header, info }) => {
  const intl = useIntl();
  return (
    <div className="gpu-card">
      <div className="header" style={{ width: '100%' }}>
        {header ?? <AutoTooltip ghost>{data.label}</AutoTooltip>}
      </div>
      <div className="info">
        {info ?? (
          <>
            <span>
              {intl.formatMessage({ id: 'resources.table.vram' })}(
              {intl.formatMessage({ id: 'resources.table.used' })}/
              {intl.formatMessage({ id: 'resources.table.total' })}):{' '}
              <span>
                {convertFileSize(
                  data?.memory?.used || data?.memory?.allocated || 0
                )}{' '}
                / {convertFileSize(data?.memory?.total || 0)}
              </span>
            </span>
            <span>
              <span>
                {intl.formatMessage({ id: 'resources.table.gpuutilization' })}:{' '}
              </span>
              {data?.memory?.used
                ? _.round(data?.memory?.utilization_rate || 0, 2)
                : _.round(data.memory?.allocated / data.memory?.total, 2) * 100}
              %
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(GPUCard);
