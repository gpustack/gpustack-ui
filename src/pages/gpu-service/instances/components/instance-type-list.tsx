import { AutoTooltip, TemplateCard } from '@gpustack/core-ui';
import { Flex, Tag } from 'antd';
import styled from 'styled-components';
import { InstanceTypeStatusValueMap, instanceTypeOptions } from '../config';
import { InstanceItem } from '../config/types';

const TypeGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TypeName = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--ant-color-text);
  font-weight: 500;
`;

const TypeMeta = styled.div`
  display: grid;
  gap: 8px;
  color: var(--ant-color-text-secondary);
  font-size: 13px;

  .meta-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .icon {
    color: var(--ant-color-text-quaternary);
  }
`;

interface InstanceTypeListProps {
  value?: number;
  onChange?: (value: number) => void;
  dataList?: InstanceItem[];
}

const InstanceTypeList: React.FC<InstanceTypeListProps> = ({
  value,
  onChange,
  dataList = instanceTypeOptions
}) => {
  const handleSelect = (item: InstanceItem) => {
    if (item.status !== InstanceTypeStatusValueMap.Available) {
      return;
    }

    onChange?.(item.id);
  };

  return (
    <TypeGrid>
      {dataList.map((item) => {
        const disabled = item.status !== InstanceTypeStatusValueMap.Available;
        return (
          <TemplateCard
            key={item.id}
            clickable
            ghost
            hoverable
            height={104}
            active={value === item.id}
            disabled={disabled}
            onClick={() => handleSelect(item)}
          >
            <TypeName>
              <Flex gap={16}>
                <AutoTooltip ghost minWidth={20}>
                  {item.name}
                </AutoTooltip>
              </Flex>
              <Tag
                style={{
                  fontWeight: 400,
                  color: 'var(--ant-color-text-tertiary)'
                }}
              >
                <span>库存 {item.gpu_count}</span>
              </Tag>
            </TypeName>
            <TypeMeta>
              <span className="meta-row">显存 {item.vram} GiB</span>
              <span className="meta-row gap-16">
                <span> 内存 {item.ram} GiB</span>
                <span>CPU {item.vCPU}</span>
              </span>
            </TypeMeta>
          </TemplateCard>
        );
      })}
    </TypeGrid>
  );
};

export default InstanceTypeList;
