import { DeleteOutlined, PlusOutlined, TagsOutlined } from '@ant-design/icons';
import { DropdownButtons } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';

export interface WorkerRightActionsProps {
  handleDeleteByBatch: () => void;
  handleUpdateLabelsByBatch?: () => void;
  handleClickPrimary?: () => void;
  MonitorButton?: React.ReactNode;
  rowSelection: {
    selectedRowKeys: React.Key[];
  };
}

const WorkerRightActions: React.FC<WorkerRightActionsProps> = ({
  handleDeleteByBatch,
  handleUpdateLabelsByBatch,
  handleClickPrimary,
  rowSelection,
  MonitorButton
}) => {
  const intl = useIntl();
  const count = rowSelection?.selectedRowKeys?.length || 0;
  const disabled = !count;
  const items = [
    ...(handleUpdateLabelsByBatch
      ? [
          {
            key: 'labels',
            label: 'resources.worker.setLabels',
            icon: <TagsOutlined />,
            disabled
          }
        ]
      : []),
    {
      key: 'delete',
      label: 'common.button.delete',
      icon: <DeleteOutlined />,
      disabled,
      props: { danger: true }
    }
  ];
  const batchActions = (
    <DropdownButtons
      items={items}
      extra={count > 0 && <span>({count})</span>}
      size="large"
      showText={true}
      disabled={disabled}
      onSelect={(key) => {
        if (key === 'labels') {
          handleUpdateLabelsByBatch?.();
        } else if (key === 'delete') {
          handleDeleteByBatch();
        }
      }}
    />
  );

  return (
    <Space size={16}>
      {MonitorButton}
      <Button
        icon={<PlusOutlined />}
        type="primary"
        onClick={handleClickPrimary}
      >
        {intl.formatMessage({ id: 'resources.button.create' })}
      </Button>
      {batchActions}
    </Space>
  );
};

export default WorkerRightActions;
