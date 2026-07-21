import PluginExtraFields from '@/components/plugin-extra-fields';
import { FileSkeletonRows } from '@/pages/llmodels/components/model-source/file-skeleton';
import { TemplateCard } from '@gpustack/core-ui';
import { Empty, Flex, Spin } from 'antd';
import _ from 'lodash';
import { InstanceTypeItem as InstanceTypeItemModel } from '../config/types';
import InstanceTypeItem from './instance-type-item';

interface InstanceTypeListProps {
  value?: string;
  onChange?: (item: InstanceTypeItemModel) => void;
  dataList?: InstanceTypeItemModel[];
  loading?: boolean;
}

const InstanceTypeList: React.FC<InstanceTypeListProps> = ({
  value,
  onChange,
  dataList = [],
  loading
}) => {
  const handleSelect = (item: InstanceTypeItemModel) => {
    if (item.disabled || value === item.name) return;
    onChange?.(item);
  };

  if (!dataList.length) {
    if (loading) {
      return (
        <Spin spinning size="middle">
          <Flex orientation="vertical" gap={16} style={{ minHeight: 200 }}>
            {_.times(6, (index: number) => (
              <FileSkeletonRows key={index} counts={2} itemHeight={106} />
            ))}
          </Flex>
        </Spin>
      );
    }
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Flex orientation="vertical" gap={16}>
      <PluginExtraFields
        name="InstanceTypeBillingProvider"
        context={{ instanceTypes: dataList }}
      />
      {dataList.map((item) => {
        const name = item.name;
        return (
          <TemplateCard
            key={name}
            clickable
            ghost
            hoverable
            height={106}
            active={value === name}
            disabled={item.disabled}
            onClick={() => handleSelect(item)}
          >
            <InstanceTypeItem item={item} />
          </TemplateCard>
        );
      })}
    </Flex>
  );
};

export default InstanceTypeList;
