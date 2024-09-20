import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Divider, Input, Tooltip } from 'antd';
import React, { useState } from 'react';
import '../../style/sys-message.less';

interface SystemMessageProps {
  style?: React.CSSProperties;
  systemMessage: string;
  setSystemMessage: (value: string) => void;
}

const SystemMessage: React.FC<SystemMessageProps> = (props) => {
  const { systemMessage, setSystemMessage, style } = props;
  const intl = useIntl();
  const systemMessageRef = React.useRef<any>(null);
  const [autoSize, setAutoSize] = useState<{
    minRows: number;
    maxRows: number;
    focus: boolean;
  }>({ minRows: 1, maxRows: 1, focus: false });

  const handleFocus = () => {
    setAutoSize({
      minRows: 4,
      maxRows: 4,
      focus: true
    });
    setTimeout(() => {
      systemMessageRef.current?.focus?.({
        cursor: 'end'
      });
    }, 100);
  };

  const handleBlur = () => {
    setAutoSize({
      minRows: 1,
      maxRows: 1,
      focus: false
    });
  };

  const handleClearSystemMessage = () => {
    setSystemMessage('');
  };

  return (
    <div className="sys-message" style={{ ...style }}>
      {
        <div style={{ display: autoSize.focus ? 'block' : 'none' }}>
          <span className="system-label">
            {intl.formatMessage({ id: 'playground.systemMessage' })}
          </span>
          <Input.TextArea
            ref={systemMessageRef}
            variant="filled"
            placeholder={intl.formatMessage({ id: 'playground.system.tips' })}
            style={{
              borderRadius: '0',
              border: 'none'
            }}
            value={systemMessage}
            autoSize={{
              minRows: autoSize.minRows,
              maxRows: autoSize.maxRows
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            allowClear={false}
            onChange={(e) => setSystemMessage(e.target.value)}
          ></Input.TextArea>
          <Divider style={{ margin: '0' }}></Divider>
        </div>
      }
      {!autoSize.focus && (
        <div className="sys-content-wrap" onClick={handleFocus}>
          <div className="sys-content">
            <span className="title">
              {intl.formatMessage({ id: 'playground.systemMessage' })}
            </span>
            {systemMessage || (
              <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                {intl.formatMessage({ id: 'playground.system.tips' })}
              </span>
            )}
          </div>
          {systemMessage && (
            <Tooltip title={intl.formatMessage({ id: 'common.button.clear' })}>
              <Button
                className="clear-btn"
                type="text"
                icon={<CloseOutlined />}
                size="small"
                onClick={handleClearSystemMessage}
              ></Button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SystemMessage);
