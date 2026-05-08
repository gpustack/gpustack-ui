import { AutoTooltip, TemplateCard } from '@gpustack/core-ui';
import { Flex, Tag } from 'antd';
import styled from 'styled-components';
import { InstanceTypePhaseValueMap } from '../config';
import { InstanceTypeItem } from '../config/types';

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
  value?: string;
  onChange?: (item: InstanceTypeItem) => void;
  dataList?: InstanceTypeItem[];
}

const isAvailable = (item: InstanceTypeItem) =>
  item.status?.phase === InstanceTypePhaseValueMap.Available;

const InstanceTypeList: React.FC<InstanceTypeListProps> = ({
  value,
  onChange,
  dataList = []
}) => {
  const handleSelect = (item: InstanceTypeItem) => {
    if (!isAvailable(item)) return;
    onChange?.(item);
  };

  return (
    <TypeGrid>
      {dataList.map((item) => {
        const disabled = !isAvailable(item);
        const name = item.metadata?.name || item.name;
        return (
          <TemplateCard
            key={name}
            clickable
            ghost
            hoverable
            height={104}
            active={value === name}
            disabled={disabled}
            onClick={() => handleSelect(item)}
          >
            <TypeName>
              <Flex gap={16}>
                <AutoTooltip ghost minWidth={20}>
                  {name}
                </AutoTooltip>
              </Flex>
              <Tag
                style={{
                  fontWeight: 400,
                  color: 'var(--ant-color-text-tertiary)'
                }}
              >
                <span>库存 {item.status?.accelerator?.remaining ?? '-'}</span>
              </Tag>
            </TypeName>
            <TypeMeta>
              <span className="meta-row">显存 {item.spec?.memory ?? '-'}</span>
              <span className="meta-row gap-16">
                <span>内存 {item.status?.ram?.capacity ?? '-'}</span>
                <span>vCPU {item.status?.cpu?.capacity ?? '-'}</span>
              </span>
            </TypeMeta>
          </TemplateCard>
        );
      })}
    </TypeGrid>
  );
};

export default InstanceTypeList;
