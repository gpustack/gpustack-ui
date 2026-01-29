import AutoTooltip from '@/components/auto-tooltip';
import RowChildren from '@/components/seal-table/components/row-children';
import SealTable from '@/components/seal-table/index';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import { convertFileSize } from '@/utils';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { Col, Row, Tag } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useDetailContext } from '../../config/detail-context';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Environment: React.FC = () => {
  const { detailData } = useDetailContext();
  const { snapshot } = detailData;

  const { handleExpandChange, handleExpandAll, expandedRowKeys } =
    useExpandedRowKeys();

  const mainWorker = useMemo(() => {
    // get workers data

    const [[workerName, workerInfo]] = Object.entries(snapshot.workers);
    const gpuData = Object.values(snapshot.gpus).filter(
      (gpu) => gpu.worker_name === workerName
    );

    return {
      ...workerInfo,
      ..._.pick(gpuData?.[0], ['driver_version', 'runtime_version']),
      isMain: true,
      children: gpuData
    };
  }, [snapshot]);

  const subWorkers = useMemo(() => {
    const [[instanceName, instanceData]] = Object.entries(snapshot.instances);

    const subOrdinaryWorkers = instanceData?.subordinate_workers || [];

    return subOrdinaryWorkers.map((worker) => {
      const gpuData = Object.values(snapshot.gpus).filter(
        (gpu) => gpu.worker_name === worker.worker_name
      );

      return {
        ...worker,
        isMain: false,
        children: gpuData
      };
    });
  }, [snapshot, mainWorker]);

  const GPUColumns = [
    {
      title: 'GPU Name',
      dataIndex: 'name',
      key: 'name',
      span: 6,
      colStyle: { paddingLeft: 16 },
      render: (value: string, record: any) => (
        <AutoTooltip ghost>{value}</AutoTooltip>
      )
    },
    {
      title: 'Index',
      dataIndex: 'index',
      key: 'index',
      span: 4,
      colStyle: { paddingLeft: 48 }
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      span: 6,
      colStyle: { paddingLeft: 110 }
    },
    {
      title: 'VRAM',
      dataIndex: 'memory_total',
      key: 'memory_total',
      label: 'VRAM',
      span: 4,
      render: (value: number, record: any) => convertFileSize(value)
    },
    {
      title: 'Cores',
      dataIndex: 'core_total',
      key: 'core_total',
      label: 'Cores',
      span: 4,
      colStyle: { paddingLeft: 36 }
    }
  ];

  const columns = [
    {
      title: 'Worker Name',
      dataIndex: 'name',
      key: 'name',
      span: 6,
      render: (value: string, record: any) => {
        return (
          <>
            <AutoTooltip ghost>{value}</AutoTooltip>
            {record.isMain && (
              <Tag color="geekblue" style={{ marginLeft: 8 }}>
                Main
              </Tag>
            )}
          </>
        );
      }
    },
    {
      title: 'System',
      dataIndex: 'os',
      key: 'system',
      span: 5,
      render: (os: { name: string; version: string }, record: any) => {
        return (
          <AutoTooltip
            ghost
          >{`${record.os?.name || ''} (${record.os?.version || ''})`}</AutoTooltip>
        );
      }
    },
    {
      title: 'Runtime Version',
      dataIndex: 'runtime_version',
      key: 'runtime_version',
      span: 3,
      render: (val: any, record: any) => {
        return <AutoTooltip ghost>{record.runtime_version || ''}</AutoTooltip>;
      }
    },
    {
      title: 'Driver Version',
      dataIndex: 'driver_version',
      key: 'driver_version',
      span: 3,
      render: (val: any, record: any) => {
        return <AutoTooltip ghost>{record.driver_version || ''}</AutoTooltip>;
      }
    },
    {
      title: 'CPU Count',
      dataIndex: 'cpu_total',
      key: 'cpu_total',
      span: 3
    },
    {
      title: 'Memory',
      dataIndex: 'memory_total',
      key: 'memory_total',
      span: 4,
      render: (value: number) => convertFileSize(value)
    }
  ];

  const dataList = useMemo(() => {
    return [mainWorker, ...subWorkers];
  }, [mainWorker, subWorkers]);

  const handleToggleExpandAll = useMemoizedFn((expanded: boolean) => {
    const keys = dataList?.map((item) => item.id);
    handleExpandAll(expanded, keys);
  });

  const loadChildren = useMemoizedFn(async (record: any) => {
    return record.children || [];
  });

  const renderChildren = useMemoizedFn((list: any[]) => {
    return (
      <div style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}>
        <Row style={{ width: '100%' }} align="middle">
          {GPUColumns.map((col) => (
            <Col key={col.key} span={col.span} style={{ ...col.colStyle }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 4,
                  flexDirection: 'column'
                }}
              >
                <span
                  style={{
                    color: 'var(--ant-color-text-tertiary)',
                    fontSize: 12
                  }}
                >
                  {col.title}
                </span>
              </span>
            </Col>
          ))}
        </Row>
        <RowChildren>
          {list.map((gpu) => (
            <Row key={gpu.id} style={{ width: '100%' }} align="middle">
              {GPUColumns.map((col) => (
                <Col key={col.key} span={col.span} style={{ ...col.colStyle }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 4,
                      flexDirection: 'column'
                    }}
                  >
                    {col.render
                      ? col.render((gpu as any)[col.dataIndex], gpu)
                      : (gpu as any)[col.dataIndex]}
                  </span>
                </Col>
              ))}
            </Row>
          ))}
        </RowChildren>
      </div>
    );
  });

  return (
    <Container>
      {/* <WorkerData
        workerData={mainWorker.workerData}
        gpuData={mainWorker.children}
        title={
          <div className="flex-center gap-8">
            <Tag color="geekblue">Main</Tag>
            <span>{mainWorker?.workerData?.name}</span>
          </div>
        }
      ></WorkerData> */}
      <SealTable
        rowKey="id"
        loadChildren={loadChildren}
        expandedRowKeys={expandedRowKeys}
        onExpand={handleExpandChange}
        onExpandAll={handleToggleExpandAll}
        renderChildren={renderChildren}
        showSorterTooltip={false}
        dataSource={dataList}
        loading={false}
        loadend={true}
        columns={columns}
        childParentKey="id"
        expandable={true}
      ></SealTable>
    </Container>
  );
};

export default Environment;
