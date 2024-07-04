import useCopyToClipboard from '@/hooks/use-copy-to-clipboard';
import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { Button } from 'antd';

type CopyButtonProps = {
  text: string;
  disabled?: boolean;
  type?: 'text' | 'primary' | 'dashed' | 'link' | 'default';
  size?: 'small' | 'middle' | 'large';
};

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  disabled,
  type = 'text',
  size = 'middle'
}) => {
  const { copied, copyToClipboard } = useCopyToClipboard();

  const handleCopy = async (e: any) => {
    e.stopPropagation();
    await copyToClipboard(text);
  };
  return (
    <Button
      type={type}
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
