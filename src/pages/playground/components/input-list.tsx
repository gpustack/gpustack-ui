import RowTextarea from '@/components/seal-form/row-textarea';
import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import '../style/input-list.less';

interface InputListProps {
  ref?: any;
  extra?: (data: any) => React.ReactNode;
  textList: {
    text: string;
    uid: number | string;
    name: string;
  }[];
  onChange?: (
    textList: { text: string; uid: number | string; name: string }[]
  ) => void;
}

const InputList: React.FC<InputListProps> = forwardRef(
  ({ textList, onChange, extra }, ref) => {
    const intl = useIntl();
    const messageId = useRef(0);

    const setMessageId = () => {
      messageId.current = messageId.current + 1;
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
      handleTextChange
    }));

    return (
      <div className="input-list">
        {textList.map((text, index) => {
          return (
            <div key={text.uid} className="input-item">
              <div className="input-wrap">
                <RowTextarea
                  label={`${index + 1}.`}
                  value={text.text}
                  placeholder="Input your text"
                  onChange={(e) => handleTextChange(e.target.value, text)}
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

export default React.memo(InputList);
