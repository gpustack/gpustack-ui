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
        <span>Total {convertFileSize(22906503168)}</span>
        <span>Used {convertFileSize(3322640640)}</span>
        <span>Utilization {_.round(3.79, 2)}%</span>
      </div>
    </div>
  );
};

export default GPUCard;
