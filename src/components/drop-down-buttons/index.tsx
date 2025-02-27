import { MoreOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Dropdown, Tooltip, type MenuProps } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import './index.less';

type Trigger = 'click' | 'hover';
interface DropdownButtonsProps {
  items: MenuProps['items'];
  size?: 'small' | 'middle' | 'large';
  trigger?: Trigger[];
  onSelect: (val: any, item?: any) => void;
}

const DropdownButtons: React.FC<DropdownButtonsProps> = ({
  items,
  size = 'middle',
  trigger = ['hover'],
  onSelect
}) => {
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
        <Tooltip title={intl.formatMessage({ id: _.head(items)?.label })}>
          <Button
            className={classNames('dropdown-button', size)}
            {..._.head(items)}
            icon={_.get(items, '0.icon')}
            size={size}
            {..._.get(items, '0.props')}
            onClick={handleButtonClick}
          ></Button>
        </Tooltip>
      ) : (
        <Dropdown.Button
          trigger={trigger}
          dropdownRender={(menus: any) => {
            return (
              <div
                className="flex flex-column "
                style={{
                  backgroundColor: 'var(--color-white-1)',
                  padding: 5,
                  alignItems: 'flex-start',
                  borderRadius: 'var(--border-radius-base)',
                  boxShadow: 'var(--ant-box-shadow-secondary)'
                }}
              >
                {_.map(_.tail(items), (item: any) => {
                  return (
                    <Button
                      {...item.props}
                      type="text"
                      size="middle"
                      icon={item.icon}
                      key={item.key}
                      onClick={() => handleMenuClick(item)}
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                    >
                      {intl.formatMessage({ id: item.label })}
                    </Button>
                  );
                })}
              </div>
            );
          }}
          buttonsRender={([leftButton, rightButton]) => [
            <Tooltip
              title={intl.formatMessage({ id: _.head(items)?.label })}
              key="leftButton"
            >
              <Button
                className={classNames('dropdown-button', size)}
                onClick={handleButtonClick}
                size={size}
                icon={_.head(items)?.icon}
              ></Button>
            </Tooltip>,
            <Button
              icon={<MoreOutlined />}
              size={size}
              key="menu"
              className={classNames('dropdown-button', size)}
            ></Button>
          ]}
        ></Dropdown.Button>
      )}
    </>
  );
};

export default DropdownButtons;
