import { useIntl } from '@umijs/max';
import { Dropdown, DropDownProps } from 'antd';
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
      ...item,
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
