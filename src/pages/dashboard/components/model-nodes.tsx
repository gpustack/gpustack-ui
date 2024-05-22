import PageTools from '@/components/page-tools';
import StatusTag from '@/components/status-tag';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import { NodeItem } from '@/pages/nodes/config/types';
import { Progress, Select, Space, Table } from 'antd';
import _ from 'lodash';
import { memo, useMemo, useState } from 'react';
const { Column } = Table;

const models = [
  { value: 'llama3:latest', label: 'llama3:latest' },
  { value: 'wangfuyun/AnimateLCM', label: 'wangfuyun/AnimateLCM' },
  { value: 'Revanthraja/Text_to_Vision', label: 'Revanthraja/Text_to_Vision' }
];
const dataSource: NodeItem[] = [
  {
    id: 1,
    name: '192.168.1.2',
    address: '192.168.1.2',
    hostname: 'node-1',
    labels: {},
    resources: {
      capacity: {
        cpu: 4,
        gpu: 2,
        memory: '64 GiB',
        gram: '24 Gib'
      },
      allocable: {
        cpu: 2.5,
        gpu: 1.6,
        memory: '64',
        gram: '24 Gib'
      }
    },
    state: 'ALIVE'
  },
  {
    id: 2,
    name: '192.168.1.2',
    address: '192.168.1.5',
    hostname: 'node-2',
    labels: {},
    resources: {
      capacity: {
        cpu: 4,
        gpu: 2,
        memory: '64 GiB',
        gram: '24 Gib'
      },
      allocable: {
        cpu: 2,
        gpu: 1.5,
        memory: '32 GiB',
        gram: '12 Gib'
      }
    },
    state: 'ALIVE'
  },
  {
    id: 3,
    name: '192.168.1.3',
    address: '192.168.1.3',
    hostname: 'node-3',
    labels: {},
    resources: {
      capacity: {
        cpu: 4,
        gpu: 2,
        memory: '64 GiB',
        gram: '24 Gib'
      },
      allocable: {
        cpu: 1,
        gpu: 0.5,
        memory: '28 GiB',
        gram: '6 Gib'
      }
    },
    state: 'ALIVE'
  }
];

const ModelNodes: React.FC = () => {
  const rowSelection = useTableRowSelection();

  const [selectName, setSelectName] = useState<string>('llama3:latest');
  const [loading, setLoading] = useState(false);
  const [queryParams, setQueryParams] = useState({
    current: 1,
    pageSize: 10,
    name: ''
  });
  const handleShowSizeChange = (current: number, size: number) => {
    console.log(current, size);
  };

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    console.log(page, pageSize);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    // console.log('handleTableChange=======', pagination, filters, sorter);
  };

  const fetchData = async () => {
    console.log('fetchData');
  };
  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (value: string) => {
    setSelectName(value);
    setQueryParams({
      ...queryParams,
      name: value
    });
  };

  const RenderProgress = memo(
    (props: { record: NodeItem; dataIndex: string }) => {
      const { record, dataIndex } = props;
      const value1 = useMemo(() => {
        let value = _.get(record, ['resources', 'allocable', dataIndex]);
        if (['gram', 'memory'].includes(dataIndex)) {
          value = _.toNumber(value.replace(/GiB|Gib/, ''));
        }
        return value;
      }, [record, dataIndex]);

      const value2 = useMemo(() => {
        let value = _.get(record, ['resources', 'capacity', dataIndex]);
        if (['gram', 'memory'].includes(dataIndex)) {
          value = _.toNumber(value.replace(/GiB|Gib/, ''));
        }
        return value;
      }, [record, dataIndex]);

      if (!value1 || !value2) {
        return <Progress percent={0} strokeColor="var(--ant-color-primary)" />;
      }
      const percent = _.round(value1 / value2, 2) * 100;
      const strokeColor = useMemo(() => {
        if (percent <= 50) {
          return 'var(--ant-color-primary)';
        }
        if (percent <= 80) {
          return 'var(--ant-color-warning)';
        }
        return 'var(--ant-color-error)';
      }, [percent]);
      return (
        <Progress
          steps={5}
          format={() => {
            return (
              <span style={{ color: 'var(--ant-color-text)' }}>{percent}%</span>
            );
          }}
          percent={percent}
          strokeColor={strokeColor}
        />
      );
    }
  );

  return (
    <>
      <div>
        <PageTools
          marginBottom={10}
          marginTop={0}
          left={<span>Nodes by model</span>}
          right={
            <Space>
              <Select
                size="middle"
                options={models}
                value={selectName}
                style={{ width: 300, height: 34 }}
                onChange={handleNameChange}
              ></Select>
            </Space>
          }
        ></PageTools>
        <Table
          dataSource={dataSource}
          rowKey={(record) => record.id}
          loading={loading}
          onChange={handleTableChange}
          pagination={false}
        >
          <Column title="Host Name" dataIndex="hostname" key="hostname" />
          <Column
            title="State"
            dataIndex="state"
            key="state"
            render={(text, record) => {
              return (
                <StatusTag
                  statusValue={{
                    status: 'success',
                    text: 'ALIVE'
                  }}
                ></StatusTag>
              );
            }}
          />
          <Column title="IP / PID" dataIndex="address" key="address" />
          <Column
            title="CPU"
            dataIndex="CPU"
            key="CPU"
            render={(text, record: NodeItem) => {
              return (
                <RenderProgress
                  record={record}
                  dataIndex="cpu"
                ></RenderProgress>
              );
            }}
          />
          <Column
            title="Memory"
            dataIndex="memory"
            key="Memory"
            render={(text, record: NodeItem) => {
              return (
                <RenderProgress
                  record={record}
                  dataIndex="memory"
                ></RenderProgress>
              );
            }}
          />
          <Column
            title="GPU"
            dataIndex="GPU"
            key="GPU"
            render={(text, record: NodeItem) => {
              return (
                <RenderProgress
                  record={record}
                  dataIndex="gpu"
                ></RenderProgress>
              );
            }}
          />
          <Column
            title="GRAM"
            dataIndex="GRAM"
            key="GRAM"
            render={(text, record: NodeItem) => {
              return (
                <RenderProgress
                  record={record}
                  dataIndex="gram"
                ></RenderProgress>
              );
            }}
          />
        </Table>
      </div>
    </>
  );
};

export default ModelNodes;
