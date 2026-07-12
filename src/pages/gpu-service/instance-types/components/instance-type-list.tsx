import { ResizeContainer } from '@gpustack/core-ui';
import { Spin } from 'antd';
import { ListItem } from '../config/types';
import InstanceTypeCard from './instance-type-card';

interface InstanceTypeListProps {
  dataList: ListItem[];
  loading: boolean;
  onDelete?: (record: ListItem) => void;
}

const InstanceTypeList: React.FC<InstanceTypeListProps> = ({
  dataList,
  loading,
  onDelete
}) => {
  return (
    <Spin spinning={loading} size="middle">
      <ResizeContainer
        defaultSpan={8}
        resizable
        dataList={dataList}
        renderItem={(item: ListItem) => (
          <InstanceTypeCard data={item} onDelete={onDelete} />
        )}
      />
    </Spin>
  );
};

export default InstanceTypeList;
