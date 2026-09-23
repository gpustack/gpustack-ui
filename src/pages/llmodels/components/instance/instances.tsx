import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { queryModelCacheMetrics } from '../../apis';
import { CACHE_METRICS_WINDOW } from '../../config';
import { ModelInstanceListItem } from '../../config/types';
import '../../style/instance-item.less';
import RoleGroupHeader from '../pd/role-group-header';
import { orderedRoleStatus } from '../pd/role-status';
import InstanceItem from './instance-item';

// Read once per expanded deployment rather than per instance: the
// endpoint answers for all of the model's instances in one query, so the
// tooltips look up a map instead of each firing its own request. A
// deployment that attaches no cache service asks nothing.
const useCacheHitRates = (
  modelId: number | undefined,
  attached: boolean,
  instanceCount: number
) => {
  const [hitRates, setHitRates] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!modelId || !attached) {
      setHitRates({});
      return;
    }
    let active = true;
    queryModelCacheMetrics(modelId, { window: CACHE_METRICS_WINDOW.value })
      .then((data) => {
        if (!active) {
          return;
        }
        const next: Record<string, number | null> = {};
        if (data?.available) {
          data.instances?.forEach((item) => {
            if (item.model_instance_name) {
              next[item.model_instance_name] = item.hit_rate ?? null;
            }
          });
        }
        setHitRates(next);
      })
      .catch(() => {
        // metrics are optional context: the tooltip drops the line
        // rather than the row failing
        if (active) {
          setHitRates({});
        }
      });
    return () => {
      active = false;
    };
    // a rescaled deployment re-reads, so new instances get their rows
  }, [modelId, attached, instanceCount]);

  return hitRates;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

interface InstanceItemProps {
  list: ModelInstanceListItem[];
  workerList: WorkerListItem[];
  modelData?: any;
  currentExpanded?: string;
  gridTemplate?: string;
  prefixWidth?: number;
  columns?: any[];
  handleChildSelect: (val: string, item: ModelInstanceListItem) => void;
}

const Instances: React.FC<InstanceItemProps> = ({
  list,
  workerList,
  modelData,
  currentExpanded,
  gridTemplate,
  prefixWidth,
  columns,
  handleChildSelect
}) => {
  const [firstLoad, setFirstLoad] = React.useState(true);
  // Which role groups the user has folded away. Every group starts open: the
  // expanded row was opened to see the members, so opening it onto a column of
  // headings would answer nothing.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  const toggleRole = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(name)) {
        next.add(name);
      }
      return next;
    });
  };

  const attached = useMemo(
    () => _.some(list, (item: ModelInstanceListItem) => !!item.cache_config),
    [list]
  );
  const hitRates = useCacheHitRates(modelData?.id, attached, list?.length || 0);

  const defaultOpenId = useMemo(() => {
    if (!currentExpanded) {
      return '';
    }
    const current = _.find(
      list,
      (item: ModelInstanceListItem) => item.worker_id
    );
    return current ? current.name : '';
  }, [currentExpanded, list]);

  useEffect(() => {
    setFirstLoad(false);
  }, []);

  const renderInstance = (item: ModelInstanceListItem) => (
    <InstanceItem
      key={item.name}
      modelData={modelData}
      workerList={workerList}
      instanceData={item}
      cacheHitRate={hitRates[item.name]}
      defaultOpenId={firstLoad ? defaultOpenId : ''}
      handleChildSelect={handleChildSelect}
      gridTemplate={gridTemplate}
      prefixWidth={prefixWidth}
      columns={columns}
    ></InstanceItem>
  );

  // A model without roles is the flat list it has always been: same wrapper,
  // same rows, no summary bar and no headings. Everything below is additive and
  // reached only through this flag.
  if (!modelData?.roles?.length) {
    return <Wrapper>{_.map(list, renderInstance)}</Wrapper>;
  }

  // Group by role, in the order the roles run in, with `role_status` as the
  // authority for which roles exist and how many members each was asked for —
  // a role whose members have not been created yet still gets its heading, and
  // an instance whose role the spec no longer mentions still gets rendered.
  const columnCount = columns?.length ?? 0;
  const byRole = _.groupBy(
    list,
    (item: ModelInstanceListItem) => item.role || ''
  );
  const groups = orderedRoleStatus(modelData.role_status, modelData.roles).map(
    (item) => ({ item, instances: byRole[item.name] || [] })
  );
  const named = new Set(groups.map((group) => group.item.name));
  const ungrouped = _.flatMap(
    Object.keys(byRole).filter((role) => !named.has(role)),
    (role: string) => byRole[role]
  );

  return (
    <Wrapper>
      {/* No group-level bar here: the expansion is role headings and their
          members, nothing else. Reading PD effectiveness or KV transfer rate
          would mean a Prometheus round trip per expand, and neither the
          endpoints nor the panel for it exist on either side. */}
      {groups.map((group) => (
        <React.Fragment key={group.item.name}>
          <RoleGroupHeader
            item={group.item}
            gridTemplate={gridTemplate}
            prefixWidth={prefixWidth}
            columnCount={columnCount}
            collapsed={collapsed.has(group.item.name)}
            // No handler when there is nothing to hide, which is what turns
            // the caret off in the heading.
            onToggle={
              group.instances.length
                ? () => toggleRole(group.item.name)
                : undefined
            }
          ></RoleGroupHeader>
          {!collapsed.has(group.item.name) &&
            group.instances.map(renderInstance)}
        </React.Fragment>
      ))}
      {/* Members the role list does not account for. Rendered without a
          heading rather than dropped — hiding a running instance is the one
          thing this view must never do. */}
      {ungrouped.map(renderInstance)}
    </Wrapper>
  );
};
export default Instances;
