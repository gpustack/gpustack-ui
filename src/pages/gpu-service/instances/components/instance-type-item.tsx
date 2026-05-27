import { AutoTooltip, IconFont, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import styled from 'styled-components';
import { manufactureColorMap } from '../../templates/config';
import { convertKiToGi } from '../config';
import { InstanceTypeItem as InstanceTypeItemModel } from '../config/types';

const toDisplayUnit = (value?: string | null) =>
  value ? value.replace(/Gi$/, 'GB').replace(/Ti$/, 'TB') : value;

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

const MetaItem: React.FC<{
  icon: string;
  label?: string;
  value?: string | null;
  showDot?: boolean;
  show?: boolean;
}> = ({ icon, label, value, showDot = true, show = true }) => {
  if (!show) return null;
  return (
    <>
      {showDot && <span className="dot"></span>}
      <span className="meta-item">
        <IconFont type={icon} className="meta-icon" />
        <Flex align="center" gap={4}>
          <span>{label}</span>
          <span>{value || '-'}</span>
        </Flex>
      </span>
    </>
  );
};

const InstanceTypeItem: React.FC<InstanceTypeItemProps> = ({ item }) => {
  const intl = useIntl();
  const specData = item.spec || {};
  const acceleratable = specData.acceleratable;

  const manufacturerKey = specData.manufacturer || (acceleratable ? '' : 'cpu');
  const manufacturer = manufacturerKey?.toUpperCase();
  const manufacturerColor =
    (manufacturerKey && manufactureColorMap[manufacturerKey]) ?? 'purple';

  // resource remaining status
  const remainingData = item.status?.remaining || {};

  const renderName = () => {
    const displayName = specData.acceleratable
      ? specData.product || item.name
      : 'CPU';
    return displayName;
  };

  return (
    <>
      <Title>
        <Flex gap={8} align="center">
          <AutoTooltip ghost minWidth={20} maxWidth={200}>
            {renderName() || '-'}
          </AutoTooltip>
          {acceleratable && manufacturer && (
            <span
              style={{
                color: 'var(--ant-color-text-tertiary)',
                fontWeight: 400
              }}
            >
              <ThemeTag color={manufacturerColor} disabled={false}>
                {manufacturer}
              </ThemeTag>
            </span>
          )}
        </Flex>
      </Title>
      <Meta>
        <span style={{ display: 'flex', height: 15 }}>
          {acceleratable && (
            <span className="meta-row">
              <MetaItem
                showDot={false}
                icon="icon-gpu1"
                label={intl.formatMessage({ id: 'gpuservice.instance.memory' })}
                value={
                  toDisplayUnit(convertKiToGi(specData?.memory ?? undefined)) ??
                  '-'
                }
              ></MetaItem>
              <MetaItem
                show={!!specData?.sliced}
                icon="icon-sliced"
                label={intl.formatMessage({
                  id: 'gpuservice.instance.sliced'
                })}
                value={specData?.sliced}
              ></MetaItem>
              <MetaItem
                icon="icon-database"
                value={intl.formatMessage(
                  {
                    id: 'common.max'
                  },
                  { count: item.maxAccelerator }
                )}
              ></MetaItem>
            </span>
          )}
        </span>
        <span className="meta-row">
          <MetaItem
            showDot={false}
            icon="icon-ram-02"
            label={intl.formatMessage({ id: 'gpuservice.instance.ram' })}
            value={toDisplayUnit(convertKiToGi(remainingData.ram)) ?? '-'}
          ></MetaItem>
          <MetaItem
            show={!!remainingData.cpu}
            showDot={true}
            icon="icon-cpu"
            label="CPU"
            value={remainingData.cpu ?? '-'}
          ></MetaItem>
        </span>
      </Meta>
    </>
  );
};

export default InstanceTypeItem;
