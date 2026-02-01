import DropdownButtons from '@/components/drop-down-buttons';
import {
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { Button, Space } from 'antd';
import React from 'react';

export interface RightActionsProps {
  handleDeleteByBatch: () => void;
  handleClickPrimary?: () => void;
  handleExport?: () => void;
  settingButton?: React.ReactNode;
  buttonText?: string;
  rowSelection: {
    selectedRowKeys: React.Key[];
  };
}

const RightActions: React.FC<RightActionsProps> = ({
  handleDeleteByBatch,
  handleClickPrimary,
  handleExport,
  settingButton,
  buttonText,
  rowSelection
}) => {
  const ButtonList = [
    {
      label: 'common.button.export',
      key: 'export',
      icon: <DownloadOutlined />
    },
    {
      label: 'common.button.delete',
      key: 'delete',
      props: {
        danger: true
      },
      icon: <DeleteOutlined />
    }
  ];

  const handleActionSelect = (val: string) => {
    if (val === 'delete') {
      handleDeleteByBatch();
    } else if (val === 'export') {
      handleExport?.();
    }
  };

  return (
    <Space size={16}>
      {settingButton}
      <Button
        icon={<PlusOutlined></PlusOutlined>}
        type="primary"
        onClick={handleClickPrimary}
      >
        {buttonText}
      </Button>
      <DropdownButtons
        items={ButtonList}
        extra={
          rowSelection.selectedRowKeys.length > 0 && (
            <span>({rowSelection.selectedRowKeys.length})</span>
          )
        }
        size="large"
        showText={true}
        disabled={!rowSelection.selectedRowKeys.length}
        onSelect={handleActionSelect}
      />
    </Space>
  );
};

export default RightActions;
