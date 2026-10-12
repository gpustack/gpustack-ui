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
  StatusTag,
  type ChildGridOptions
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Spin, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { queryCacheServiceInstances } from '../apis';
import {
  ServiceStateLabelMap,
  ServiceStatus,
  formatServiceVersion,
  instanceActionItems
} from '../config';
import { CacheServiceInstanceItem, ListItem } from '../config/types';

// background refresh cadence while the row stays expanded
const POLL_INTERVAL = 15 * 1000;

// a compact metric readout in an instance row; the label sits above the
// value since the cell lands under an unrelated parent column header
interface InstanceRowsProps extends Pick<
  ChildGridOptions,
  'gridTemplate' | 'prefixWidth' | 'columns'
> {
  service: ListItem;
  // one instance's declared RAM claim; 0 hides the bubble row
  capacityGib?: number;
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
      {!!ramSize && (
        <div className="flex-center">
          <PieChartFilled className="m-r-5" />
          {intl.formatMessage({ id: 'kvCache.detail.capacity' })}: {ramSize} GiB
        </div>
      )}
    </div>
  );
};

// per-worker instances of a managed cache service, rendered inline under
// the expanded list row
const InstanceRows: React.FC<InstanceRowsProps> = ({
  service,
  capacityGib,
  workerNameMap,
  workerIpMap,
  gridTemplate,
  prefixWidth,
  columns,
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

  const columnKeys = columns?.map((column) => column.dataIndex) || [];
  const spanBetween = (from: string, to: string) =>
    columnKeys.indexOf(to) - columnKeys.indexOf(from) - 1;
  const nameToStatusSpan = spanBetween('name', 'state');
  const statusToCreatedSpan = spanBetween('state', 'created_at');
  const createdToActionsSpan = spanBetween('created_at', 'operations');

  if (!loadend || !instances.length) {
    return (
      <ExpandedRowGrid
        gridTemplate={gridTemplate}
        prefixWidth={prefixWidth}
        style={{ color: 'var(--ant-color-text-secondary)' }}
      >
        <ExpandedRowGrid.Cell span={columns?.length}>
          {!loadend ? (
            <Spin size="small" />
          ) : (
            intl.formatMessage({
              id: loadFailed
                ? 'kvCache.instances.loadFailed'
                : 'kvCache.instances.empty'
            })
          )}
        </ExpandedRowGrid.Cell>
      </ExpandedRowGrid>
    );
  }

  return (
    <div>
      {instances.map((item) => (
        <ExpandedRowGrid
          key={item.id}
          gridTemplate={gridTemplate}
          prefixWidth={prefixWidth}
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
                    ramSize={capacityGib}
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
          {nameToStatusSpan > 0 && (
            <ExpandedRowGrid.Cell span={nameToStatusSpan} />
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
          {statusToCreatedSpan > 0 && (
            <ExpandedRowGrid.Cell span={statusToCreatedSpan} />
          )}
          <ExpandedRowGrid.Cell>
            <AutoTooltip ghost minWidth={20}>
              {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </AutoTooltip>
          </ExpandedRowGrid.Cell>
          {createdToActionsSpan > 0 && (
            <ExpandedRowGrid.Cell span={createdToActionsSpan} />
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
