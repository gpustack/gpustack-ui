import { DeleteOutlined, PlusOutlined, TagsOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';

export interface WorkerRightActionsProps {
  handleDeleteByBatch: () => void;
  /**
   * Bulk labelling, and the reason this component gained a second batch prop.
   *
   * Topology is declared once and then *maintained* by labelling workers, and
   * a fleet is labelled forty machines at a time — opening a modal per host is
   * not a workflow. The delete-only shape here was the accidental limit: the
   * selection already existed and only one action could reach it.
   *
   * Optional so the prop stays additive: a caller that does not pass it gets
   * exactly the bar it had.
   */
  handleUpdateLabelsByBatch?: () => void;
  /** The batch "set location" control, already wired to the selection. */
  SetLocationAction?: React.ReactNode;
  handleClickPrimary?: () => void;
  MonitorButton?: React.ReactNode;
  rowSelection: {
    selectedRowKeys: React.Key[];
  };
}

const WorkerRightActions: React.FC<WorkerRightActionsProps> = ({
  handleDeleteByBatch,
  handleUpdateLabelsByBatch,
  SetLocationAction,
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
        {intl.formatMessage({ id: 'resources.button.create' })}
      </Button>
      {!!handleUpdateLabelsByBatch && (
        <Button
          icon={<TagsOutlined />}
          onClick={handleUpdateLabelsByBatch}
          disabled={!rowSelection?.selectedRowKeys?.length}
        >
          <span>
            {intl.formatMessage({ id: 'resources.worker.setLabels' })}
            {rowSelection?.selectedRowKeys?.length > 0 && (
              <span>({rowSelection?.selectedRowKeys?.length})</span>
            )}
          </span>
        </Button>
      )}
      {SetLocationAction}
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

export default WorkerRightActions;
