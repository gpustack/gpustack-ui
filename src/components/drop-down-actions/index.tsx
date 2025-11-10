import { useIntl } from '@umijs/max';
import { Dropdown, DropDownProps } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';

const DropDownActions: React.FC<DropDownProps> = (props) => {
  const {
    menu,
    trigger = ['hover'],
    placement = 'bottomRight',
    children,
    ...rest
  } = props;
  const intl = useIntl();

  const items = useMemo(() => {
    return menu?.items?.map((item: any) => ({
      ..._.omit(item, 'locale'),
      icon: item.icon
        ? React.cloneElement(item.icon, { style: { fontSize: 14 } })
        : null,
      label: item.locale ? intl.formatMessage({ id: item.label }) : item.label
    }));
  }, [menu?.items, intl]);
  return (
    <Dropdown
      menu={{
        items: items,
        onClick: menu?.onClick
      }}
      trigger={trigger}
      placement={placement}
      {...rest}
    >
      {children}
    </Dropdown>
  );
};

export default DropDownActions;
