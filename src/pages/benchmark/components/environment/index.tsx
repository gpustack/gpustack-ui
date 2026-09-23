import {
  RowChildren,
  Table as SealTable,
  TableProvider,
  useExpandedRowKeys
} from '@gpustack/core-ui';
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

  // Every member the run's snapshot covers. One for a plain model; for a group
  // all of them, because what the reader compares is what the deployment cost
  // and a group's cards are spread across its prefill and decode members. The
  // endpoint alone would report the run on zero cards — the router holds none.
  const members = useMemo(
    () => Object.values(snapshot.instances || {}),
    [snapshot.instances]
  );
  // The member the load was sent to, which is the group's router. Its own
  // worker is marked Main below: it is the one address the run talked to.
  const instanceData = useMemo(
    () =>
      members.find((item) => item.name === detailData?.model_instance_name) ||
      members[0],
    [members, detailData?.model_instance_name]
  );

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

  // One row per WORKER, not per member: two members of a group placed on the
  // same machine are one machine, and listing it twice would double its cards
  // in a table that exists to say how much hardware the run used. A worker
  // reached by several members carries the union of their cards.
  //
  // Which members those were is carried per row (`hosted`) rather than left
  // implicit. Without it a disaggregated run is a list of identical-looking
  // machines: the reader cannot tell which one held prefill and which held
  // decode, and the router's machine — the one marked Main — looks broken
  // because a router owns no card, so it has no driver or runtime version to
  // show.
  const dataList = useMemo(() => {
    const rows = new Map<number, any>();

    const addWorker = (
      workerId: number,
      gpuIds: string[] | undefined,
      isMain: boolean,
      member: any
    ) => {
      const worker = findWorkerById(workerId);
      if (!worker) {
        return;
      }
      const gpuData = findGPUByGPUIds(gpuIds || []);
      // A member spanning several workers is the same member on each of them,
      // so it is listed once per row, not once per worker it reaches.
      const hostedEntry = { name: member?.name, role: member?.role };
      const existing = rows.get(worker.id);
      if (existing) {
        const seen = new Set(existing.children.map((gpu: GPUData) => gpu.id));
        const added = gpuData.filter((gpu) => !seen.has(gpu.id));
        existing.children.push(...added);
        // The driver and runtime versions are read off a card, and the row may
        // have been opened by a member that holds none — a router is the case
        // that produced this. Backfill from the first card to arrive, or the
        // row lists GPUs with both version columns blank.
        if (!existing.driver_version && !existing.runtime_version) {
          Object.assign(
            existing,
            _.pick(added[0], ['driver_version', 'runtime_version'])
          );
        }
        existing.isMain = existing.isMain || isMain;
        if (
          hostedEntry.name &&
          !existing.hosted.some((m: any) => m.name === hostedEntry.name)
        ) {
          existing.hosted.push(hostedEntry);
        }
        return;
      }
      rows.set(worker.id, {
        ...worker,
        ..._.pick(gpuData?.[0], ['driver_version', 'runtime_version']),
        isMain,
        hosted: hostedEntry.name ? [hostedEntry] : [],
        children: [...gpuData]
      });
    };

    members.forEach((member) => {
      addWorker(
        member.worker_id,
        member.gpu_ids,
        member.name === instanceData?.name,
        member
      );
      (member.subordinate_workers || []).forEach((worker: any) =>
        addWorker(worker.worker_id, worker.gpu_ids, false, member)
      );
    });

    return Array.from(rows.values()) as WorkerData[];
  }, [snapshot.gpus, snapshot.workers, members, instanceData]);

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
      <TableProvider
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
      </TableProvider>
    </Container>
  );
};

export default Environment;
