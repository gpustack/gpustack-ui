import useCopyToClipboard from '@/hooks/use-copy-to-clipboard';
import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { Button } from 'antd';

type CopyButtonProps = {
  text: string;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
};

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  disabled,
  size = 'middle'
}) => {
  const { copied, copyToClipboard } = useCopyToClipboard();

  const handleCopy = async (e: any) => {
    e.stopPropagation();
    await copyToClipboard(text);
  };
  return (
    <Button
      type="text"
      shape="circle"
      size={size}
      onClick={handleCopy}
      disabled={!!disabled}
    >
      {copied ? (
        <CheckCircleFilled
          style={{ color: 'var(--ant-color-primary)', fontSize: '14px' }}
        />
      ) : (
        <CopyOutlined
          style={{ color: 'var(--ant-color-primary)', fontSize: '14px' }}
        />
      )}
    </Button>
  );
};

export default CopyButton;
