import {
  HddFilled,
  InfoCircleOutlined,
  PieChartFilled,
  ThunderboltFilled
} from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  ExpandedRowGrid,
  StatusTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Spin, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { queryCacheServiceInstances } from '../apis';
import {
  ServiceStateLabelMap,
  ServiceStatus,
  formatServiceVersion,
  instanceActionItems
} from '../config';
import { CacheServiceInstanceItem, ListItem } from '../config/types';
import { serviceColumnMinWidths } from '../hooks/use-service-columns';

// background refresh cadence while the row stays expanded
const POLL_INTERVAL = 15 * 1000;

// The parent is a plain antd table (tableLayout="fixed"), so its columns share
// the extra width equally with each column's minWidth as the floor. Rebuilding
// the tracks from the same minWidths reproduces that layout, so each child
// cell lands under its parent column.
const GRID_TEMPLATE = Object.values(serviceColumnMinWidths)
  .map((width) => `minmax(${width}px, 1fr)`)
  .join(' ');
// clears the selection + expand gutter of the parent table so the first
// cell starts under the name column
const PREFIX_WIDTH = 80;

// child row cells, keyed to the parent columns they sit under:
// instance name | (provider..endpoint) | state | created | actions
const columnKeys = Object.keys(serviceColumnMinWidths);
const spanBetween = (from: string, to: string) =>
  columnKeys.indexOf(to) - columnKeys.indexOf(from) - 1;
const NAME_TO_STATUS_SPAN = spanBetween('name', 'status');
const STATUS_TO_CREATED_SPAN = spanBetween('status', 'createTime');
const CREATED_TO_ACTIONS_SPAN = spanBetween('createTime', 'operations');

const PlaceholderRow = styled.div`
  display: flex;
  align-items: center;
  height: 54px;
  padding-left: calc(${PREFIX_WIDTH}px + var(--ant-table-cell-padding-inline));
  color: var(--ant-color-text-secondary);
`;

// a compact metric readout in an instance row; the label sits above the
// value since the cell lands under an unrelated parent column header
interface InstanceRowsProps {
  service: ListItem;
  workerNameMap: Record<number, string>;
  workerIpMap: Record<number, string>;
  // bumping forces an immediate refetch (e.g. after an instance recreate)
  refreshKey?: number;
  onRecreate: (service: ListItem, instance: CacheServiceInstanceItem) => void;
  onViewLogs: (service: ListItem, instance: CacheServiceInstanceItem) => void;
}

// info tooltip next to the instance name, laid out like the model instance
// tooltip: the worker name leads on its own, the endpoint follows with an
// icon and no label, and every other field is an icon plus its label.
// Shared with the detail page's instances table.
export const InstanceInfoContent: React.FC<{
  item: CacheServiceInstanceItem;
  workerName?: string;
  workerIp?: string;
  version?: string;
  ramSize?: number;
}> = ({ item, workerName, workerIp, version, ramSize }) => {
  const intl = useIntl();
  return (
    <div>
      <div>{workerName || '-'}</div>
      <div className="flex-center">
        <HddFilled className="m-r-5" />
        {workerIp && item.port ? `${workerIp}:${item.port}` : '-'}
      </div>
      <div className="flex-center">
        <ThunderboltFilled className="m-r-5" />
        {intl.formatMessage({ id: 'kvCache.form.version' })}: {version || '-'}
      </div>
      <div className="flex-center">
        <PieChartFilled className="m-r-5" />
        {intl.formatMessage({ id: 'kvCache.detail.capacity' })}:{' '}
        {ramSize ? `${ramSize} GiB` : '-'}
      </div>
    </div>
  );
};

// per-worker instances of a managed cache service, rendered inline under
// the expanded list row
const InstanceRows: React.FC<InstanceRowsProps> = ({
  service,
  workerNameMap,
  workerIpMap,
  refreshKey,
  onRecreate,
  onViewLogs
}) => {
  const intl = useIntl();
  const [instances, setInstances] = useState<CacheServiceInstanceItem[]>([]);
  const [loadend, setLoadend] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchInstances = async () => {
      try {
        const res = await queryCacheServiceInstances(service.id);
        if (active) {
          setInstances(res.items || []);
          setLoadFailed(false);
          setLoadend(true);
        }
      } catch (error) {
        // keep the last successful list on transient failures, but do
        // not let a failed first load read as "no instances"
        if (active) {
          setLoadFailed(true);
          setLoadend(true);
        }
      }
    };
    fetchInstances();
    const timer = setInterval(() => {
      fetchInstances();
    }, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [service.id, refreshKey]);

  const handleSelect = (val: string, record: CacheServiceInstanceItem) => {
    if (val === 'delete') {
      onRecreate(service, record);
    } else if (val === 'viewlogs') {
      onViewLogs(service, record);
    }
  };

  if (!loadend) {
    return (
      <PlaceholderRow>
        <Spin size="small" />
      </PlaceholderRow>
    );
  }

  if (!instances.length) {
    return (
      <PlaceholderRow>
        {intl.formatMessage({
          id: loadFailed
            ? 'kvCache.instances.loadFailed'
            : 'kvCache.instances.empty'
        })}
      </PlaceholderRow>
    );
  }

  return (
    <div>
      {instances.map((item) => (
        <ExpandedRowGrid
          key={item.id}
          gridTemplate={GRID_TEMPLATE}
          prefixWidth={PREFIX_WIDTH}
          style={{ color: 'var(--ant-color-text-secondary)' }}
        >
          <ExpandedRowGrid.Cell>
            <span className="instance-name flex-center" style={{ gap: 4 }}>
              <AutoTooltip ghost minWidth={20}>
                {item.name}
              </AutoTooltip>
              <Tooltip
                title={
                  <InstanceInfoContent
                    item={item}
                    workerName={workerNameMap[item.worker_id]}
                    workerIp={workerIpMap[item.worker_id]}
                    version={formatServiceVersion(
                      service.provider_version,
                      service.config?.image
                    )}
                    ramSize={service.config?.ram_size}
                  />
                }
                styles={{
                  container: {
                    width: 'max-content',
                    maxWidth: '400px'
                  }
                }}
              >
                <span className="server-info">
                  <InfoCircleOutlined />
                </span>
              </Tooltip>
            </span>
          </ExpandedRowGrid.Cell>
          {NAME_TO_STATUS_SPAN > 0 && (
            <ExpandedRowGrid.Cell span={NAME_TO_STATUS_SPAN} />
          )}
          <ExpandedRowGrid.Cell>
            <StatusTag
              statusValue={{
                status: ServiceStatus[item.state],
                text: ServiceStateLabelMap[item.state],
                message: item.state_message || undefined
              }}
            />
          </ExpandedRowGrid.Cell>
          {STATUS_TO_CREATED_SPAN > 0 && (
            <ExpandedRowGrid.Cell span={STATUS_TO_CREATED_SPAN} />
          )}
          <ExpandedRowGrid.Cell>
            <AutoTooltip ghost minWidth={20}>
              {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </AutoTooltip>
          </ExpandedRowGrid.Cell>
          {CREATED_TO_ACTIONS_SPAN > 0 && (
            <ExpandedRowGrid.Cell span={CREATED_TO_ACTIONS_SPAN} />
          )}
          <ExpandedRowGrid.Cell>
            <DropdownButtons
              items={instanceActionItems(item)}
              onSelect={(val) => handleSelect(val, item)}
            ></DropdownButtons>
          </ExpandedRowGrid.Cell>
        </ExpandedRowGrid>
      ))}
    </div>
  );
};

export default InstanceRows;
