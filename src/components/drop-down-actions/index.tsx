import * as icons from '@ant-design/icons';
import { Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd/es/menu';
import react from 'react';

type DropdownProps = {
  trigger?: Array<'click' | 'hover' | 'contextMenu'>;
  items: MenuProps['items'];
  onClick: (e: any) => void;
};
const renderIcon = (icon: string) => {
  if (!icon) {
    return null;
  }
  // @ts-ignore
  const Icon = icons[icon] as React.FC;
  return react.createElement(Icon);
};
const DropDownActions: React.FC<DropdownProps> = (props) => {
  const { trigger, items, onClick } = props;
  return (
    <Space>
      <Dropdown menu={{ items, onClick }} trigger={trigger}>
        <Button
          onClick={(e) => e.preventDefault()}
          style={{ fontSize: '14px' }}
          type="text"
          icon={renderIcon('MoreOutlined')}
        ></Button>
      </Dropdown>
    </Space>
  );
};

export default DropDownActions;
