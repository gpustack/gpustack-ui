import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip, message } from 'antd';
import ClipboardJS from 'clipboard';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type CopyButtonProps = {
  children?: React.ReactNode;
  text: string;
  disabled?: boolean;
  fontSize?: string;
  type?: 'text' | 'primary' | 'dashed' | 'link' | 'default';
  size?: 'small' | 'middle' | 'large';
  shape?: 'circle' | 'round' | 'default';
  tips?: string;
  placement?:
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight';
  btnStyle?: React.CSSProperties;
  style?: React.CSSProperties;
};

const CopyButton: React.FC<CopyButtonProps> = ({
  children,
  tips,
  text,
  disabled,
  type = 'text',
  shape = 'default',
  fontSize = '14px',
  style,
  btnStyle,
  placement,
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
        message.error(intl.formatMessage({ id: 'common.copy.fail' }) as string);
        e.clearSelection();
      });
    }
  };

  const tipTitle = useMemo(() => {
    if (copied) {
      return intl.formatMessage({ id: 'common.button.copied' });
    }
    return tips ?? intl.formatMessage({ id: 'common.button.copy' });
  }, [copied, intl, tips]);

  useEffect(() => {
    initClipboard();
    return () => {
      clipboardRef.current?.destroy();
    };
  }, [buttonRef]);

  return (
    <Tooltip title={tipTitle} placement={placement}>
      <Button
        className="copy-button"
        ref={buttonRef}
        type={type}
        shape={shape}
        size={size}
        disabled={!!disabled}
        data-clipboard-text={text}
        style={{ ...btnStyle }}
        icon={
          copied ? (
            <CheckCircleFilled
              style={{ color: 'var(--ant-color-success)', fontSize: fontSize }}
            />
          ) : (
            <CopyOutlined style={{ fontSize: fontSize, ...style }} />
          )
        }
      >
        {children}
      </Button>
    </Tooltip>
  );
};

export default CopyButton;
