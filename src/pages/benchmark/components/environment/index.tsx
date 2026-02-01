import AutoTooltip from '@/components/auto-tooltip';
import RowChildren from '@/components/seal-table/components/row-children';
import SealTable from '@/components/seal-table/index';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
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
  const intl = useIntl();
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

  const GPUColumns: {
    title: string;
    dataIndex: string;
    key: string;
    span: number;
    colStyle?: React.CSSProperties;
    render?: (value: any, record: any) => React.ReactNode;
  }[] = [
    {
      title: intl.formatMessage({ id: 'benchmark.env.gpuName' }),
      dataIndex: 'name',
      key: 'name',
      span: 6,
      colStyle: { paddingLeft: 16 },
      render: (value: string, record: any) => (
        <AutoTooltip ghost>{value}</AutoTooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.index' }),
      dataIndex: 'index',
      key: 'index',
      span: 4,
      colStyle: { paddingLeft: 48 }
    },
    {
      title: intl.formatMessage({ id: 'resources.table.vendor' }),
      dataIndex: 'vendor',
      key: 'vendor',
      span: 6,
      colStyle: { paddingLeft: 110 }
    },
    {
      title: intl.formatMessage({ id: 'resources.table.vram' }),
      dataIndex: 'memory_total',
      key: 'memory_total',
      span: 4,
      render: (value: number, record: any) => convertFileSize(value)
    },
    {
      title: intl.formatMessage({ id: 'resources.table.core' }),
      dataIndex: 'core_total',
      key: 'core_total',
      span: 4,
      colStyle: { paddingLeft: 36 }
    }
  ];

  const columns = [
    {
      title: intl.formatMessage({ id: 'benchmark.env.workerName' }),
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
      title: intl.formatMessage({ id: 'benchmark.env.system' }),
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
      title: intl.formatMessage({ id: 'benchmark.env.runtimeVersion' }),
      dataIndex: 'runtime_version',
      key: 'runtime_version',
      span: 3,
      render: (val: any, record: any) => {
        return <AutoTooltip ghost>{record.runtime_version || ''}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.driverVersion' }),
      dataIndex: 'driver_version',
      key: 'driver_version',
      span: 3,
      render: (val: any, record: any) => {
        return <AutoTooltip ghost>{record.driver_version || ''}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.cpuCounts' }),
      dataIndex: 'cpu_total',
      key: 'cpu_total',
      span: 3
    },
    {
      title: intl.formatMessage({ id: 'resources.table.memory' }),
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
                      ? col.render(gpu[col.dataIndex], gpu)
                      : gpu[col.dataIndex]}
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
