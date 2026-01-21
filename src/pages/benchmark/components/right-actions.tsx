import {
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';

export interface RightActionsProps {
  handleDeleteByBatch: () => void;
  handleClickPrimary?: () => void;
  handleSettingFields?: () => void;
  buttonText?: string;
  rowSelection: {
    selectedRowKeys: React.Key[];
  };
}

const RightActions: React.FC<RightActionsProps> = ({
  handleDeleteByBatch,
  handleClickPrimary,
  handleSettingFields,
  buttonText,
  rowSelection
}) => {
  const intl = useIntl();

  return (
    <Space size={16}>
      <Button onClick={handleSettingFields} icon={<SettingOutlined />}></Button>
      <Button
        icon={<PlusOutlined></PlusOutlined>}
        type="primary"
        onClick={handleClickPrimary}
      >
        {buttonText}
      </Button>
      <Button
        icon={<DeleteOutlined />}
        danger
        onClick={handleDeleteByBatch}
        disabled={!rowSelection?.selectedRowKeys?.length}
      >
        <span>
          {intl?.formatMessage?.({ id: 'common.button.delete' })}
          {rowSelection?.selectedRowKeys?.length > 0 && (
            <span>({rowSelection?.selectedRowKeys?.length})</span>
          )}
        </span>
      </Button>
    </Space>
  );
};

export default RightActions;
