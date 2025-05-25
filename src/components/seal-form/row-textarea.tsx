import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import './styles/row-textarea.less';

interface SystemMessageProps {
  style?: React.CSSProperties;
  value: string;
  placeholder?: string;
  label?: React.ReactNode;
  height?: number;
  onChange: (e: any) => void;
  onPaste?: (e: any) => void;
  onSelect?: (data: {
    start: number;
    end: number;
    beforeText: string;
    afterText: string;
  }) => void;
}

const RowTextarea: React.FC<SystemMessageProps> = (props) => {
  const {
    value,
    onChange,
    onSelect,
    style,
    label,
    placeholder,
    height = 46
  } = props;
  const intl = useIntl();
  const rowTextAreaRef = React.useRef<any>(null);
  const [autoSize, setAutoSize] = useState<{
    minRows: number;
    maxRows: number;
    focus: boolean;
  }>({ minRows: 1, maxRows: 1, focus: false });

  const handleFocus = () => {
    setAutoSize({
      minRows: 3,
      maxRows: 3,
      focus: true
    });
    setTimeout(() => {
      rowTextAreaRef.current?.focus?.({
        cursor: 'end'
      });
    }, 50);
  };

  const handleBlur = (e: any) => {
    setAutoSize({
      minRows: 2,
      maxRows: 2,
      focus: false
    });
  };

  const handleOnChange = (e: any) => {
    onChange?.(e);
  };

  const handleClear = () => {
    onChange?.({ target: { value: '' } });
  };
  const handleOnPaste = (e: any) => {
    props.onPaste?.(e);
  };

  const handleOnSelect = (e: any) => {
    e.stopPropagation();
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;

    const beforeText = value.substring(0, start);
    const afterText = value.substring(end, value.length);
    onSelect?.({
      start,
      end,
      beforeText,
      afterText
    });
  };

  return (
    <div
      className={classNames('row-textarea', {
        focus: autoSize.focus
      })}
      style={{ ...style }}
    >
      {
        <div
          style={{ display: autoSize.focus ? 'block' : 'none' }}
          className="textarea-wrapper"
        >
          {label && <span className="textarea-label">{label}</span>}
          <Input.TextArea
            className="custome-scrollbar"
            ref={rowTextAreaRef}
            placeholder={placeholder}
            style={{
              borderRadius: '0',
              border: 'none'
            }}
            value={value}
            autoSize={{
              minRows: autoSize.minRows,
              maxRows: autoSize.maxRows
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            allowClear={false}
            onChange={handleOnChange}
            onSelect={handleOnSelect}
            onPaste={handleOnPaste}
          ></Input.TextArea>
        </div>
      }
      {!autoSize.focus && (
        <div className="content-wrap" onClick={handleFocus}>
          <div className="content" style={{ height: height }}>
            {label && <span className="title">{label}</span>}
            {value || (
              <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                {placeholder}
              </span>
            )}
          </div>
          {value && (
            <Tooltip title={intl.formatMessage({ id: 'common.button.clear' })}>
              <Button
                className="clear-btn"
                type="text"
                icon={<CloseOutlined />}
                size="small"
                onClick={handleClear}
              ></Button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};

export default RowTextarea;
