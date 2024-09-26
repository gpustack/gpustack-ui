import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import React from 'react';
import Wrapper from '../label-selector/wrapper';
import ListItem from './list-item';

interface ListInputProps {
  dataList: string[];
  label: string;
  description?: string;
  btnText?: string;
  options?: Global.HintOptions[];
  onChange: (data: string[]) => void;
}

const ListInput: React.FC<ListInputProps> = (props) => {
  const intl = useIntl();
  const { dataList, label, description, onChange, btnText, options } = props;
  const [list, setList] = React.useState<{ value: string; uid: number }[]>([]);
  const countRef = React.useRef(0);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const updateCountRef = () => {
    countRef.current = countRef.current + 1;
  };

  const handleOnRemove = (index: number) => {
    const values = _.cloneDeep(list);
    values.splice(index, 1);
    const valueList = _.map(values, 'value').filter((val: string) => !!val);
    setList(values);
    onChange(valueList);
  };

  const handleOnChange = (value: string, index: number) => {
    const values = _.cloneDeep(list);
    values[index].value = value;
    const valueList = _.map(values, 'value').filter((val: string) => !!val);
    setList(values);
    onChange(valueList);
  };

  const handleOnAdd = () => {
    updateCountRef();
    const values = _.cloneDeep(list);
    values.push({
      value: '',
      uid: countRef.current
    });
    setList(values);
    setTimeout(() => {
      buttonRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    }, 100);
  };

  React.useEffect(() => {
    const valueList = _.map(list, 'value').filter((val: string) => !!val);
    if (!_.isEqual(valueList, dataList)) {
      const values = _.map(dataList, (value: string) => {
        updateCountRef();
        return {
          value,
          uid: countRef.current
        };
      });
      setList(values);
    }
  }, [dataList]);

  return (
    <Wrapper label={label} description={description}>
      <>
        {_.map(list, (item: any, index: number) => {
          return (
            <ListItem
              options={options}
              key={item.uid}
              value={item.value}
              onRemove={() => handleOnRemove(index)}
              onChange={(val) => handleOnChange(val, index)}
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
            onClick={handleOnAdd}
          >
            <PlusOutlined className="font-size-14" />{' '}
            {intl.formatMessage({
              id: btnText
            })}
          </Button>
        </div>
      </>
    </Wrapper>
  );
};

export default React.memo(ListInput);
