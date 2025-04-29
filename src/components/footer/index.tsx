import { GPUStackVersionAtom } from '@/atoms/user';
import { getAtomStorage } from '@/atoms/utils';
import VersionInfo, { modalConfig } from '@/components/version-info';
import externalLinks from '@/constants/external-links';
import { useIntl } from '@umijs/max';
import { Button, Modal, Space } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  footer: css`
    bottom: 0;
    width: 100%;
    background-color: transparent;
    padding: 20px 0;
    text-align: center;
    font-size: var(--font-size-middle);
    color: ${token.colorTextTertiary};
  `,
  'footer-content-left-text': {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

const Footer: React.FC = () => {
  const intl = useIntl();
  const [modal, contextHolder] = Modal.useModal();
  const { styles } = useStyles();

  const showVersion = () => {
    modal.info({
      ...modalConfig,
      width: 460,
      content: <VersionInfo intl={intl} />
    });
  };

  return (
    <>
      {contextHolder}
      <div className={styles.footer}>
        <div className="footer-content">
          <div className="footer-content-left">
            <div className={styles['footer-content-left-text']}>
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
    </>
  );
};

export default Footer;
