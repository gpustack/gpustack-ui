import DeleteModal from '@/components/delete-modal';
import CellContent from '@/components/seal-table/components/cell-content';
import RowChildren from '@/components/seal-table/components/row-children';
import RowContext from '@/components/seal-table/row-context';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Col, message, Row } from 'antd';
import _ from 'lodash';
import React, { useRef, useState } from 'react';
import { deleteWorkerPool, updateWorkerPool } from '../apis';
import { ProviderType } from '../config';
import { NodePoolFormData, NodePoolListItem } from '../config/types';
import usePoolsColumns from '../hooks/use-pools-columns';
import AddPool from './add-pool';
interface PoolRowsProps {
  dataList: NodePoolListItem[];
  provider: ProviderType;
  clusterId: number | string;
}

const PoolRows: React.FC<PoolRowsProps> = ({
  dataList,
  provider,
  clusterId
}) => {
  const intl = useIntl();
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

  const handleOnCell = async (row: NodePoolListItem, dataIndex: string) => {
    console.log('handleOncell===', row, dataIndex);
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
          <div
            key={data.id}
            style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}
          >
            <RowContext.Provider value={{ row: data, onCell: handleOnCell }}>
              <RowChildren>
                <Row style={{ width: '100%' }} align="middle">
                  {columns.map((col: Record<string, any>) => {
                    return (
                      <Col
                        key={col.dataIndex || col.key}
                        span={col.span}
                        style={{
                          paddingInline: 0,
                          ...(col.style || {})
                        }}
                      >
                        <CellContent {..._.omit(col, ['key'])}></CellContent>
                      </Col>
                    );
                  })}
                </Row>
              </RowChildren>
            </RowContext.Provider>
          </div>
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
