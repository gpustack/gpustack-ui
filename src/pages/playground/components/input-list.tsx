import RowTextarea from '@/components/seal-form/row-textarea';
import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import '../style/input-list.less';

interface InputListProps {
  ref?: any;
  height?: number;
  extra?: (data: any) => React.ReactNode;
  showLabel?: boolean;
  textList: {
    text: string;
    uid: number | string;
    name: string;
  }[];
  onChange?: (
    textList: { text: string; uid: number | string; name: string }[]
  ) => void;
  onPaste?: (e: any, index: number) => void;
  onSelect?: (data: {
    start: number;
    end: number;
    beforeText: string;
    afterText: string;
    index: number;
  }) => void;
}

const InputList: React.FC<InputListProps> = forwardRef(
  (
    { textList, showLabel = true, height, onChange, extra, onPaste, onSelect },
    ref
  ) => {
    const intl = useIntl();
    const messageId = useRef(0);
    const containerRef = useRef<any>(null);

    const setMessageId = () => {
      messageId.current = messageId.current + 1;
      return messageId.current;
    };

    const handleAdd = () => {
      setMessageId();
      const dataList = [...textList];
      dataList.push({
        text: '',
        uid: messageId.current,
        name: `Text ${dataList.length + 1}`
      });
      onChange?.(dataList);
    };

    const handleDelete = (text: { text: string; uid: number | string }) => {
      const dataList = [...textList];
      const index = dataList.findIndex((item) => item.uid === text.uid);
      dataList.splice(index, 1);
      onChange?.(dataList);
    };

    const handleTextChange = (
      value: string,
      text: { text: string; uid: number | string }
    ) => {
      const dataList = [...textList];
      const index = dataList.findIndex((item) => item.uid === text.uid);
      dataList[index].text = value;
      onChange?.(dataList);
    };

    useImperativeHandle(ref, () => ({
      handleAdd,
      handleDelete,
      handleTextChange,
      setMessageId
    }));

    return (
      <div className="input-list" ref={containerRef}>
        {textList.map((text, index) => {
          return (
            <div key={text.uid} className="input-item" data-uid={text.uid}>
              <div className="input-wrap">
                <RowTextarea
                  height={height}
                  label={showLabel ? `${index + 1}` : null}
                  value={text.text}
                  placeholder={intl.formatMessage({
                    id: 'playground.embedding.inputyourtext'
                  })}
                  onChange={(e) => handleTextChange(e.target.value, text)}
                  onPaste={(e) => onPaste?.(e, index)}
                  onSelect={(data) => onSelect?.({ ...data, index })}
                ></RowTextarea>
              </div>
              <span className="btn-group">
                <Tooltip
                  title={intl.formatMessage({ id: 'common.button.delete' })}
                >
                  <Button
                    danger
                    size="small"
                    type="text"
                    icon={<DeleteOutlined></DeleteOutlined>}
                    onClick={() => handleDelete(text)}
                  ></Button>
                </Tooltip>
              </span>
              {extra?.(text)}
            </div>
          );
        })}
      </div>
    );
  }
);

export default InputList;
