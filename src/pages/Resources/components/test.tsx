import SealTable from '@/components/seal-table';
import SealColumn from '@/components/seal-table/components/seal-column';
import useTableRowSelection from '@/hooks/use-table-row-selection';

const Table = () => {
  const dataSource = [{ name: 'test' }, { name: 'test2' }];
  const rowSelection = useTableRowSelection();
  return (
    <SealTable
      dataSource={dataSource}
      rowKey="name"
      loading={false}
      rowSelection={rowSelection}
      expandable={true}
    >
      <SealColumn title="Name" dataIndex="name" key="name" span={12} />
      <SealColumn title="Status" dataIndex="status" key="status" span={12} />
    </SealTable>
  );
};

export default Table;
