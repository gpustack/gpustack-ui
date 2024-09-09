import { convertFileSize } from '@/utils';
import _ from 'lodash';
import React from 'react';
import '../style/gpu-card.less';

const GPUCard: React.FC<{
  data: any;
}> = ({ data }) => {
  return (
    <div className="gpu-card">
      <div className="header">
        {data.label}({data.worker_name})[Index:{data.index}]
      </div>
      <div className="info">
        <span>VRAM:</span>
        <span>Total {convertFileSize(data?.memory?.total || 0)}</span>
        <span>Used {convertFileSize(data?.memory?.used || 0)}</span>
        <span>
          Utilization {_.round(data?.memory?.utilization_rate || 0, 2)}%
        </span>
      </div>
    </div>
  );
};

export default GPUCard;
