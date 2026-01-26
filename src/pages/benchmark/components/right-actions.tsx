import DropdownButtons from '@/components/drop-down-buttons';
import {
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';

export interface RightActionsProps {
  handleDeleteByBatch: () => void;
  handleClickPrimary?: () => void;
  handleSettingFields?: () => void;
  settingButton?: React.ReactNode;
  buttonText?: string;
  rowSelection: {
    selectedRowKeys: React.Key[];
  };
}

const RightActions: React.FC<RightActionsProps> = ({
  handleDeleteByBatch,
  handleClickPrimary,
  handleSettingFields,
  settingButton,
  buttonText,
  rowSelection
}) => {
  const intl = useIntl();
  const ButtonList = [
    {
      label: 'common.button.export',
      key: 'export',
      icon: <DownloadOutlined />
    },
    {
      label: 'common.button.delete',
      key: 'start',
      props: {
        danger: true
      },
      icon: <DeleteOutlined />
    }
  ];

  const handleActionSelect = (val: string) => {};

  return (
    <Space size={16}>
      {/* <Tooltip title="Column Settings">
        <Button
          onClick={handleSettingFields}
          icon={<SettingOutlined />}
        ></Button>
      </Tooltip> */}
      {settingButton}
      <Button
        icon={<PlusOutlined></PlusOutlined>}
        type="primary"
        onClick={handleClickPrimary}
      >
        {buttonText}
      </Button>
      {/* <Button
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
      </Button> */}
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
