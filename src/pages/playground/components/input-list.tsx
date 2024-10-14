import RowTextarea from '@/components/seal-form/row-textarea';
import {
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import React, { useRef } from 'react';
import '../style/input-list.less';

interface InputListProps {
  textList: { text: string; uid: number | string; name: string }[];
  onChange?: (
    textList: { text: string; uid: number | string; name: string }[]
  ) => void;
}

const InputList: React.FC<InputListProps> = ({ textList, onChange }) => {
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

  return (
    <div className="input-list">
      {textList.length === 0 && (
        <Button
          block
          onClick={handleAdd}
          type="text"
          style={{ backgroundColor: 'var(--ant-color-fill-secondary)' }}
        >
          <PlusOutlined />
          Add Text
        </Button>
      )}
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
                  size="small"
                  type="text"
                  icon={<MinusCircleOutlined />}
                  onClick={() => handleDelete(text)}
                ></Button>
              </Tooltip>
              {index === textList.length - 1 && (
                <Tooltip
                  title={intl.formatMessage({ id: 'common.button.add' })}
                >
                  <Button
                    size="small"
                    type="text"
                    icon={<PlusCircleOutlined />}
                    onClick={handleAdd}
                  ></Button>
                </Tooltip>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(InputList);
