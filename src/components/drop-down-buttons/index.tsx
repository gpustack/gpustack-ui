import { MoreOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Dropdown, Space, Tooltip, type MenuProps } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import './index.less';

type Trigger = 'click' | 'hover';
interface DropdownButtonsProps {
  items: MenuProps['items'];
  size?: 'small' | 'middle' | 'large';
  trigger?: Trigger[];
  showText?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outlined';
  color?: string;
  extra?: React.ReactNode;
  onSelect: (val: any, item?: any) => void;
}

const DropdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--ant-color-bg-elevated);
  padding: 5px;
  align-items: flex-start;
  border-radius: var(--border-radius-base);
  box-shadow: var(--ant-box-shadow-secondary);
  min-width: 160px;
`;

const DropdownButtons: React.FC<
  DropdownButtonsProps & { items: MenuProps['items'] }
> = ({
  items,
  size = 'middle',
  trigger = ['hover'],
  showText,
  disabled,
  variant,
  color,
  extra,
  onSelect
}) => {
  const headItem = _.head(items);
  const intl = useIntl();

  const handleMenuClick = (item: any) => {
    const selectItem = _.find(items, { key: item.key });
    onSelect(item.key, selectItem);
  };

  const handleButtonClick = (e: any) => {
    const headItem = _.head(items);
    onSelect(headItem.key, headItem);
  };

  if (!items?.length) {
    return <span></span>;
  }

  return (
    <>
      {items?.length === 1 ? (
        <Tooltip title={intl.formatMessage({ id: headItem?.label })}>
          <Button
            className={classNames('dropdown-button', size)}
            icon={headItem?.icon}
            size={size}
            {...headItem?.props}
            onClick={handleButtonClick}
          ></Button>
        </Tooltip>
      ) : (
        <Space.Compact>
          <>
            {showText ? (
              <Button
                {...headItem?.props}
                disabled={headItem?.disabled || disabled}
                className={classNames('dropdown-button', size)}
                onClick={handleButtonClick}
                size={size}
                icon={headItem?.icon}
                variant={variant}
                color={color}
              >
                {intl.formatMessage({
                  id: headItem?.label
                })}
                {extra}
              </Button>
            ) : (
              <Tooltip
                title={intl.formatMessage({ id: headItem?.label })}
                key="leftButton"
              >
                <Button
                  {...headItem?.props}
                  className={classNames('dropdown-button', size)}
                  onClick={handleButtonClick}
                  size={size}
                  icon={headItem?.icon}
                  disabled={headItem?.disabled}
                ></Button>
              </Tooltip>
            )}
          </>
          <Dropdown
            disabled={disabled}
            trigger={trigger}
            placement="bottomRight"
            styles={{
              root: {
                minWidth: 160
              },
              itemIcon: {
                fontSize: 14
              }
            }}
            menu={{
              onClick: handleMenuClick,
              items: _.tail(items).map((item: any) => ({
                ...item,
                ...item.props,
                label:
                  item.locale || item.locale === undefined
                    ? intl.formatMessage({ id: item.label })
                    : item.label
              }))
            }}
          >
            <Button
              icon={<MoreOutlined />}
              size={size}
              key="menu"
              variant={variant}
              color="default"
              className={classNames('dropdown-button', size)}
            ></Button>
          </Dropdown>
        </Space.Compact>
      )}
    </>
  );
};

export default DropdownButtons;
