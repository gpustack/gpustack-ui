import { CloseOutlined } from '@ant-design/icons';
import { Button, Divider, Input } from 'antd';
import React, { useState } from 'react';
import '../../style/sys-message.less';

interface SystemMessageProps {
  systemMessage: string;
  setSystemMessage: (value: string) => void;
}

const SystemMessage: React.FC<SystemMessageProps> = (props) => {
  const { systemMessage, setSystemMessage } = props;
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
    <div className="sys-message">
      {
        <div style={{ display: autoSize.focus ? 'block' : 'none' }}>
          <Input.TextArea
            ref={systemMessageRef}
            variant="filled"
            placeholder="Type system message here"
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
            {systemMessage || (
              <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                Type system message here
              </span>
            )}
          </div>
          {systemMessage && (
            <Button
              className="clear-btn"
              type="text"
              icon={<CloseOutlined />}
              size="small"
              onClick={handleClearSystemMessage}
            ></Button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SystemMessage);
