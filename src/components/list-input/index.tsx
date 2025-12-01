import _ from 'lodash';
import React from 'react';
import Wrapper from '../label-selector/wrapper';
import ListItem from './list-item';

interface ListInputProps {
  dataList: string[];
  label?: React.ReactNode;
  description?: React.ReactNode;
  btnText?: string;
  options?: Global.HintOptions[];
  placeholder?: string;
  labelExtra?: React.ReactNode;
  trim?: boolean;
  onChange: (data: string[]) => void;
  onBlur?: (e: any, index: number) => void;
  onDelete?: (index: number) => void;
}

const ListInput: React.FC<ListInputProps> = (props) => {
  const {
    dataList,
    label,
    description,
    onChange,
    onBlur,
    onDelete,
    btnText,
    options,
    labelExtra,
    trim = true
  } = props;
  const [list, setList] = React.useState<{ value: string; uid: number }[]>([]);
  const countRef = React.useRef(0);

  const updateCountRef = () => {
    countRef.current = countRef.current + 1;
  };

  const handleOnRemove = (index: number) => {
    const values = _.cloneDeep(list);
    values.splice(index, 1);
    const valueList = _.map(values, 'value').filter((val: string) => !!val);
    setList(values);
    onChange(valueList);
    onDelete?.(index);
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
    <Wrapper
      label={label}
      description={description}
      labelExtra={labelExtra}
      onAdd={handleOnAdd}
      btnText={btnText}
    >
      <>
        {_.map(list, (item: any, index: number) => {
          return (
            <ListItem
              placeholder={props.placeholder}
              options={options}
              key={item.uid}
              value={item.value}
              onBlur={(e) => onBlur?.(e, index)}
              onRemove={() => handleOnRemove(index)}
              onChange={(val) => handleOnChange(val, index)}
              trim={trim}
            />
          );
        })}
      </>
    </Wrapper>
  );
};

export default ListInput;
