import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, message } from 'antd';
import ClipboardJS from 'clipboard';
import { useEffect, useRef, useState } from 'react';

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
  const intl = useIntl();
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef(null);
  const clipboardRef = useRef<any>(null);

  const initClipboard = () => {
    if (buttonRef.current) {
      clipboardRef.current = new ClipboardJS(buttonRef.current);
      clipboardRef.current.on('success', () => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 3000);
      });

      clipboardRef.current.on('error', (e: any) => {
        message.success(
          intl.formatMessage({ id: 'common.copy.fail' }) as string
        );
        e.clearSelection();
      });
    }
  };

  useEffect(() => {
    initClipboard();
    return () => {
      clipboardRef.current?.destroy();
    };
  }, [buttonRef]);

  return (
    <Button
      ref={buttonRef}
      type={type}
      shape={shape}
      size={size}
      disabled={!!disabled}
      data-clipboard-text={text}
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
