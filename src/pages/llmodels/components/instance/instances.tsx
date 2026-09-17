import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { queryModelCacheMetrics } from '../../apis';
import { CACHE_METRICS_WINDOW } from '../../config';
import { ModelInstanceListItem } from '../../config/types';
import '../../style/instance-item.less';
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

  return (
    <Wrapper>
      {_.map(list, (item: ModelInstanceListItem, index: number) => {
        return (
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
      })}
    </Wrapper>
  );
};
export default Instances;
