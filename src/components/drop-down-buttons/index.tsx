import { MoreOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Dropdown, Tooltip, type MenuProps } from 'antd';
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

const DropdownButtons: React.FC<DropdownButtonsProps> = ({
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
        <Dropdown.Button
          disabled={disabled}
          trigger={trigger}
          type="primary"
          dropdownRender={(menus: any) => {
            return (
              <DropdownWrapper>
                {_.map(_.tail(items), (item: any) => {
                  return (
                    <Button
                      {...item.props}
                      type="text"
                      size={size}
                      icon={item.icon}
                      key={item.key}
                      disabled={item.disabled}
                      onClick={() => handleMenuClick(item)}
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        paddingInline: 10
                      }}
                    >
                      {intl.formatMessage({ id: item.label })}
                    </Button>
                  );
                })}
              </DropdownWrapper>
            );
          }}
          buttonsRender={([leftButton, rightButton]) => [
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
            </>,
            <Button
              icon={<MoreOutlined />}
              size={size}
              key="menu"
              variant={variant}
              color="default"
              className={classNames('dropdown-button', size)}
            ></Button>
          ]}
        ></Dropdown.Button>
      )}
    </>
  );
};

export default DropdownButtons;
