import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { ModelInstanceListItem } from '../config/types';
import '../style/instance-item.less';
import InstanceItem from './instance-item';

interface InstanceItemProps {
  list: ModelInstanceListItem[];
  workerList: WorkerListItem[];
  modelData?: any;
  handleChildSelect: (val: string, item: ModelInstanceListItem) => void;
}

const Instances: React.FC<InstanceItemProps> = ({
  list,
  workerList,
  modelData,
  handleChildSelect
}) => {
  return (
    <Space size={16} direction="vertical" style={{ width: '100%' }}>
      {_.map(list, (item: ModelInstanceListItem, index: number) => {
        return (
          <InstanceItem
            key={item.name}
            modelData={modelData}
            workerList={workerList}
            instanceData={item}
            handleChildSelect={handleChildSelect}
          ></InstanceItem>
        );
      })}
    </Space>
  );
};
export default Instances;
