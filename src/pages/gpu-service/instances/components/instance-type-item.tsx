import { AutoTooltip, IconFont, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import styled from 'styled-components';
import { manufactureColorMap } from '../../templates/config';
import { formatMemoryDisplay } from '../config';
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
  grid-template-columns: repeat(7, auto);
  grid-auto-rows: minmax(15px, auto);
  justify-content: start;
  column-gap: 4px;
  row-gap: 8px;
  align-items: center;
  color: var(--ant-color-text-tertiary);
  font-size: 13px;

  .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: var(--ant-color-text-quaternary);
    margin: 0 6px;
    justify-self: center;
  }

  .meta-icon {
    font-size: 14px;
    color: var(--ant-color-text-quaternary);
  }
`;

interface InstanceTypeItemProps {
  item: InstanceTypeItemModel;
}

interface MetadataSectionProps {
  spec: InstanceTypeItemModel['spec'];
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

function getInstanceDerived(item: InstanceTypeItemModel) {
  const spec = item.spec || {};
  const acceleratable = spec.acceleratable;

  return {
    acceleratable,
    isGPU: acceleratable,
    manufacturer: acceleratable ? spec.manufacturer || '' : 'cpu',
    displayName: acceleratable ? spec.product || item.name : 'CPU',
    ramUnit: spec.unitResourcesParsed?.ram?.value,
    cpuUnitCores: spec.unitResourcesParsed?.cpu?.cores
  };
}

export const InstanceMetadataSection: React.FC<MetadataSectionProps> = ({
  spec
}) => {
  const intl = useIntl();

  const { ramUnit, cpuUnitCores, isGPU } = getInstanceDerived({
    spec
  } as InstanceTypeItemModel);

  return (
    <Meta>
      {isGPU && (
        <>
          <MetaItem
            show={isGPU}
            showDot={false}
            icon="icon-gpu1"
            label={intl.formatMessage({ id: 'gpuservice.instance.memory' })}
            value={formatMemoryDisplay(spec?.memory ?? undefined) ?? '-'}
          />
          <MetaItem
            icon="icon-database"
            label={intl.formatMessage(
              {
                id: 'common.max'
              },
              { count: '' }
            )}
            value={`${spec.maxComputeUnitCount || 0}`}
          />
          <MetaItem
            showDot={false}
            icon="icon-ram-02"
            label={intl.formatMessage({ id: 'gpuservice.instance.ram' })}
            value={ramUnit ? `${ramUnit} GB` : '-'}
          />
          <MetaItem
            show={isGPU}
            showDot={true}
            icon="icon-cpu"
            label="CPU"
            value={cpuUnitCores || '-'}
          />
        </>
      )}

      {!isGPU && (
        <>
          <MetaItem
            showDot={false}
            icon="icon-ram-02"
            label={intl.formatMessage({ id: 'gpuservice.instance.ram' })}
            value={ramUnit ? `${ramUnit} GB` : '-'}
          />
          <MetaItem
            icon="icon-database"
            label={intl.formatMessage(
              {
                id: 'common.max'
              },
              { count: '' }
            )}
            value={`${spec.maxComputeUnitCount || 0}`}
          />
        </>
      )}
    </Meta>
  );
};

const InstanceTypeItem: React.FC<InstanceTypeItemProps> = ({ item }) => {
  const specData = item.spec || {};

  const { acceleratable, manufacturer, displayName } = getInstanceDerived(item);

  const manufacturerColor = manufactureColorMap[manufacturer] ?? 'purple';
  const showManufacturerTag = acceleratable && manufacturer;

  return (
    <Flex
      orientation="vertical"
      justify="space-between"
      style={{ height: '100%' }}
    >
      <Title>
        <Flex gap={8} align="center">
          <AutoTooltip ghost minWidth={20} maxWidth={200}>
            {displayName || '-'}
          </AutoTooltip>
          {showManufacturerTag && (
            <ThemeTag
              color={manufacturerColor}
              disabled={false}
              style={{ fontWeight: 400 }}
            >
              {manufacturer?.toUpperCase()}
            </ThemeTag>
          )}
        </Flex>
      </Title>
      <InstanceMetadataSection spec={specData}></InstanceMetadataSection>
    </Flex>
  );
};

export default InstanceTypeItem;
