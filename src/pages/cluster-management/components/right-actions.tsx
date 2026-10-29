import { getGPUStackPlugin } from '@/plugins';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';
import type { ClusterListItem } from '../config/types';

export interface RightActionsProps {
  clusters: Pick<ClusterListItem, 'id' | 'is_default'>[];
  handleDeleteByBatch: () => void;
  handleClickPrimary?: () => void;
  MonitorButton?: React.ReactNode;
  rowSelection: {
    selectedRowKeys: React.Key[];
  };
}

const RightActions: React.FC<RightActionsProps> = ({
  clusters,
  handleDeleteByBatch,
  handleClickPrimary,
  rowSelection,
  MonitorButton
}) => {
  const intl = useIntl();
  const ListActions = getGPUStackPlugin()?.clusterDetail?.ListActions;
  const BeforeAddActions = getGPUStackPlugin()?.clusterDetail?.BeforeAddActions;

  return (
    <Space size={16}>
      {ListActions ? <ListActions clusters={clusters} /> : null}
      {MonitorButton}
      {BeforeAddActions ? <BeforeAddActions clusters={clusters} /> : null}
      <Button
        icon={<PlusOutlined />}
        type="primary"
        onClick={handleClickPrimary}
      >
        {intl.formatMessage({ id: 'clusters.button.add' })}
      </Button>
      <Button
        icon={<DeleteOutlined />}
        danger
        onClick={handleDeleteByBatch}
        disabled={!rowSelection?.selectedRowKeys?.length}
      >
        <span>
          {intl.formatMessage({ id: 'common.button.delete' })}
          {rowSelection?.selectedRowKeys?.length > 0 && (
            <span>({rowSelection?.selectedRowKeys?.length})</span>
          )}
        </span>
      </Button>
    </Space>
  );
};

export default RightActions;
