import useCopyToClipboard from '@/hooks/use-copy-to-clipboard';
import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { Button } from 'antd';

type CopyButtonProps = {
  text: string;
  disabled?: boolean;
  fontSize?: string;
  type?: 'text' | 'primary' | 'dashed' | 'link' | 'default';
  size?: 'small' | 'middle' | 'large';
  shape?: 'circle' | 'round' | 'default';
  style?: React.CSSProperties;
};

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  disabled,
  type = 'text',
  shape = 'circle',
  fontSize = '14px',
  style,
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
      shape={shape}
      size={size}
      onClick={handleCopy}
      disabled={!!disabled}
      icon={
        copied ? (
          <CheckCircleFilled
            style={{ color: 'var(--ant-color-success)', fontSize: fontSize }}
          />
        ) : (
          <CopyOutlined style={{ fontSize: fontSize, ...style }} />
        )
      }
    ></Button>
  );
};

export default CopyButton;
