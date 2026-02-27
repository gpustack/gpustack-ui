import SmallCloseButton from '@/pages/_components/small-close-button';
import ThumbImg from '@/pages/playground/components/thumb-img';
import useAddImage from '@/pages/playground/hooks/use-add-image';
import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import './styles/row-textarea.less';

interface SystemMessageProps {
  style?: React.CSSProperties;
  data: {
    text: string;
    uid: number | string;
    name: string;
    dataUrl?: string;
  };
  placeholder?: string;
  label?: React.ReactNode;
  height?: number;
  onUploadImage?: (list: { uid: number | string; dataUrl: string }[]) => void;
  onDeleteImage?: () => void;
  onChange: (e: any) => void;
  onPaste?: (e: any) => void;
  onDelete?: () => void;
  onSelect?: (data: {
    start: number;
    end: number;
    beforeText: string;
    afterText: string;
  }) => void;
}

const RowTextarea: React.FC<SystemMessageProps> = (props) => {
  const {
    data,
    onDeleteImage,
    onUploadImage,
    onChange,
    onSelect,
    onDelete,
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

    const beforeText = data.text.substring(0, start);
    const afterText = data.text.substring(end, data.text.length);
    onSelect?.({
      start,
      end,
      beforeText,
      afterText
    });
  };

  const handleUploadImage = (
    list: { uid: number | string; dataUrl: string }[]
  ) => {
    onUploadImage?.(list);
  };

  const { ImageURLInput, UploadImageButton, isFromUrl, dropDownOpen } =
    useAddImage({
      size: 'small',
      inputProps: {
        variant: 'filled'
      },
      handleUpdateImgList: handleUploadImage,
      updateUidCount: () => `img-${Date.now()}`
    });

  const expanded = autoSize.focus || !!data.dataUrl || isFromUrl;
  // const expanded = true;

  console.log('expanded===========', expanded);

  return (
    <div
      className={classNames('row-textarea-wrapper', {
        dropDownOpen: dropDownOpen,
        expanded: expanded
      })}
    >
      <div
        className={classNames('row-textarea', {
          expanded: expanded
        })}
        style={{ ...style }}
      >
        <div
          style={{
            display: expanded ? 'block' : 'none'
          }}
          className="textarea-wrapper"
        >
          {label && <span className="textarea-label">{label}</span>}
          {data.dataUrl && (
            <div style={{ padding: 8 }}>
              <ThumbImg
                editable
                dataList={
                  data.dataUrl ? [{ uid: data.uid, dataUrl: data.dataUrl }] : []
                }
                onDelete={onDeleteImage}
              />
            </div>
          )}

          <Input.TextArea
            className="custome-scrollbar"
            allowClear
            ref={rowTextAreaRef}
            placeholder={placeholder}
            style={{
              borderRadius: '0',
              border: 'none',
              width: '100%',
              boxShadow: 'none'
            }}
            value={data.text}
            autoSize={
              expanded
                ? {
                    minRows: 5,
                    maxRows: 5
                  }
                : { minRows: autoSize.minRows, maxRows: autoSize.maxRows }
            }
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleOnChange}
            onSelect={handleOnSelect}
            onPaste={handleOnPaste}
            onClear={handleClear}
          ></Input.TextArea>
        </div>

        {!expanded && (
          <div
            className={classNames('content-wrap', {
              dropDownOpen: dropDownOpen
            })}
            onClick={handleFocus}
          >
            {
              <div className="content" style={{ height: height }}>
                {label && <span className="title">{label}</span>}
                {data.text || (
                  <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                    {placeholder}
                  </span>
                )}
              </div>
            }
          </div>
        )}
        <div
          className={classNames('actions-wrapper', {
            show: expanded
          })}
        >
          {ImageURLInput}
          <div className={'actions'}>
            {!expanded && data.text && (
              <SmallCloseButton onClick={handleClear}></SmallCloseButton>
            )}
            {UploadImageButton}
            <Tooltip title={intl.formatMessage({ id: 'common.button.delete' })}>
              <Button
                danger
                size="small"
                type="text"
                icon={<DeleteOutlined></DeleteOutlined>}
                onClick={onDelete}
              ></Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RowTextarea;
