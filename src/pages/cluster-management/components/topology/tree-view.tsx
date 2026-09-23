import { LockOutlined, WarningOutlined } from '@ant-design/icons';
import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Empty, Flex, Segmented, Tree } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { topologyLayerLabel } from '../../config';
import {
  NODE_LAYER,
  TopologyDomain,
  TopologyView,
  TopologyWorker
} from '../../config/types';
import { LocationField, isDiscovered, shownValue } from './location';

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
      padding-block: 2px;
    }
    .ant-tree-node-content-wrapper {
      flex: 1;
      min-width: 0;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
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
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--ant-color-text-tertiary);
      font-size: 12px;
      white-space: nowrap;
    }
    .warn {
      color: var(--ant-color-warning);
    }
    /* The bucket says why nothing landed here, under its own row: the reason
       is the whole point of the node, and it does not fit on the line. */
    .bucket {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      min-width: 0;
    }
    .bucket .why {
      color: var(--ant-color-text-tertiary);
      font-size: 12px;
      white-space: normal;
    }
    .host {
      cursor: pointer;
      &:hover {
        color: var(--ant-color-primary);
      }
    }
  `
}));

interface TreeViewProps {
  view: TopologyView;
  fields: LocationField[];
  /** After the toolbar's search and filter. */
  workers: TopologyWorker[];
  grouping: string;
  onGroupingChange: (grouping: string) => void;
  /** Switch to the table and point at this row. The tree is for checking. */
  onHostClick: (worker: TopologyWorker) => void;
  /** The bucket's "set location": select its hosts and open the batch panel. */
  onSetLocation: (workers: TopologyWorker[], field: string) => void;
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
 * (P8): clicking a host goes back to its row.
 */
const TreeView: React.FC<TreeViewProps> = ({
  view,
  fields,
  workers,
  grouping,
  onGroupingChange,
  onHostClick,
  onSetLocation
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

  const bucketLabel = (field: string) =>
    intl.formatMessage(
      { id: 'clusters.topology.tree.unfilled' },
      { field: fieldLabel(field) }
    );

  /**
   * 🔴 The one node the industry's tools do not have. A missing label never
   * fails a deployment — the group simply never gathers, silently — so the
   * only place it can surface is here, and it has to say which key is missing:
   * "no rack yet" is a symptom, `topology.gpustack.ai/rack` is the fix.
   */
  const layerPrimaryKey = (field: string) =>
    view.layers.find((layer) => layer.id === field)?.label_keys?.[0] || '';

  const bucketWhy = (field: string) =>
    intl.formatMessage(
      { id: 'clusters.topology.tree.unfilled.why' },
      { key: layerPrimaryKey(field) || fieldLabel(field) }
    );

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
            <span>
              {fieldLabel(field)} {shownValue(members[0].location[field])}
            </span>
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
        label: bucketLabel(field),
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
      label: node.unclassified
        ? bucketLabel(node.layer)
        : `${fieldLabel(node.layer)} ${node.name}`,
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
      label: bucketLabel(rootLayer!.id),
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
      <span className="row host" onClick={() => onHostClick(worker)}>
        <AutoTooltip ghost title={worker.name} minWidth={20}>
          {worker.name}
        </AutoTooltip>
        <span className="tail">
          {intl.formatMessage(
            { id: 'clusters.topology.tree.hostCapacity' },
            { gpus: worker.gpus, free: worker.free_gpus }
          )}
        </span>
      </span>
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

  const groupNode = (group: Group): any => {
    const row = (
      <span className="row">
        <span className="label">
          {group.unfilledField && (
            <WarningOutlined className="warn" style={{ marginRight: 6 }} />
          )}
          {group.label}
        </span>
        <span className="meta">{capacity(group.workers)}</span>
        <span className="tail">
          {group.unfilledField && (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                onSetLocation(group.workers, group.unfilledField!);
              }}
            >
              {intl.formatMessage({ id: 'clusters.topology.batch.button' })}
            </Button>
          )}
        </span>
      </span>
    );
    return {
      key: group.key,
      selectable: false,
      title: group.why ? (
        <span className="bucket">
          {row}
          <span className="why">{group.why}</span>
        </span>
      ) : (
        row
      ),
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
        <span className="row">
          <span className="label">
            {intl.formatMessage({ id: 'clusters.topology.cluster' })}
          </span>
          <span className="meta">{capacity(workers)}</span>
        </span>
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
      <Flex align="center" justify="space-between">
        {/* Hidden while it holds a single option. With one tree that is the
            normal case, and a Segmented with nothing to switch to is a control
            that looks like a choice and offers none. It reappears only when the
            overview sent the reader to a flat rung — which is also the only
            time there is somewhere to switch back to. */}
        {options.length > 1 ? (
          <Segmented
            size="small"
            value={grouping}
            options={options}
            onChange={(value) => onGroupingChange(value as string)}
          />
        ) : (
          /* Keeps the expand/collapse pair pinned right when the switch is
             gone; `justify="space-between"` needs two children. */
          <span />
        )}
        <Flex gap={4}>
          <Button
            type="link"
            size="small"
            onClick={() => setExpanded(allGroupKeys)}
          >
            {intl.formatMessage({ id: 'clusters.topology.tree.expandAll' })}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => setExpanded(['root'])}
          >
            {intl.formatMessage({ id: 'clusters.topology.tree.collapseAll' })}
          </Button>
        </Flex>
      </Flex>
      {workers.length ? (
        <Tree
          className={styles.tree}
          treeData={treeData}
          blockNode
          selectable={false}
          // Down to the domain level by default: hosts stay folded.
          expandedKeys={expanded ?? allGroupKeys}
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
