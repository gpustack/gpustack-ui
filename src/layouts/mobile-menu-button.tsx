import { MenuOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useMobileMenu } from './mobile-menu-context';

const MobileMenuButton = () => {
  const { toggle } = useMobileMenu();

  return (
    <Button
      type="text"
      className="mobile-menu-button"
      aria-label="menu"
      icon={<MenuOutlined />}
      onClick={toggle}
    />
  );
};

export default MobileMenuButton;
