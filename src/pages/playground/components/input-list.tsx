import RowTextarea from '@/components/seal-form/row-textarea';
import { useIntl } from '@umijs/max';
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
    dataUrl?: string;
  }[];
  onChange?: (
    textList: {
      text: string;
      uid: number | string;
      name: string;
      dataUrl?: string;
    }[]
  ) => void;
  onPaste?: (e: any, index: number) => void;
  onDeleteImage?: (dataItem: {
    text: string;
    uid: number | string;
    name: string;
  }) => void;
  onUploadImage?: (
    list: { uid: number | string; dataUrl: string }[],
    index: number
  ) => void;
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
    {
      textList,
      showLabel = true,
      height,
      onUploadImage,
      onDeleteImage,
      onChange,
      extra,
      onPaste,
      onSelect
    },
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

    const handleDelete = (dataItem: { text: string; uid: number | string }) => {
      const dataList = [...textList];
      const index = dataList.findIndex((item) => item.uid === dataItem.uid);
      dataList.splice(index, 1);
      onChange?.(dataList);
    };

    const handleTextChange = (
      value: string,
      dataItem: { text: string; uid: number | string }
    ) => {
      const dataList = [...textList];
      const index = dataList.findIndex((item) => item.uid === dataItem.uid);
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
        {textList.map((item, index) => {
          return (
            <div key={item.uid} className="input-item" data-uid={item.uid}>
              <div className="input-wrap">
                <RowTextarea
                  height={height}
                  label={showLabel ? `${index + 1}` : null}
                  data={item}
                  placeholder={intl.formatMessage({
                    id: 'playground.embedding.inputyourtext'
                  })}
                  onChange={(e) => handleTextChange(e.target.value, item)}
                  onPaste={(e) => onPaste?.(e, index)}
                  onSelect={(data) => onSelect?.({ ...data, index })}
                  onUploadImage={(list) => onUploadImage?.(list, index)}
                  onDeleteImage={() => onDeleteImage?.(item)}
                  onDelete={() => handleDelete(item)}
                ></RowTextarea>
              </div>
              {extra?.(item)}
            </div>
          );
        })}
      </div>
    );
  }
);

export default InputList;
