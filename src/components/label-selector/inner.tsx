import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import React, { useRef } from 'react';
import LabelItem from './label-item';
import Wrapper from './wrapper';
interface LabelSelectorProps {
  labels: Record<string, any>;
  label?: string;
  btnText?: string;
  labelList: Array<{ key: string; value: string }>;
  onLabelListChange: (list: { key: string; value: string }[]) => void;
  onChange?: (labels: Record<string, any>) => void;
  onPaste?: (e: any, index: number) => void;
  onBlur?: (e: any, type: string, index: number) => void;
  onDelete?: (index: number) => void;
  description?: React.ReactNode;
}

const Inner: React.FC<LabelSelectorProps> = ({
  labels,
  labelList,
  onChange,
  onLabelListChange,
  onPaste,
  onBlur,
  onDelete,
  label,
  btnText,
  description
}) => {
  const intl = useIntl();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const updateLabels = (list: { key: string; value: string }[]) => {
    const newLabels = _.reduce(
      list,
      (result: any, item: any) => {
        if (item.key) {
          result[item.key] = item.value;
        }
        return result;
      },
      {}
    );
    onChange?.(newLabels);
  };
  const handleOnChange = (index: number, label: any) => {
    const list = _.cloneDeep(labelList);
    list[index] = label;
    onLabelListChange(list);
    updateLabels(list);
  };

  const handleAddLabel = () => {
    const newLabelList = [
      ...labelList,
      {
        key: '',
        value: ''
      }
    ];
    onLabelListChange(newLabelList);
    updateLabels(newLabelList);
  };

  const handleOnDelete = (index: number) => {
    const list = _.cloneDeep(labelList);
    list.splice(index, 1);
    onLabelListChange(list);
    updateLabels(list);
    onDelete?.(index);
  };

  return (
    <Wrapper label={label} description={description}>
      <>
        {labelList?.map((item: any, index: number) => {
          return (
            <LabelItem
              key={index}
              label={item}
              seperator=":"
              labelList={labelList}
              onDelete={() => handleOnDelete(index)}
              onChange={(obj) => handleOnChange(index, obj)}
              onPaste={(e) => onPaste?.(e, index)}
              onBlur={(e: any, type: string) => onBlur?.(e, type, index)}
            />
          );
        })}
        <div className="flex justify-center">
          <Button
            ref={buttonRef}
            type="text"
            block
            style={{
              marginTop: 16,
              backgroundColor: 'var(--ant-color-fill-secondary)'
            }}
            onClick={handleAddLabel}
          >
            <PlusOutlined className="font-size-14" />{' '}
            {intl.formatMessage({
              id: btnText || 'common.button.addSelector'
            })}
          </Button>
        </div>
      </>
    </Wrapper>
  );
};

export default React.memo(Inner);
