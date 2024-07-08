import { useIntl } from '@umijs/max';
import { Space } from 'antd';
import './index.less';

const Footer: React.FC = () => {
  const intl = useIntl();
  return (
    <div className="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <div className="footer-content-left-text">
            <Space size={4}>
              <span>&copy;</span>
              <span> {new Date().getFullYear()}</span>
              <span> {intl.formatMessage({ id: 'settings.company' })}</span>
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
