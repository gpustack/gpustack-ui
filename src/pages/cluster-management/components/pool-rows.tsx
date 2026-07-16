import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import {
  CellContent,
  type ChildGridOptions,
  DeleteModal,
  ExpandedRowGrid,
  TableRowProvider
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { message } from 'antd';
import _ from 'lodash';
import React, { useRef, useState } from 'react';
import { deleteWorkerPool, updateWorkerPool } from '../apis';
import { ProviderType } from '../config';
import { NodePoolFormData, NodePoolListItem } from '../config/types';
import usePoolsColumns from '../hooks/use-pools-columns';
import AddPool from './add-pool';
interface PoolRowsProps extends Pick<
  ChildGridOptions,
  'gridTemplate' | 'prefixWidth' | 'columns'
> {
  dataList: NodePoolListItem[];
  provider: ProviderType;
  clusterId: number | string;
}

const PoolRows: React.FC<PoolRowsProps> = ({
  dataList,
  provider,
  clusterId,
  gridTemplate,
  prefixWidth = 0,
  columns: parentColumns
}) => {
  const intl = useIntl();

  // The child row shares the parent's column grid; cells flow left-to-right and
  // only declare a span, keyed on the pool column's OWN dataIndex — never on a
  // parent cluster column key. Parent layout: name (1) | provider…state middle
  // region | created_at (1) | operations (1). The three middle pool columns
  // cover that region: `replicas`→state (last, 1 track), `image_name`→
  // models+workers (2 tracks), `instance_type` absorbs the rest (plugins +
  // provider + gpus).
  const columnCount = parentColumns?.length ?? 0;
  const middleSpan = Math.max(columnCount - 3, 1);
  const spanFor = (dataIndex: string): number => {
    switch (dataIndex) {
      case 'instance_type':
        return Math.max(middleSpan - 3, 1);
      case 'image_name':
        return 2;
      case 'replicas':
        return 1;
      default:
        // name / created_at / operations align 1:1 with their parent column.
        return 1;
    }
  };
  const modalRef = useRef<any>(null);
  const [addPoolStatus, setAddPoolStatus] = useState<{
    open: boolean;
    action: PageActionType;
    title: string;
    provider: ProviderType;
    currentData: NodePoolListItem | null;
    clusterId: number | string;
  }>({
    open: false,
    action: PageAction.EDIT,
    title: '',
    provider: provider,
    currentData: null as NodePoolListItem | null,
    clusterId: clusterId
  });

  const handleSubmitWorkerPool = async (formdata: NodePoolFormData) => {
    try {
      await updateWorkerPool({
        data: formdata,
        id: addPoolStatus.currentData!.id
      });
      setAddPoolStatus({
        ...addPoolStatus,
        open: false
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      // handleSearch();
    } catch (error) {
      // error
    }
  };

  const handleOnCell = async (
    row: NodePoolListItem,
    _data: { dataIndex: string; newValue: any; oldValue: any }
  ) => {
    try {
      await updateWorkerPool({
        data: row,
        id: row.id
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      // error
    }
  };
  const handleEdit = (action: string, record: NodePoolListItem) => {
    if (action === 'edit') {
      setAddPoolStatus({
        open: true,
        action: PageAction.EDIT,
        title: intl.formatMessage(
          { id: 'common.button.edit.item' },
          { name: record.name }
        ),
        provider: provider,
        currentData: record,
        clusterId: record.cluster_id
      });
    }
  };

  const handleDelete = (row: { name: string; id: number }, options?: any) => {
    modalRef.current?.show({
      content: 'worker pool',
      operation: 'common.delete.single.confirm',
      name: row.name,
      ...options,
      async onOk() {
        console.log('OK');
        await deleteWorkerPool(row.id);
      }
    });
  };

  const onSelect = useMemoizedFn((key: string, record: NodePoolListItem) => {
    if (key === 'delete') {
      handleDelete({ ...record, name: record.instance_type });
    }
    if (key === 'edit') {
      handleEdit(key, record);
    }
  });

  const columns = usePoolsColumns(onSelect);

  return (
    <>
      {dataList?.map((data: NodePoolListItem) => {
        return (
          <TableRowProvider
            key={data.id}
            value={{ row: data, onCell: handleOnCell }}
          >
            <ExpandedRowGrid
              gridTemplate={gridTemplate}
              prefixWidth={prefixWidth}
            >
              {columns.map((col: Record<string, any>) => (
                <ExpandedRowGrid.Cell
                  key={col.dataIndex || col.key}
                  span={spanFor(col.dataIndex)}
                  style={{
                    color: 'var(--ant-color-text-secondary)'
                  }}
                >
                  <CellContent
                    {..._.omit(col, ['key', 'style', 'span'])}
                  ></CellContent>
                </ExpandedRowGrid.Cell>
              ))}
            </ExpandedRowGrid>
          </TableRowProvider>
        );
      })}
      <AddPool
        provider={addPoolStatus.provider}
        open={addPoolStatus.open}
        action={addPoolStatus.action}
        title={addPoolStatus.title}
        currentData={addPoolStatus.currentData}
        onCancel={() => {
          setAddPoolStatus({
            open: false,
            action: PageAction.CREATE,
            title: '',
            provider: provider,
            currentData: null,
            clusterId: 0
          });
        }}
        onOk={handleSubmitWorkerPool}
      ></AddPool>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default PoolRows;
