import PageTools from '@/components/page-tools';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Input, Progress, Space, Table } from 'antd';
const { Column } = Table;

const dataSource = [
  {
    key: '1',
    name: 'llama3:latest',
    createTime: '2021-09-01 12:00:00'
  },
  {
    key: '2',
    name: 'meta-llama/Meta-Llama-3-8B',
    createTime: '2021-09-01 12:00:00'
  },
  {
    key: '3',
    name: 'apple/OpenELM-3B-Instructor',
    createTime: '2021-09-01 12:00:00'
  }
];

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age'
  },
  {
    title: '住址',
    dataIndex: 'address',
    key: 'address'
  }
];

const Dashboard: React.FC = () => {
  const rowSelection = useTableRowSelection();
  return (
    <PageContainer
      ghost
      header={{
        title: 'Dashboard'
      }}
      extra={[]}
    >
      <PageTools
        marginBottom={22}
        left={
          <Space>
            <Input placeholder="按名称查询" style={{ width: 300 }}></Input>
            <Button
              type="text"
              style={{ color: 'var(--ant-color-primary)' }}
              icon={<SyncOutlined></SyncOutlined>}
            ></Button>
          </Space>
        }
        right={
          <div>
            <Button icon={<PlusOutlined></PlusOutlined>} type="primary">
              Import Module
            </Button>
          </div>
        }
      ></PageTools>
      <Table dataSource={dataSource} rowSelection={rowSelection}>
        <Column
          title="Model Name"
          dataIndex="name"
          key="name"
          render={(text, record) => {
            return (
              <>
                <span>{text}</span>
                <Progress percent={30} strokeColor="var(--ant-color-primary)" />
              </>
            );
          }}
        />
        <Column
          title="Create Time"
          dataIndex="createTime"
          key="createTime"
          defaultSortOrder="descend"
          sortOrder="descend"
          sorter={(a, b) => a.createTime - b.createTime}
        />
        <Column
          title="Operation"
          key="operation"
          render={(text, record) => {
            return <Button size="middle">Open in PlayGround</Button>;
          }}
        />
      </Table>
    </PageContainer>
  );
};

export default Dashboard;
