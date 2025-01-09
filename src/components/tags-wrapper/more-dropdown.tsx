import { MoreOutlined } from '@ant-design/icons';
import { Dropdown, Tag } from 'antd';
import React from 'react';

interface MoreDropdownProps {
  items: any[];
}

const MoreDropdown: React.FC<MoreDropdownProps> = (props) => {
  const { items } = props;
  return (
    <>
      {items && items.length > 0 ? (
        <Dropdown
          trigger={['hover']}
          menu={{
            items: items
          }}
        >
          <Tag className="more">
            <MoreOutlined rotate={90} />
          </Tag>
        </Dropdown>
      ) : null}
    </>
  );
};

export default React.memo(MoreDropdown);
