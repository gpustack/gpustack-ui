import FileSkeleton from '@/pages/llmodels/components/model-source/file-skeleton';
import { TemplateCard } from '@gpustack/core-ui';
import { Empty, Spin } from 'antd';
import _ from 'lodash';
import styled from 'styled-components';
import { InstanceTypePhaseValueMap } from '../config';
import { InstanceTypeItem as InstanceTypeItemModel } from '../config/types';
import InstanceTypeItem from './instance-type-item';

const TypeGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface InstanceTypeListProps {
  value?: string;
  onChange?: (item: InstanceTypeItemModel) => void;
  dataList?: InstanceTypeItemModel[];
  loading?: boolean;
}

const isAvailable = (item: InstanceTypeItemModel) =>
  item.status?.phase === InstanceTypePhaseValueMap.Active;

const InstanceTypeList: React.FC<InstanceTypeListProps> = ({
  value,
  onChange,
  dataList = [],
  loading
}) => {
  const handleSelect = (item: InstanceTypeItemModel) => {
    if (!isAvailable(item)) return;
    onChange?.(item);
  };

  if (!dataList.length) {
    if (loading) {
      return (
        <Spin spinning size="middle">
          <TypeGrid style={{ minHeight: 200 }}>
            {_.times(6, (index: number) => (
              <FileSkeleton key={index} counts={3} itemHeight={106} />
            ))}
          </TypeGrid>
        </Spin>
      );
    }
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <TypeGrid>
      {dataList.map((item) => {
        const disabled = !isAvailable(item);
        const name = item.metadata?.name;
        return (
          <TemplateCard
            key={name}
            clickable
            ghost
            hoverable
            height={106}
            active={value === name}
            disabled={disabled}
            onClick={() => handleSelect(item)}
          >
            <InstanceTypeItem item={item} />
          </TemplateCard>
        );
      })}
    </TypeGrid>
  );
};

export default InstanceTypeList;
