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
  grid-template-columns: repeat(7, auto);
  justify-content: start;
  column-gap: 4px;
  row-gap: 8px;
  align-items: center;
  color: var(--ant-color-text-secondary);
  font-size: 13px;

  .meta-row {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    align-items: center;
    min-height: 15px;
    color: var(--ant-color-text-tertiary);
  }

  .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: var(--ant-color-text-quaternary);
    margin: 0 4px;
    justify-self: center;
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
  value?: string | null | number;
  showDot?: boolean;
  show?: boolean;
}> = ({ icon, label, value, showDot = true, show = true }) => {
  if (!show) return null;
  return (
    <>
      {showDot && <span className="dot" />}
      <IconFont type={icon} className="meta-icon" />
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value || '-'}</span>
    </>
  );
};

const InstanceTypeItem: React.FC<InstanceTypeItemProps> = ({ item }) => {
  const intl = useIntl();
  const specData = item.spec || {};

  // false: CPU; true: GPU
  const acceleratable = specData.acceleratable;

  const manufacturer = acceleratable ? specData.manufacturer || '' : 'cpu';
  const manufacturerColor = manufactureColorMap[manufacturer] ?? 'purple';

  // resource once-max-request status
  const onceMaxRequestData = item.status?.onceMaxRequest || {};

  // RAM resource
  const ramUnit = acceleratable
    ? specData.unitResourcesParsed?.ram?.value
    : onceMaxRequestData.ram;

  // CPU resource
  const cpuUnitCores = acceleratable
    ? specData.unitResourcesParsed?.cpu?.cores
    : onceMaxRequestData.cpu;

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
                {manufacturer?.toUpperCase()}
              </ThemeTag>
            </span>
          )}
        </Flex>
      </Title>
      <Meta>
        <span className="meta-row">
          {acceleratable && (
            <>
              <MetaItem
                showDot={false}
                icon="icon-gpu1"
                label={intl.formatMessage({ id: 'gpuservice.instance.memory' })}
                value={
                  toDisplayUnit(convertKiToGi(specData?.memory ?? undefined)) ??
                  '-'
                }
              />
              <MetaItem
                show={!!specData?.sliced}
                icon="icon-sliced"
                label={intl.formatMessage({
                  id: 'gpuservice.instance.sliced'
                })}
                value={specData?.sliced}
              />
              <MetaItem
                icon="icon-database"
                label={intl.formatMessage(
                  {
                    id: 'common.max'
                  },
                  { count: '' }
                )}
                value={`${item.maxAccelerator || 0}`}
              />
            </>
          )}
        </span>
        <span className="meta-row">
          <MetaItem
            showDot={false}
            icon="icon-ram-02"
            label={intl.formatMessage({ id: 'gpuservice.instance.ram' })}
            value={ramUnit ? `${ramUnit} GB` : '-'}
          />
          <MetaItem
            show={!!cpuUnitCores}
            showDot={true}
            icon="icon-cpu"
            label="CPU"
            value={cpuUnitCores || '-'}
          />
        </span>
      </Meta>
    </>
  );
};

export default InstanceTypeItem;
