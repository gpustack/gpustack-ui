import { AutoTooltip, IconFont, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Tag } from 'antd';
import _ from 'lodash';
import styled from 'styled-components';
import { manufactureColorMap } from '../../templates/config';
import { formatMemoryDisplay } from '../config';
import { InstanceTypeItem as InstanceTypeItemModel } from '../config/types';

const Vendors = ['intel'] as const;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--ant-color-text);
  font-weight: 500;
`;

const Meta = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$columns ?? 7}, auto);
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
    margin: 0 4px;
    justify-self: center;
  }

  .meta-label {
    font-size: 12px;
  }
  .meta-value {
    font-size: 12px;
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
  value?: React.ReactNode;
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

const CPUManufacturerTag: React.FC<{ manufacturer?: string }> = ({
  manufacturer
}) => {
  return (
    <Tag
      color="blue"
      disabled={false}
      style={{
        fontWeight: 400,
        margin: 0,
        marginLeft: 0,
        display: 'flex',
        alignItems: 'center',
        lineHeight: 1.5
      }}
      variant="outlined"
    >
      {manufacturer}
    </Tag>
  );
};

function getInstanceDerived(item: InstanceTypeItemModel) {
  const spec = item.spec || {};
  const acceleratable = spec.acceleratable;

  const cpuManufacturer = acceleratable
    ? spec.cpu?.manufacturer
    : spec.manufacturer;

  return {
    acceleratable,
    isGPU: acceleratable,
    manufacturer: acceleratable ? spec.manufacturer || '' : 'cpu', // GPU manufacturer or 'cpu' for non-acceleratable types
    displayName: acceleratable ? spec.product || item.name : 'CPU',
    ramUnit: spec.unitResourcesParsed?.ram?.value,
    os: _.capitalize(spec.os) || '',
    arch: spec.arch,
    cpuManufacturer: Vendors.includes(cpuManufacturer as any)
      ? _.capitalize(cpuManufacturer)
      : _.toUpper(cpuManufacturer),
    cpuUnitCores: spec.unitResourcesParsed?.cpu?.cores
  };
}

export const InstanceMetadataSection: React.FC<MetadataSectionProps> = ({
  spec
}) => {
  const intl = useIntl();

  const { ramUnit, cpuUnitCores, isGPU, os, arch } = getInstanceDerived({
    spec
  } as InstanceTypeItemModel);

  return (
    <Meta $columns={isGPU ? 11 : 7}>
      {isGPU && (
        <>
          {/* row 1: Memory | Max | RAM */}
          <MetaItem
            show={isGPU}
            showDot={false}
            icon="icon-gpu1"
            label={intl.formatMessage({ id: 'gpuservice.instance.memory' })}
            value={formatMemoryDisplay(spec?.memory ?? undefined) ?? '-'}
          />
          <MetaItem
            showDot={true}
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
          {/* row 2: OS | Arch | CPU */}
          <MetaItem
            showDot={false}
            icon="icon-server02"
            label={intl.formatMessage({ id: 'gpuservice.instance.os' })}
            value={os || '-'}
          />
          <MetaItem
            icon="icon-cube"
            label={intl.formatMessage({ id: 'gpuservice.instance.arch' })}
            value={_.toUpper(arch) || '-'}
          />
          <MetaItem
            show={isGPU}
            showDot={true}
            icon="icon-cpu"
            label="CPU"
            value={
              <Flex gap={4} align="center">
                <span>{cpuUnitCores || '-'}</span>
              </Flex>
            }
          />
        </>
      )}

      {!isGPU && (
        <>
          {/* row 1: RAM | Max */}
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
          {/* row 2: OS | Arch */}
          <MetaItem
            showDot={false}
            icon="icon-server02"
            label={intl.formatMessage({ id: 'gpuservice.instance.os' })}
            value={os || '-'}
          />
          <MetaItem
            icon="icon-cube"
            label={intl.formatMessage({ id: 'gpuservice.instance.arch' })}
            value={_.toUpper(arch) || '-'}
          />
        </>
      )}
    </Meta>
  );
};

const InstanceTypeItem: React.FC<InstanceTypeItemProps> = ({ item }) => {
  const specData = item.spec || {};

  const { acceleratable, manufacturer, displayName, cpuManufacturer } =
    getInstanceDerived(item);

  const manufacturerColor = manufactureColorMap[manufacturer] ?? 'purple';
  const showManufacturerTag = acceleratable && !!manufacturer;

  return (
    <Flex
      orientation="vertical"
      justify="space-between"
      style={{ height: '100%' }}
    >
      <Title>
        <Flex gap={8} align="center" style={{ width: '100%', minWidth: 0 }}>
          <div
            className="instance-type-name"
            style={{
              flex: 1,
              minWidth: 0
            }}
          >
            <AutoTooltip ghost minWidth={20} maxWidth={'100%'}>
              {displayName || '-'}
            </AutoTooltip>
          </div>

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
