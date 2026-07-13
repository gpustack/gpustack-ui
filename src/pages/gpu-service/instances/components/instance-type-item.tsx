import PluginExtraFields from '@/components/plugin-extra-fields';
import { AutoTooltip, IconFont, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Tag } from 'antd';
import _ from 'lodash';
import styled from 'styled-components';
import { manufactureColorMap } from '../../templates/config';
import { formatManufacturer } from '../../utils';
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
  // status.onceMaxRequest.acceleratorSliced (max sliceable percentage). Shown
  // next to Max for sliceable types.
  slicedMaxPercentage?: number;
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
    displayName: acceleratable ? spec.product || item.name : 'CPU-only',
    ramUnit: spec.unitResourcesParsed?.ram?.value,
    os: _.capitalize(spec.os) || '',
    arch: spec.arch,
    cpuManufacturer: formatManufacturer(cpuManufacturer),
    cpuUnitCores: spec.unitResourcesParsed?.cpu?.cores
  };
}

type MetaEntry = { icon: string; label?: string; value: React.ReactNode };

// All rows share a single grid so columns — and therefore icons — line up
// vertically. Each item is 3 cells (icon/label/value); every item past the
// first adds a leading dot cell, so a row of k items spans 4k-1 cells. A short
// row is padded with a spanning spacer so the next row restarts at column 1.
const renderMetaRow = (items: MetaEntry[], columns: number, rowKey: string) => {
  const cells = items.map((item, index) => (
    <MetaItem
      key={`${rowKey}-${item.icon}`}
      showDot={index > 0}
      icon={item.icon}
      label={item.label}
      value={item.value}
    />
  ));
  const remaining = columns - (4 * items.length - 1);
  if (remaining > 0) {
    cells.push(
      <span
        key={`${rowKey}-spacer`}
        style={{ gridColumn: `span ${remaining}` }}
      />
    );
  }
  return cells;
};

export const InstanceMetadataSection: React.FC<MetadataSectionProps> = ({
  spec,
  slicedMaxPercentage
}) => {
  const intl = useIntl();

  const { ramUnit, cpuUnitCores, isGPU, arch } = getInstanceDerived({
    spec
  } as InstanceTypeItemModel);

  // Sliceable types append a "Sliceable {n}%" cell to the second row.
  const showSliceable = !!spec.sliceable && (slicedMaxPercentage ?? 0) > 0;

  const cpuItem: MetaEntry = {
    icon: 'icon-cpu',
    label: 'CPU',
    value: cpuUnitCores || '-'
  };
  const ramItem: MetaEntry = {
    icon: 'icon-ram-02',
    label: intl.formatMessage({ id: 'gpuservice.instance.ram' }),
    value: ramUnit ? `${ramUnit} GB` : '-'
  };
  const memoryItem: MetaEntry = {
    icon: 'icon-gpu1',
    label: intl.formatMessage({ id: 'gpuservice.instance.memory' }),
    value: formatMemoryDisplay(spec?.memory ?? undefined) ?? '-'
  };
  const archItem: MetaEntry = {
    icon: 'icon-cube',
    label: intl.formatMessage({ id: 'gpuservice.instance.arch' }),
    value: _.toUpper(arch) || '-'
  };
  const maxItem: MetaEntry = {
    icon: 'icon-database',
    label: intl.formatMessage({ id: 'common.max' }, { count: '' }),
    value: `${spec.maxComputeUnitCount || 0}`
  };
  const slicedItem: MetaEntry = {
    icon: 'icon-sliced',
    label: intl.formatMessage({ id: 'gpuservice.instance.sliceable' }),
    value: `${slicedMaxPercentage}%`
  };

  // GPU: 3 items/row → 11 cols. CPU: 2 items/row → 7 cols.
  const columns = isGPU ? 11 : 7;
  const rows: MetaEntry[][] = isGPU
    ? [
        [ramItem, memoryItem, cpuItem],
        showSliceable ? [archItem, maxItem, slicedItem] : [archItem, maxItem]
      ]
    : [[ramItem], [archItem, maxItem]];

  return (
    <Meta $columns={columns}>
      {rows.map((row, index) => renderMetaRow(row, columns, `row-${index}`))}
    </Meta>
  );
};

const InstanceTypeItem: React.FC<InstanceTypeItemProps> = ({ item }) => {
  const specData = item.spec || {};

  const { acceleratable, manufacturer, displayName, cpuManufacturer } =
    getInstanceDerived(item);

  const manufacturerColor = manufactureColorMap[manufacturer] ?? 'purple';
  const showManufacturerTag = acceleratable && !!manufacturer;
  const showCpuManufacturerTag = !acceleratable && !!cpuManufacturer;

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
              {formatManufacturer(manufacturer)}
            </ThemeTag>
          )}
          {showCpuManufacturerTag && (
            <ThemeTag
              color={manufacturerColor}
              disabled={false}
              style={{ fontWeight: 400 }}
            >
              {cpuManufacturer}
            </ThemeTag>
          )}
          <PluginExtraFields
            name="InstanceTypeBillingBadge"
            context={{ instanceType: item }}
          />
        </Flex>
      </Title>
      <InstanceMetadataSection
        spec={specData}
        slicedMaxPercentage={
          Number(item.status?.onceMaxRequest?.acceleratorSliced) || 0
        }
      ></InstanceMetadataSection>
    </Flex>
  );
};

export default InstanceTypeItem;
