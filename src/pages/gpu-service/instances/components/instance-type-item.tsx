import { AutoTooltip, IconFont, StatusTag, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import styled from 'styled-components';
import {
  convertKiToGi,
  InstanceTypePhaseLabelMap,
  InstanceTypePhaseStatus
} from '../config';
import { InstanceTypeItem as InstanceTypeItemModel } from '../config/types';

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--ant-color-text);
  font-weight: 500;
`;

const Meta = styled.div`
  display: grid;
  gap: 8px;
  color: var(--ant-color-text-secondary);
  font-size: 13px;

  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ant-color-text-tertiary);
  }
  .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: var(--ant-color-text-quaternary);
    flex: none;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .meta-icon {
    font-size: 14px;
    color: var(--ant-color-text-quaternary);
  }
`;

interface InstanceTypeItemProps {
  item: InstanceTypeItemModel;
  showStatus?: boolean;
}

const InstanceTypeItem: React.FC<InstanceTypeItemProps> = ({
  item,
  showStatus = true
}) => {
  const intl = useIntl();
  const name = item.metadata?.name;
  const acceleratable = item.spec?.acceleratable;
  const product = item.spec?.product;
  const displayName = product || (!acceleratable ? 'CPU' : name);
  const manufacturer = item.spec?.manufacturer?.toUpperCase();

  return (
    <>
      <Title>
        <Flex gap={8} align="center">
          <AutoTooltip ghost minWidth={20} maxWidth={180}>
            {displayName}
          </AutoTooltip>
          {acceleratable && manufacturer && (
            <span
              style={{
                color: 'var(--ant-color-text-tertiary)',
                fontWeight: 400
              }}
            >
              <ThemeTag color="purple">{manufacturer}</ThemeTag>
            </span>
          )}
        </Flex>
        {showStatus && (
          <Flex gap={8} align="center">
            {item.status?.phase && (
              <StatusTag
                statusValue={{
                  status:
                    InstanceTypePhaseStatus[item.status.phase] ?? 'inactive',
                  text:
                    InstanceTypePhaseLabelMap[item.status.phase] ??
                    item.status.phase,
                  message: ''
                }}
              />
            )}
          </Flex>
        )}
      </Title>
      <Meta>
        <span style={{ display: 'flex', height: 15 }}>
          {acceleratable && (
            <span className="meta-row">
              <span className="meta-item">
                <IconFont type="icon-gpu1" className="meta-icon" />
                <Flex align="center" gap={4}>
                  <span>
                    {intl.formatMessage({ id: 'gpuservice.instance.memory' })}
                  </span>
                  <span>{convertKiToGi(item.spec?.memory) ?? '-'}</span>
                </Flex>
              </span>
              <span className="dot"></span>
              <span className="meta-item">
                <IconFont type="icon-cube" className="meta-icon" />
                <Flex align="center" gap={4}>
                  <span>
                    {intl.formatMessage({ id: 'gpuservice.instance.stock' })}
                  </span>
                  <span>{item.status?.accelerator?.remaining ?? '-'}</span>
                </Flex>
              </span>
            </span>
          )}
        </span>
        <span className="meta-row">
          <span className="meta-item">
            <IconFont type="icon-ram-02" className="meta-icon" />
            <Flex align="center" gap={4}>
              <span>
                {intl.formatMessage({ id: 'gpuservice.instance.ram' })}
              </span>
              <span>{item.status?.ram?.capacity ?? '-'}</span>
            </Flex>
          </span>
          <span className="dot"></span>
          <span className="meta-item">
            <IconFont type="icon-cpu" className="meta-icon" />
            <Flex align="center" gap={4}>
              <span>vCPU</span>
              <span>{item.status?.cpu?.capacity ?? '-'}</span>
            </Flex>
          </span>
        </span>
      </Meta>
    </>
  );
};

export default InstanceTypeItem;
