import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { Space } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { ModelInstanceListItem } from '../config/types';
import '../style/instance-item.less';
import InstanceItem from './instance-item';

interface InstanceItemProps {
  list: ModelInstanceListItem[];
  workerList: WorkerListItem[];
  modelData?: any;
  currentExpanded?: string;
  handleChildSelect: (val: string, item: ModelInstanceListItem) => void;
}

const Instances: React.FC<InstanceItemProps> = ({
  list,
  workerList,
  modelData,
  currentExpanded,
  handleChildSelect
}) => {
  const [firstLoad, setFirstLoad] = React.useState(true);

  const defaultOpenId = useMemo(() => {
    if (!currentExpanded) {
      return '';
    }
    const current = _.find(
      list,
      (item: ModelInstanceListItem) => item.worker_id
    );
    return current ? current.name : '';
  }, [currentExpanded, list]);

  useEffect(() => {
    setFirstLoad(false);
  }, []);

  return (
    <Space size={16} direction="vertical" style={{ width: '100%' }}>
      {_.map(list, (item: ModelInstanceListItem, index: number) => {
        return (
          <InstanceItem
            key={item.name}
            modelData={modelData}
            workerList={workerList}
            instanceData={item}
            defaultOpenId={firstLoad ? defaultOpenId : ''}
            handleChildSelect={handleChildSelect}
          ></InstanceItem>
        );
      })}
    </Space>
  );
};
export default Instances;
