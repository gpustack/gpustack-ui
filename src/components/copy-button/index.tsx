import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, message, Tooltip } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AutoTooltip from '../auto-tooltip';

type CopyButtonProps = {
  children?: React.ReactNode;
  text: string;
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
  type = 'text',
  shape = 'default',
  fontSize = '14px',
  style,
  btnStyle,
  placement,
  size = 'small'
}) => {
  const intl = useIntl();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number>();

  const resetCopied = () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  /**
   * Modern clipboard API (works in secure contexts: HTTPS or localhost)
   */
  const asyncCopy = async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Fallback: execCommand with copy event listener
   * More reliable than textarea selection method
   */
  const execCopy = (value: string): boolean => {
    let copySuccess = false;

    const onCopy = (event: ClipboardEvent) => {
      event.stopPropagation();
      event.preventDefault();
      event.clipboardData?.clearData();
      event.clipboardData?.setData('text/plain', value);
      copySuccess = true;
    };

    try {
      document.addEventListener('copy', onCopy, { capture: true });
      document.execCommand('copy');
      return copySuccess;
    } catch (error) {
      return false;
    } finally {
      document.removeEventListener('copy', onCopy, { capture: true });
    }
  };

  const handleCopy = async () => {
    try {
      // Try modern clipboard API first
      if (await asyncCopy(text)) {
        setCopied(true);
        return;
      }

      // Fallback to execCommand method
      if (execCopy(text)) {
        setCopied(true);
        return;
      }

      // Both methods failed
      throw new Error('Copy failed');
    } catch (error) {
      message.error(intl.formatMessage({ id: 'common.copy.fail' }) as string);
    }
  };

  const tipTitle = useMemo(() => {
    if (copied) {
      return intl.formatMessage({ id: 'common.button.copied' });
    }
    return tips ?? intl.formatMessage({ id: 'common.button.copy' });
  }, [copied, tips, intl]);

  useEffect(() => {
    resetCopied();
  }, [copied]);

  return (
    <div className="flex-center gap-4" style={{ minWidth: 16 }}>
      {children && (
        <AutoTooltip minWidth={20} ghost>
          {children}
        </AutoTooltip>
      )}
      <Tooltip title={tipTitle} placement={placement}>
        <span>
          <Button
            className="copy-button"
            type={type}
            shape={shape}
            size={size}
            onClick={handleCopy}
            style={{ ...btnStyle }}
            icon={
              copied ? (
                <CheckCircleFilled
                  style={{
                    color: 'var(--ant-color-success)',
                    fontSize
                  }}
                />
              ) : (
                <CopyOutlined style={{ fontSize, ...style }} />
              )
            }
          ></Button>
        </span>
      </Tooltip>
    </div>
  );
};

export default CopyButton;
