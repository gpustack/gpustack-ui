import useWindowResize from '@/hooks/use-window-resize';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { IconTextButton } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Space, Tooltip } from 'antd';
import React from 'react';

export interface WorkerRightActionsProps {
  handleDeleteByBatch: () => void;
  handleClickPrimary?: () => void;
  MonitorButton?: React.ReactNode;
  rowSelection: {
    selectedRowKeys: React.Key[];
  };
}

const WorkerRightActions: React.FC<WorkerRightActionsProps> = ({
  handleDeleteByBatch,
  handleClickPrimary,
  rowSelection,
  MonitorButton
}) => {
  const intl = useIntl();
  const { isIconOnlyToolbar } = useWindowResize();
  const createLabel = intl.formatMessage({ id: 'resources.button.create' });
  const deleteLabel = intl.formatMessage({ id: 'common.button.delete' });
  const deleteCount =
    rowSelection?.selectedRowKeys?.length > 0
      ? ` (${rowSelection.selectedRowKeys.length})`
      : '';

  const deleteButton = (
    <Button
      icon={<DeleteOutlined />}
      danger
      onClick={handleDeleteByBatch}
      disabled={!rowSelection?.selectedRowKeys?.length}
    >
      {!isIconOnlyToolbar && (
        <span>
          {deleteLabel}
          {deleteCount}
        </span>
      )}
    </Button>
  );

  return (
    <div className="compactActions">
      <Space size={16}>
        {MonitorButton}
        <IconTextButton
          icon={<PlusOutlined />}
          type="primary"
          onClick={handleClickPrimary}
          text={createLabel}
        />
        {isIconOnlyToolbar ? (
          <Tooltip title={`${deleteLabel}${deleteCount}`}>
            {deleteButton}
          </Tooltip>
        ) : (
          deleteButton
        )}
      </Space>
    </div>
  );
};

export default WorkerRightActions;
