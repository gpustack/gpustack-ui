import { WarningOutlined } from '@ant-design/icons';
import { Alert, Popover } from 'antd';
import React from 'react';

interface EnvsOverridePopoverProps {
  open: boolean;
  dataList: any[];
  onToggle: (open: boolean) => void;
}

const EnvsOverridePopover: React.FC<EnvsOverridePopoverProps> = (props) => {
  const { open, onToggle } = props;
  return (
    <Popover
      content="override envs"
      onOpenChange={onToggle}
      trigger={'click'}
      styles={{
        container: {
          width: '100%'
        }
      }}
    >
      <Alert
        onClick={() => onToggle(!open)}
        style={{ marginBlock: 16, cursor: 'pointer' }}
        icon={<WarningOutlined />}
        type="warning"
        showIcon
        title={'override envs'}
      ></Alert>
    </Popover>
  );
};

export default EnvsOverridePopover;
