import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, message, Tooltip } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
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
   * fallback：execCommand（old Safari /  NON-HTTPS）
   */
  const legacyCopy = (value: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const success = legacyCopy(text);
        if (!success) throw new Error('legacy copy failed');
      }

      setCopied(true);
    } catch {
      message.error(intl.formatMessage({ id: 'common.copy.fail' }) as string);
    }
  }, [text, intl]);

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
