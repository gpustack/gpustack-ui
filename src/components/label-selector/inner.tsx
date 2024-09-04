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
  labelList: Array<{ key: string; value: string }>;
  onLabelListChange: (list: { key: string; value: string }[]) => void;
  onChange?: (labels: Record<string, any>) => void;
  description?: React.ReactNode;
}

const Inner: React.FC<LabelSelectorProps> = ({
  labels,
  labelList,
  onChange,
  onLabelListChange,
  label,
  description
}) => {
  const intl = useIntl();
  const buttonRef = useRef<HTMLButtonElement>(null);

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
  const handleOnChange = (index: string, label: any) => {
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

    setTimeout(() => {
      // button scroll to view
      buttonRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    }, 100);
  };

  const handleOnDelete = (index: string) => {
    const list = _.cloneDeep(labelList);
    list.splice(parseInt(index), 1);
    onLabelListChange(list);
    updateLabels(list);
  };

  return (
    <Wrapper label={label} description={description}>
      <>
        {_.map(labelList, (item: any, index: string) => {
          return (
            <LabelItem
              key={index}
              label={item}
              seperator=":"
              labelList={labelList}
              onDelete={() => handleOnDelete(index)}
              onChange={(obj) => handleOnChange(index, obj)}
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
              id: 'common.button.addLabel'
            })}
          </Button>
        </div>
      </>
    </Wrapper>
  );
};

export default React.memo(Inner);
