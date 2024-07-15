import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Tooltip, type MenuProps } from 'antd';
import _ from 'lodash';

interface DropdownButtonsProps {
  items: MenuProps['items'];
  size?: 'small' | 'middle' | 'large';
  onSelect: (val: any, item?: any) => void;
}

const DropdownButtons: React.FC<DropdownButtonsProps> = ({
  items,
  size = 'small',
  onSelect
}) => {
  const handleMenuClick = (item: any) => {
    console.log('menu click', item.key);
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
        <Tooltip title={_.head(items)?.label}>
          <Button
            {..._.head(items)}
            icon={_.get(items, '0.icon')}
            size={size}
            onClick={handleButtonClick}
          ></Button>
        </Tooltip>
      ) : (
        <Dropdown.Button
          menu={{
            items: _.tail(items),
            onClick: handleMenuClick
          }}
          buttonsRender={([leftButton, rightButton]) => [
            <Tooltip title={_.head(items)?.label} key="leftButton">
              <Button
                onClick={handleButtonClick}
                size={size}
                icon={_.head(items)?.icon}
              ></Button>
            </Tooltip>,
            <Button icon={<MoreOutlined />} size={size} key="menu"></Button>
          ]}
        ></Dropdown.Button>
      )}
    </>
  );
};

export default DropdownButtons;
