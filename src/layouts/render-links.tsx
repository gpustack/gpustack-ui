import { MailOutlined } from '@ant-design/icons';
import { Menu, type MenuProps } from 'antd';
import React from 'react';

type MenuItem = Required<MenuProps>['items'][number];
const items: MenuItem[] = [
  {
    key: 'sub1',
    icon: <MailOutlined />,
    label: 'Navigation One',
    children: [
      {
        key: '1-1',
        label: 'Item 1'
      },
      {
        key: '1-2',
        label: 'Item 2'
      }
    ]
  }
];

const RenderLinks: React.FC = () => {
  return <Menu mode="vertical" items={items} />;
};

export default React.memo(RenderLinks);
