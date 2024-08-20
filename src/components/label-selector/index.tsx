import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import LabelItem from './label-item';
import Wrapper from './wrapper';

interface LabelSelectorProps {
  labels: Record<string, any>;
  label?: string;
  onChange?: (labels: Record<string, any>) => void;
}

const LabelSelector: React.FC<LabelSelectorProps> = ({
  labels,
  onChange,
  label
}) => {
  const [labelList, setLabelList] = React.useState<any[]>([]);

  useEffect(() => {
    const list = _.map(_.keys(labels), (key: string) => {
      return {
        key,
        value: labels[key]
      };
    });
    setLabelList(list);
  }, [labels]);

  const handleOnChange = (index: string, label: any) => {
    const list = _.cloneDeep(labelList);
    list[index] = label;
    const newLabels = _.reduce(
      list,
      (result: any, item: any) => {
        result[item.key] = item.value;
        return result;
      },
      {}
    );
    onChange?.(newLabels);
  };

  const handleAddLabel = () => {
    setLabelList([
      ...labelList,
      {
        key: '',
        value: ''
      }
    ]);
  };

  const handleOnDelete = (index: string) => {
    const list = _.cloneDeep(labelList);
    list.splice(parseInt(index), 1);
    setLabelList(list);
    const newLabels = _.reduce(
      list,
      (result: any, item: any) => {
        result[item.key] = item.value;
        return result;
      },
      {}
    );
    onChange?.(newLabels);
  };

  return (
    <Wrapper label={label}>
      {_.map(labelList, (item: any, index: string) => {
        return (
          <LabelItem
            key={index}
            label={{
              key: item.key,
              value: item.value
            }}
            seperator=":"
            onDelete={() => handleOnDelete(index)}
            onChange={(obj) => handleOnChange(index, obj)}
          />
        );
      })}
      <div>
        <Button
          size="small"
          type="default"
          shape="circle"
          style={{ marginTop: 16 }}
        >
          <PlusOutlined className="font-size-14" onClick={handleAddLabel} />
        </Button>
      </div>
    </Wrapper>
  );
};

export default React.memo(LabelSelector);
