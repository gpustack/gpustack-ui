import useGranfanaLink from '@/pages/resources/hooks/use-grafana-link';
import { DownOutlined, HddFilled } from '@ant-design/icons';
import {
  DropdownActions,
  GrafanaIcon,
  StatusDot,
  TextAttribute
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import type { ModelInstanceListItem } from '../../config/types';
import {
  groupWorkloadInfoEntries,
  type WorkloadInfoEntry
} from './workload-info';

const useStyles = createStyles(({ css }) => ({
  content: css`
    width: 560px;
    max-width: calc(100vw - 48px);
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--color-white-light-1);
    font-size: 13px;
    line-height: 1.5;
    text-align: left;
    color: var(--color-white-secondary);

    .workload-title {
      color: var(--color-white-tertiary);
      margin-bottom: 8px;
      .anticon {
        font-size: 12px;
        color: var(--color-white-quaternary);
      }
    }
    .workload-scroll {
      max-height: 320px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
    .workload-group + .workload-group {
      border-top: 1px solid var(--color-white-light-1);
      margin-top: 8px;
      padding-top: 8px;
    }
    .workload-heading {
      min-height: 28px;
      padding: 0 6px;
      border-radius: var(--ant-border-radius-sm);
      background: var(--color-white-light-1);
      strong {
        flex-shrink: 0;
      }
    }
    .endpoint {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
      font-size: 12px;
      color: var(--color-white-tertiary);
    }
    .workload-action {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      padding: 4px;
      color: var(--color-white-tertiary);
      &:hover {
        background: var(--color-white-light-1) !important;
        color: var(--color-white-secondary) !important;
      }
    }
    .placement {
      padding: 8px 6px 0;
    }
    .node {
      flex-shrink: 0;
      font-size: 12px;
    }
    .worker-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .role {
      flex-shrink: 0;
      color: var(--color-white-tertiary);
      background: var(--color-white-light-1);
    }
    .copy {
      flex-shrink: 0;
      color: inherit;
    }
    .placement-meta {
      --ant-color-text-quaternary: var(--color-white-quaternary);
      font-size: 12px;
      color: var(--color-white-tertiary);
    }
    .readiness {
      color: var(--color-white-secondary);
    }
  `
}));

const WorkloadInfoContent: React.FC<{
  entries: WorkloadInfoEntry[];
  record: ModelInstanceListItem;
}> = ({ entries, record }) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { goToGrafana, showMonitoring } = useGranfanaLink({ type: 'instance' });
  const groups = groupWorkloadInfoEntries(entries);

  const renderMonitor = (entry: WorkloadInfoEntry) => {
    const { monitor, logicalDPSize } = entry;
    if (!showMonitoring || !monitor) return null;
    const label = intl.formatMessage(
      {
        id:
          monitor.component === 'sglang_engine'
            ? 'models.instance.monitor.engine'
            : monitor.component === 'sglang_smg'
              ? 'models.instance.monitor.smg'
              : 'models.instance.monitor.rank'
      },
      { rank: monitor.dp_rank, attempt: monitor.attempt }
    );
    return (
      <Flex align="center" gap={4}>
        <Button
          type="text"
          size="small"
          className="workload-action"
          icon={<GrafanaIcon style={{ width: 16, height: 16 }} />}
          aria-label={label}
          title={`${label} · ${intl.formatMessage(
            { id: 'models.instance.monitor.target' },
            { run: monitor.restart_count, worker: monitor.worker_id }
          )}`}
          onClick={() => goToGrafana(record, monitor)}
        />
        {logicalDPSize && (
          <DropdownActions
            menu={{
              items: Array.from({ length: logicalDPSize }, (_, rank) => ({
                key: String(rank),
                label: intl.formatMessage(
                  { id: 'models.instance.monitor.logicalRank' },
                  { rank }
                )
              })),
              style: { maxHeight: 240, overflowY: 'auto' },
              onClick: ({ key }) => {
                const rank = Number(key);
                if (
                  Number.isInteger(rank) &&
                  rank >= 0 &&
                  rank < logicalDPSize
                ) {
                  goToGrafana(record, { ...monitor, dp_rank: rank });
                }
              }
            }}
          >
            <Button
              type="text"
              size="small"
              className="workload-action"
              icon={<DownOutlined />}
              aria-label={intl.formatMessage({
                id: 'models.instance.monitor.logicalDP'
              })}
              title={intl.formatMessage({
                id: 'models.instance.monitor.logicalHint'
              })}
            />
          </DropdownActions>
        )}
      </Flex>
    );
  };

  const renderEntry = (entry: WorkloadInfoEntry) => {
    const { placement, component, state } = entry;
    const main = placement
      ? placement.node_rank === 0
      : component?.api_port != null;
    const ready = placement?.ready ?? component?.ready;
    return (
      <div className="placement" key={entry.key}>
        <Flex align="center" gap={6}>
          {placement && (
            <span className="node">node {placement.node_rank}</span>
          )}
          <TextAttribute className="role" variant="filled">
            {component?.kind === 'sglang_smg'
              ? 'CPU'
              : main
                ? 'Main'
                : 'Headless'}
          </TextAttribute>
          <span className="worker-name" title={entry.workerName}>
            {entry.workerName}
          </span>
          <Typography.Text className="copy" copyable={{ text: entry.detail }} />
        </Flex>
        <Flex component="span" align="center" justify="space-between" gap={8}>
          <Flex
            component="span"
            className="placement-meta"
            align="center"
            gap={12}
            wrap
          >
            {placement && <span>GPU [{placement.gpu_indexes.join(', ')}]</span>}
            <StatusDot
              statusValue={{
                status:
                  state === 'running'
                    ? 'success'
                    : state === 'failed'
                      ? 'error'
                      : state === 'pending'
                        ? 'transitioning'
                        : 'inactive',
                text: state
              }}
            />
            {main && (
              <span className="readiness">
                {intl.formatMessage({
                  id:
                    ready === true
                      ? 'models.instance.workloads.apiReady'
                      : ready === false
                        ? 'models.instance.workloads.apiNotReady'
                        : 'models.instance.workloads.apiUnknown'
                })}
              </span>
            )}
          </Flex>
        </Flex>
      </div>
    );
  };

  return (
    <div className={styles.content}>
      <Flex className="workload-title" align="center" gap={6}>
        <HddFilled />
        {intl.formatMessage({ id: 'models.instance.workloads' })}
      </Flex>
      <div className="workload-scroll">
        {!groups.length &&
          intl.formatMessage({ id: 'models.instance.workloads.pending' })}
        {groups.map((group) => {
          const main = group.entries.find(
            (entry) => entry.placement?.node_rank === 0
          );
          const entry = main || group.entries[0];
          const component = entry.component;
          const api = component
            ? component.kind === 'sglang_smg'
              ? `aggregate API ${entry.api}`
              : `${component.api_port == null ? 'headless | API -' : `shared API ${entry.api}`} | ${intl.formatMessage({ id: 'models.instance.workloads.logicalDPSize' }, { count: component.dp_size ?? '-' })}`
            : main?.api || '-';
          return (
            <section className="workload-group" key={group.key}>
              <Flex className="workload-heading" align="center" gap={12}>
                <strong>
                  {group.rank !== undefined
                    ? `DP ${group.rank}`
                    : component?.kind === 'sglang_smg'
                      ? 'SMG'
                      : 'Engine'}
                </strong>
                <span className="endpoint">{api}</span>
                {renderMonitor(entry)}
              </Flex>
              {group.entries.map(renderEntry)}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default WorkloadInfoContent;
