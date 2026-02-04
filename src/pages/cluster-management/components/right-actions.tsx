import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';

export interface RightActionsProps {
  handleDeleteByBatch: () => void;
  handleClickPrimary?: () => void;
  MonitorButton?: React.ReactNode;
  rowSelection: {
    selectedRowKeys: React.Key[];
  };
}

const RightActions: React.FC<RightActionsProps> = ({
  handleDeleteByBatch,
  handleClickPrimary,
  rowSelection,
  MonitorButton
}) => {
  const intl = useIntl();

  return (
    <Space size={16}>
      {MonitorButton}
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
