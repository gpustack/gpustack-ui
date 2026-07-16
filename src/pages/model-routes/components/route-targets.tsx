import ProviderLogo from '@/pages/maas-provider/components/provider-logo';
import { DeleteOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  ChildGridOptions,
  DropdownButtons,
  ExpandedRowGrid,
  StatusTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';
import { TargetStatus, TargetStatusLabelMap } from '../config';
import { RouteTarget } from '../config/types';

const FilesTag = styled(Tag)`
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-inline: 4px 0;
  transform: scale(0.9);
  border-radius: 12px;
`;

type SharedGrid = Pick<
  ChildGridOptions,
  'gridTemplate' | 'prefixWidth' | 'columns'
>;

interface ProviderModelProps extends SharedGrid {
  dataList: RouteTarget[];
  onSelect: (val: any, record: any) => void;
  sourceModels: any[];
  modelList?: Global.BaseOption<number>[];
}

interface TargetItemProps extends SharedGrid {
  onSelect: (val: any, record: any) => void;
  data: any;
  sourceModels: any[];
  modelList?: Global.BaseOption<number>[];
}

// Sub-column inside the merged `targets` cell.
const subCellStyle: React.CSSProperties = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  paddingInline: 'var(--ant-table-cell-padding-inline)'
};

export const childActionList = [
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: <DeleteOutlined />,
    props: {
      danger: true
    }
  }
];

const RouteItem: React.FC<TargetItemProps> = ({
  onSelect,
  data,
  sourceModels,
  modelList,
  gridTemplate,
  prefixWidth = 0,
  columns
}) => {
  const intl = useIntl();

  // The child row shares the parent's column grid. Cells flow left-to-right,
  // so each cell only declares how many parent columns it spans. Parent layout
  // is always: name (1) | middle plugin region | created_at (1) | operations (1).
  // Enterprise inserts plugin columns (org, quota) into the middle region.
  const columnCount = columns?.length ?? 0;
  const middleSpan = Math.max(columnCount - 3, 1);
  // With ≥3 middle tracks (enterprise: org / targets / quota) give source,
  // weight and status their own tracks; source pins to the first middle track,
  // status to the last, weight absorbs whatever is between.
  const splitMiddle = middleSpan >= 3;

  const renderProviderSource = () => {
    const model = sourceModels.find((item: any) => {
      if (data.model_id) {
        return item.value === 'deployments';
      }
      return item.value === data.provider_id;
    });
    if (!model) {
      return '-';
    }
    return (
      <span className="flex-center" style={{ gap: 8, width: '100%' }}>
        <ProviderLogo provider={model.providerType}></ProviderLogo>
        <AutoTooltip ghost minWidth={20}>
          {data.model_id
            ? modelList?.find((m) => m.value === data.model_id)?.label
            : data.overridden_model_name}
        </AutoTooltip>
      </span>
    );
  };

  const sourceNode = renderProviderSource();
  const weightNode =
    data.fallback_status_codes && data.fallback_status_codes?.length > 0 ? (
      <>
        {data.weight > 0 && <span style={{ marginInline: 8 }}>/</span>}
        <span>{intl.formatMessage({ id: 'routes.table.label.fallback' })}</span>
      </>
    ) : (
      <AutoTooltip ghost>
        {intl.formatMessage({ id: 'routes.form.target.weight' })}:{' '}
        {data.weight || 0}
      </AutoTooltip>
    );
  const statusNode = (
    <StatusTag
      statusValue={{
        status: TargetStatus[data.state],
        text: TargetStatusLabelMap[data.state],
        message: ''
      }}
    />
  );

  return (
    <ExpandedRowGrid
      gridTemplate={gridTemplate}
      prefixWidth={prefixWidth}
      style={{ color: 'var(--ant-color-text-secondary)' }}
    >
      <ExpandedRowGrid.Cell span={1} style={{ height: '100%', gap: 4 }}>
        <AutoTooltip ghost>{data.name}</AutoTooltip>
        {!!data.overridden_model_name && !!data.model_id && (
          <FilesTag color="purple" variant="outlined">
            <span style={{ opacity: 1 }}>LoRA</span>
          </FilesTag>
        )}
      </ExpandedRowGrid.Cell>
      {splitMiddle ? (
        // Enterprise: org / targets / quota → one track each.
        <>
          <ExpandedRowGrid.Cell span={1}>{sourceNode}</ExpandedRowGrid.Cell>
          <ExpandedRowGrid.Cell span={middleSpan - 2}>
            {weightNode}
          </ExpandedRowGrid.Cell>
          <ExpandedRowGrid.Cell span={1}>{statusNode}</ExpandedRowGrid.Cell>
        </>
      ) : (
        // Only `targets` exists: share the one track via a 5:2:3 sub-grid.
        // A raw grid div (not <Cell>) because it needs `display: grid`.
        <div
          style={{
            gridColumn: `span ${middleSpan}`,
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 2fr) minmax(0, 3fr)',
            alignItems: 'center'
          }}
        >
          <div style={subCellStyle}>{sourceNode}</div>
          <div style={subCellStyle}>{weightNode}</div>
          <div style={subCellStyle}>{statusNode}</div>
        </div>
      )}
      <ExpandedRowGrid.Cell span={1} style={{ height: '100%' }}>
        <AutoTooltip ghost minWidth={20}>
          {dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss')}
        </AutoTooltip>
      </ExpandedRowGrid.Cell>
      <ExpandedRowGrid.Cell span={1} style={{ height: '100%' }}>
        <DropdownButtons
          items={childActionList}
          onSelect={(val) => onSelect(val, data)}
        ></DropdownButtons>
      </ExpandedRowGrid.Cell>
    </ExpandedRowGrid>
  );
};

const RouteTargets: React.FC<ProviderModelProps> = ({
  dataList,
  onSelect,
  modelList,
  sourceModels,
  gridTemplate,
  prefixWidth,
  columns
}) => {
  return (
    <div>
      {dataList.map((item, index) => (
        <RouteItem
          data={item}
          key={index}
          onSelect={onSelect}
          sourceModels={sourceModels}
          modelList={modelList}
          gridTemplate={gridTemplate}
          prefixWidth={prefixWidth}
          columns={columns}
        ></RouteItem>
      ))}
    </div>
  );
};

export default RouteTargets;
