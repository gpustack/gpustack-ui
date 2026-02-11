import RowChildren from '@/components/seal-table/components/row-children';
import SealTable from '@/components/seal-table/index';
import TableContext from '@/components/seal-table/table-context';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { Col, Row } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useDetailContext } from '../../config/detail-context';
import { GPUData, WorkerData } from '../../config/detail-types';
import GPUHeader from './gpu-header';
import useGPUColumns from './use-gpu-columns';
import useWorkerColumns from './use-worker-columns';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const GPURowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

/**
 *
 * @returns display worker info and gpu info.
 */

const Environment: React.FC = () => {
  const GPUColumns = useGPUColumns();
  const workerColumns = useWorkerColumns();
  const { detailData } = useDetailContext();
  const { snapshot } = detailData;

  // instance info
  const instanceEntry = Object.entries(snapshot.instances || {})[0];
  const instanceData = instanceEntry?.[1];

  const { handleExpandChange, handleExpandAll, expandedRowKeys } =
    useExpandedRowKeys();

  const workerMap = useMemo(() => {
    return new Map(
      Object.entries(snapshot.workers || {}).map(([workerName, workerInfo]) => [
        workerInfo.id,
        workerInfo
      ])
    );
  }, [snapshot.workers]);

  const gpuList = useMemo(() => {
    return Object.values(snapshot.gpus || {}) || [];
  }, [snapshot.gpus]);

  const findWorkerById = (workerID: number): WorkerData | undefined => {
    return workerMap.get(workerID) || undefined;
  };

  const findGPUByGPUIds = (ids: string[]): GPUData[] => {
    return gpuList.filter((gpu) => ids.includes(gpu.id));
  };

  // main worker

  const mainWorker = useMemo(() => {
    const mainworker = findWorkerById(instanceData.worker_id);

    if (!mainworker) {
      return null;
    }

    const gpuData = findGPUByGPUIds(instanceData.gpu_ids);

    return {
      ...mainworker,
      ..._.pick(gpuData?.[0], ['driver_version', 'runtime_version']),
      isMain: true,
      children: gpuData
    };
  }, [snapshot.gpus, snapshot.workers, instanceData]);

  // subordinate workers

  const subWorkerList = useMemo(() => {
    const subOrdinaryWorkers = instanceData?.subordinate_workers || [];

    return subOrdinaryWorkers.map((worker) => {
      // Find the worker info from the snapshot workers
      const subWorker = findWorkerById(worker.worker_id);

      if (!subWorker) {
        return null;
      }
      const gpuData = findGPUByGPUIds(worker.gpu_ids);

      return {
        ...subWorker,
        ..._.pick(gpuData?.[0], ['driver_version', 'runtime_version']),
        isMain: false,
        children: gpuData
      };
    });
  }, [snapshot.gpus, snapshot.workers, instanceData]);

  const dataList = useMemo(() => {
    return [mainWorker, ...subWorkerList].filter(Boolean) as WorkerData[];
  }, [mainWorker, subWorkerList]);

  const allChildren = useMemo(() => {
    return dataList.reduce<GPUData[]>(
      (
        acc,
        worker: {
          children?: GPUData[];
          [key: string]: any;
        }
      ) => {
        if (worker.children && worker.children.length > 0) {
          acc.push(...(worker.children as GPUData[]));
        }
        return acc;
      },
      []
    );
  }, [dataList]);

  const loadChildren = useMemoizedFn(async (record: any) => {
    return record.children || [];
  });

  const handleToggleExpandAll = useMemoizedFn(async (expanded: boolean) => {
    const keys = dataList?.map((item) => item.id);
    handleExpandAll(expanded, keys);
  });

  const renderChildren = useMemoizedFn((list: any[]) => {
    return (
      <div style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}>
        <GPUHeader columns={GPUColumns}></GPUHeader>
        <GPURowWrapper>
          {list.map((gpu) => (
            <RowChildren key={gpu.id}>
              <Row key={gpu.id} style={{ width: '100%' }} align="middle">
                {GPUColumns.map((col) => (
                  <Col
                    key={col.key}
                    span={col.span}
                    style={{ ...col.colStyle }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 4,
                        flexDirection: 'column'
                      }}
                    >
                      {col.render
                        ? col.render(gpu[col.dataIndex], gpu)
                        : gpu[col.dataIndex]}
                    </span>
                  </Col>
                ))}
              </Row>
            </RowChildren>
          ))}
        </GPURowWrapper>
      </div>
    );
  });

  return (
    <Container>
      <TableContext.Provider
        value={{
          allChildren: allChildren
        }}
      >
        <SealTable
          rowKey="id"
          loadChildren={loadChildren}
          expandedRowKeys={expandedRowKeys}
          onExpand={handleExpandChange}
          onExpandAll={handleToggleExpandAll}
          renderChildren={renderChildren}
          showSorterTooltip={false}
          childParentKey="worker_id"
          dataSource={dataList}
          loading={false}
          loadend={true}
          columns={workerColumns}
          expandable={true}
        ></SealTable>
      </TableContext.Provider>
    </Container>
  );
};

export default Environment;
