import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import React from 'react';

export interface RightActionsProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
}

const RightActions: React.FC<RightActionsProps> = ({
  handleInputChange,
  handleSearch
}) => {
  const intl = useIntl();

  return (
    <Space>
      <Input
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          ></SearchOutlined>
        }
        placeholder={intl.formatMessage({
          id: 'common.filter.name'
        })}
        style={{ width: 230 }}
        allowClear
        onChange={handleInputChange}
      ></Input>
      {/* <CompareConditions></CompareConditions> */}
      <Button
        type="text"
        style={{ color: 'var(--ant-color-text-tertiary)' }}
        onClick={handleSearch}
        icon={<SyncOutlined></SyncOutlined>}
      ></Button>
    </Space>
  );
};

export default RightActions;
