import { GPUStackVersionAtom } from '@/atoms/user';
import { getAtomStorage } from '@/atoms/utils';
import VersionInfo from '@/components/version-info';
import externalLinks from '@/config/external-links';
import { useIntl } from '@umijs/max';
import { Button, Modal, Space } from 'antd';
import './index.less';

const Footer: React.FC = () => {
  const intl = useIntl();

  const showVersion = () => {
    Modal.info({
      icon: null,
      centered: false,
      width: 500,
      content: <VersionInfo intl={intl} />
    });
  };

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
            <Space size={8} style={{ marginLeft: 18 }}>
              <Button
                type="link"
                size="small"
                href={externalLinks.documentation}
                target="_blank"
              >
                {intl.formatMessage({ id: 'common.button.help' })}
              </Button>
              <Button type="link" size="small" onClick={showVersion}>
                {getAtomStorage(GPUStackVersionAtom)?.version}
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
