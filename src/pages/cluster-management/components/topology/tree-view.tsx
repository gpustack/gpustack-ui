import { status, WorkerStatusMapValue } from '@/pages/resources/config';
import {
  ExpandAltOutlined,
  InfoCircleOutlined,
  LockOutlined,
  ShrinkOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { AutoTooltip, StatusDot } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Empty, Flex, Segmented, Tooltip, Tree } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { topologyLayerLabel } from '../../config';
import {
  NODE_LAYER,
  TopologyDomain,
  TopologyView,
  TopologyWorker
} from '../../config/types';
import { isDiscovered, LocationField } from './location';

/** Hosts shown per domain before "N more". Forty expanded is not a view. */
const HOSTS_PREVIEW = 3;

/** The cluster's one nested tree. Any other value groups flat by that field. */
export const TREE_GROUPING = 'tree';

// 🔴 `DOMAIN_TREE_GROUPING` is gone with the second tree. The switch used to
// pick between "by layer" and "by accelerator domain", and every group carried
// the *other* tree's value in its margin («这个域跨 3 个机柜») because neither
// tree could show that on its own. With one chain the domain, if an operator
// declared one, is a rung of this tree — so it is already on screen, in its
// own place, and a margin note would repeat an ancestor's name.

const useStyles = createStyles(({ css }) => ({
  tree: css`
    .ant-tree-treenode {
      width: 100%;
      padding-block: 0;
      border-radius: var(--ant-border-radius);
      &:hover {
        background: var(--ant-control-item-bg-hover);
        > .ant-tree-node-content-wrapper {
          background: transparent;
        }
      }
    }
    .ant-tree-node-content-wrapper {
      flex: 1;
      min-width: 0;
      padding-block: var(--ant-padding-xs);
    }
    .ant-tree-switcher {
      line-height: calc(
        var(--ant-control-height-sm) + 2 * var(--ant-padding-xs)
      );
      &::before {
        height: 100%;
      }
    }
    .ant-tree-indent-unit {
      position: relative;
      height: 100%;
      &::before {
        content: '';
        position: absolute;
        inset-block-start: 0;
        inset-block-end: calc(-0.5 * var(--ant-padding-xs));
        inset-inline-start: 50%;
        border-inline-start: 1px solid var(--ant-color-border-secondary);
        pointer-events: none;
      }
      &:last-child::after {
        content: '';
        position: absolute;
        inset-block-start: 50%;
        inset-inline-start: 50%;
        width: 50%;
        border-block-start: 1px solid var(--ant-color-border-secondary);
        pointer-events: none;
      }
    }
    .ant-tree-indent:not(:empty) + .ant-tree-switcher::after {
      content: '';
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 0;
      width: calc(50% - var(--ant-font-size-sm) / 2);
      border-block-start: 1px solid var(--ant-color-border-secondary);
      pointer-events: none;
    }
    .ant-tree-indent:not(:empty) + .ant-tree-switcher-noop::after {
      width: 100%;
    }
    .row {
      width: 100%;
      min-width: 0;
    }
    .label {
      flex-shrink: 0;
    }
    .meta {
      color: var(--ant-color-text-tertiary);
      font-size: 12px;
      white-space: nowrap;
    }
    .tail {
      margin-inline-start: auto;
      min-width: 0;
      color: var(--ant-color-text-tertiary);
      font-size: 12px;
      white-space: nowrap;
    }
    .why {
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      pointer-events: none;
    }
    .ant-tree-treenode:hover > .ant-tree-node-content-wrapper .why,
    .ant-tree-treenode:focus-within > .ant-tree-node-content-wrapper .why,
    &:focus-within
      .ant-tree-treenode-active
      > .ant-tree-node-content-wrapper
      .why {
      opacity: 1;
      pointer-events: auto;
    }
    @media (hover: none) {
      .why {
        opacity: 1;
        pointer-events: auto;
      }
    }
    .warn {
      color: var(--ant-color-warning);
    }
    .info {
      color: var(--ant-color-text-tertiary);
      cursor: help;
      &:focus-visible {
        outline: 2px solid var(--ant-color-primary-border);
        outline-offset: 2px;
        border-radius: var(--ant-border-radius-sm);
      }
    }
    .host {
      cursor: pointer;
      &:hover {
        color: var(--ant-color-primary);
      }
    }
  `,
  hint: css`
    overflow-wrap: anywhere;
  `,
  keys: css`
    margin: 0;
    padding-inline-start: var(--ant-padding);
    list-style-type: disc;
    li + li {
      margin-block-start: var(--ant-margin-xxs);
    }
  `
}));

interface TreeViewProps {
  toolbarContainer: HTMLElement | null;
  view: TopologyView;
  fields: LocationField[];
  /** After the toolbar's search and filter. */
  workers: TopologyWorker[];
  grouping: string;
  onGroupingChange: (grouping: string) => void;
  /** Switch to the table and filter by this worker's name. */
  onHostClick: (worker: TopologyWorker) => void;
}

interface Group {
  key: string;
  label: React.ReactNode;
  workers: TopologyWorker[];
  unfilledField?: string;
  /** Why this bucket is not empty, and what to do about it. */
  why?: React.ReactNode;
  children?: Group[];
}

/**
 * [S1b] The cluster's one tree, re-counted here from `workers` so the
 * toolbar's filter applies without a request. Nothing is edited on the tree
 * (P8): clicking a host filters the table by its name.
 */
const TreeView: React.FC<TreeViewProps> = ({
  toolbarContainer,
  view,
  fields,
  workers,
  grouping,
  onGroupingChange,
  onHostClick
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [expanded, setExpanded] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const byId = new Map(workers.map((worker) => [worker.id, worker]));

  const fieldLabel = (id: string) => {
    const shown = fields.find((field) => field.id === id);
    if (shown) {
      return shown.label;
    }
    // A rung hidden by the column picker still labels its tree node.
    const rung = view.layers.find((layer) => layer.id === id);
    return topologyLayerLabel(intl, rung) || id;
  };

  const capacity = (list: TopologyWorker[]) =>
    intl.formatMessage(
      { id: 'clusters.topology.preview.capacity' },
      {
        workers: list.length,
        gpus: list.reduce((sum, w) => sum + (w.gpus || 0), 0),
        free: list.reduce((sum, w) => sum + (w.free_gpus || 0), 0)
      }
    );

  const allDiscovered = (list: TopologyWorker[], field: string) =>
    list.every((w) => isDiscovered(w.location?.[field]));

  /** Unconfigured layers need a different fix from missing worker labels. */
  const layerLabelKeys = (field: string) =>
    view.layers.find((layer) => layer.id === field)?.label_keys || [];

  const bucketWhy = (field: string) =>
    layerLabelKeys(field).length
      ? undefined
      : intl.formatMessage({ id: 'clusters.topology.cell.noKeys.tips' });

  /** Flat: one group per value of `field`, plus the unfilled bucket. */
  const flatGroups = (field: string, list: TopologyWorker[]): Group[] => {
    const map = new Map<string, TopologyWorker[]>();
    const unfilled: TopologyWorker[] = [];
    list.forEach((worker) => {
      const value = worker.location?.[field]?.value;
      if (!value) {
        unfilled.push(worker);
        return;
      }
      map.set(value, [...(map.get(value) || []), worker]);
    });
    const groups: Group[] = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, members]) => ({
        key: `${field}:${value}`,
        label: (
          <>
            {fieldLabel(field)}
            {allDiscovered(members, field) && (
              <LockOutlined className="text-tertiary" />
            )}
          </>
        ),
        workers: members
      }));
    if (unfilled.length) {
      groups.push({
        key: `${field}:<unfilled>`,
        label: fieldLabel(field),
        workers: unfilled,
        unfilledField: field,
        why: bucketWhy(field)
      });
    }
    return groups;
  };

  /** Nested: the server's tree, re-counted over the filtered workers. */
  const nestedGroups = (node: TopologyDomain, path: string): Group | null => {
    const key = `${path}/${node.layer}:${node.name}`;
    const children = (node.children || [])
      .filter((child) => child.layer !== NODE_LAYER)
      .map((child) => nestedGroups(child, key))
      .filter(Boolean) as Group[];
    const leaves = (node.children || [])
      .filter((child) => child.layer === NODE_LAYER)
      .flatMap((child) => child.worker_ids || [])
      .map((id) => byId.get(id))
      .filter(Boolean) as TopologyWorker[];
    const members = [...leaves, ...children.flatMap((c) => c.workers)];
    if (!members.length) {
      return null;
    }
    return {
      key,
      label: fieldLabel(node.layer),
      workers: members,
      unfilledField: node.unclassified ? node.layer : undefined,
      why: node.unclassified ? bucketWhy(node.layer) : undefined,
      children: children.length ? children : undefined
    };
  };

  /** The nested tree, or a flat grouping by whichever field was picked. */
  const nested = grouping === TREE_GROUPING;
  const root = view.tree;
  const rootLayer = view.layers.find(
    (layer) => layer.active && layer.id !== NODE_LAYER
  );

  const groups: Group[] = nested
    ? ((root?.children || [])
        .filter((child) => child.layer !== NODE_LAYER)
        .map((child) => nestedGroups(child, ''))
        .filter(Boolean) as Group[])
    : flatGroups(grouping, workers);

  // Hosts directly under the root (no layer active at all) in nested mode.
  const rootHosts = nested
    ? ((root?.children || [])
        .filter((child) => child.layer === NODE_LAYER)
        .flatMap((child) => child.worker_ids || [])
        .map((id) => byId.get(id))
        .filter(Boolean) as TopologyWorker[])
    : [];

  /**
   * The bucket the server did not send. A tree whose top rung is declared but
   * whose value some worker misses drops that worker out of every node — and
   * an invisible worker is exactly the failure mode this view exists to catch.
   * Only when the chain has an active rung: a chain nobody declared has not
   * failed to classify anything, it simply is not in use.
   */
  const placed = new Set(groups.flatMap((g) => g.workers.map((w) => w.id)));
  const stranded =
    nested && rootLayer
      ? workers.filter((worker) => !placed.has(worker.id))
      : [];
  // No double-count guard is needed: a server that already sent an
  // unclassified node placed those workers in `groups`, so they are not
  // stranded to begin with.
  if (stranded.length) {
    groups.push({
      key: `${rootLayer!.id}:<stranded>`,
      label: fieldLabel(rootLayer!.id),
      workers: stranded,
      unfilledField: rootLayer!.id,
      why: bucketWhy(rootLayer!.id)
    });
  }
  const strandedIds = new Set(stranded.map((worker) => worker.id));
  const looseHosts = stranded.length
    ? rootHosts.filter((worker) => !strandedIds.has(worker.id))
    : rootHosts;

  // A host row carries only its name and its capacity. It used to also repeat
  // the other chain's value («node-9 · 加速器域 pod-1»), which was the one
  // place that fact appeared while grouping by rack. One chain puts it on an
  // ancestor node instead, so repeating it here would be the same string twice
  // in one column.
  const hostNode = (worker: TopologyWorker, parentKey: string) => ({
    key: `${parentKey}/host:${worker.id}`,
    isLeaf: true,
    selectable: false,
    title: (
      <Flex
        component="span"
        align="center"
        gap={12}
        className="row host"
        onClick={() => onHostClick(worker)}
      >
        <AutoTooltip
          ghost
          title={`${worker.name} · ${WorkerStatusMapValue[worker.state] || worker.state}`}
          minWidth={20}
          showTitle
        >
          <StatusDot
            statusValue={{
              status: status[worker.state] || 'inactive',
              text: worker.name
            }}
          />
        </AutoTooltip>
        <span className="meta">
          {intl.formatMessage(
            { id: 'clusters.topology.tree.hostCapacity' },
            { gpus: worker.gpus, free: worker.free_gpus }
          )}
        </span>
      </Flex>
    )
  });

  const hostNodes = (list: TopologyWorker[], parentKey: string): any[] => {
    const shown = revealed.has(parentKey) ? list : list.slice(0, HOSTS_PREVIEW);
    const nodes: any[] = shown.map((worker) => hostNode(worker, parentKey));
    if (shown.length < list.length) {
      nodes.push({
        key: `${parentKey}/more`,
        isLeaf: true,
        selectable: false,
        title: (
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => setRevealed(new Set([...revealed, parentKey]))}
          >
            {intl.formatMessage(
              { id: 'clusters.topology.tree.more' },
              { count: list.length - shown.length }
            )}
          </Button>
        )
      });
    }
    return nodes;
  };

  const unmatched = intl.formatMessage({
    id: 'clusters.topology.tree.unmatched.tips'
  });
  const candidateKeys = intl.formatMessage({
    id: 'clusters.topology.tree.candidateKeys'
  });

  const groupNode = (group: Group): any => {
    const keys = group.unfilledField ? layerLabelKeys(group.unfilledField) : [];
    const row = (
      <Flex component="span" align="center" gap={12} className="row">
        <Flex component="span" align="center" gap={6} className="label">
          {group.unfilledField &&
            (keys.length ? (
              <Tooltip
                trigger={['hover', 'focus']}
                title={
                  <Flex
                    orientation="vertical"
                    gap="small"
                    className={styles.hint}
                  >
                    <span>{unmatched}</span>
                    <Flex orientation="vertical" gap="var(--ant-margin-xxs)">
                      <span>{candidateKeys}</span>
                      <ul className={styles.keys}>
                        {keys.map((key) => (
                          <li key={key}>{key}</li>
                        ))}
                      </ul>
                    </Flex>
                  </Flex>
                }
              >
                <InfoCircleOutlined
                  className="info"
                  tabIndex={0}
                  aria-label={`${unmatched} ${candidateKeys}：${keys.join(', ')}`}
                />
              </Tooltip>
            ) : (
              <WarningOutlined className="warn" />
            ))}
          {group.label}
        </Flex>
        {!group.unfilledField && (
          <span className="meta">{capacity(group.workers)}</span>
        )}
        {group.why && <span className="tail why">{group.why}</span>}
      </Flex>
    );
    return {
      key: group.key,
      selectable: false,
      title: row,
      children: group.children
        ? group.children.map(groupNode)
        : hostNodes(group.workers, group.key)
    };
  };

  const treeData = [
    {
      key: 'root',
      selectable: false,
      title: (
        <Flex component="span" align="center" gap={12} className="row">
          <span className="label">
            {intl.formatMessage({ id: 'clusters.topology.cluster' })}
          </span>
          <span className="meta">{capacity(workers)}</span>
        </Flex>
      ),
      children: [...groups.map(groupNode), ...hostNodes(looseHosts, 'root')]
    }
  ];

  const allGroupKeys: string[] = ['root'];
  const collect = (list: Group[]) =>
    list.forEach((group) => {
      allGroupKeys.push(group.key);
      if (group.children) {
        collect(group.children);
      }
    });
  collect(groups);

  const expandedKeys = expanded ?? allGroupKeys;
  const expandedKeySet = new Set(expandedKeys);
  const allExpanded = allGroupKeys.every((key) => expandedKeySet.has(key));
  const collapsedKeys = groups.length ? ['root'] : [];
  const toggleLabel = intl.formatMessage({
    id: allExpanded
      ? 'clusters.topology.tree.collapseAll'
      : 'clusters.topology.tree.expandAll'
  });

  // One tree, so the switch only ever has a second entry when the overview
  // sent us here to look at a single rung flat («机房 3 个»). It is not a
  // permanent mode: nothing offers it until something asks for it.
  const options = [
    {
      value: TREE_GROUPING,
      label: intl.formatMessage({ id: 'clusters.topology.tree.byLayer' })
    }
  ];
  if (grouping !== TREE_GROUPING) {
    options.push({
      value: grouping,
      label: intl.formatMessage(
        { id: 'clusters.topology.tree.byField' },
        { field: fieldLabel(grouping) }
      )
    });
  }

  return (
    <Flex orientation="vertical" gap={12}>
      {options.length > 1 && (
        <Segmented
          size="small"
          value={grouping}
          options={options}
          onChange={(value) => onGroupingChange(value as string)}
        />
      )}
      {toolbarContainer &&
        createPortal(
          <Button
            icon={allExpanded ? <ShrinkOutlined /> : <ExpandAltOutlined />}
            disabled={!workers.length}
            onClick={() =>
              setExpanded(allExpanded ? collapsedKeys : allGroupKeys)
            }
          >
            {toggleLabel}
          </Button>,
          toolbarContainer
        )}
      {workers.length ? (
        <Tree
          className={styles.tree}
          treeData={treeData}
          blockNode
          selectable={false}
          // Down to the domain level by default: hosts stay folded.
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpanded(keys as string[])}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={intl.formatMessage({
            id: 'clusters.topology.preview.noWorkers'
          })}
        />
      )}
    </Flex>
  );
};

export default TreeView;
