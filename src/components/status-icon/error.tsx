import { CloseOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style/lib/functions';

const useStyles = createStyles(({ token, css }) => ({
  errorIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: ${token.colorErrorBgActive};
    color: ${token.colorError};
  `
}));

const ErrorIcon: React.FC<{ size?: number }> = ({ size }) => {
  const { styles } = useStyles();
  return (
    <div className={styles.errorIcon}>
      <CloseOutlined style={{ fontSize: size || 30 }} />
    </div>
  );
};

export default ErrorIcon;
