import _ from 'lodash';
import React, { useEffect } from 'react';
import Wrapper from '../label-selector/wrapper';
import ListItem from './list-item';

interface ListInputProps {
  required?: boolean;
  dataList: string[];
  label?: React.ReactNode;
  description?: React.ReactNode;
  btnText?: string;
  options?: Global.HintOptions[];
  placeholder?: string;
  labelExtra?: React.ReactNode;
  trim?: boolean;
  styles?: {
    wrapper?: React.CSSProperties;
    item?: React.CSSProperties;
  };
  onChange: (data: string[]) => void;
  onBlur?: (e: any, index: number) => void;
  onDelete?: (index: number) => void;
  renderItem?: (
    data: any,
    props: {
      onChange: (value: string) => void;
      onBlur?: (e: any) => void;
    }
  ) => React.ReactNode;
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
    trim = true,
    styles,
    required,
    renderItem
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

  useEffect(() => {
    if (required && list.length === 0) {
      handleOnAdd();
    }
  }, [required]);

  return (
    <Wrapper
      styles={styles}
      label={label}
      required={required}
      description={description}
      labelExtra={labelExtra}
      onAdd={handleOnAdd}
      btnText={btnText}
    >
      <>
        {_.map(list, (item: any, index: number) => {
          return (
            <ListItem
              required={required && list.length === 1}
              placeholder={props.placeholder}
              options={options}
              data={item}
              key={item.uid}
              value={item.value}
              onBlur={(e) => onBlur?.(e, index)}
              onRemove={() => handleOnRemove(index)}
              onChange={(val) => handleOnChange(val, index)}
              trim={trim}
              renderItem={renderItem}
            />
          );
        })}
      </>
    </Wrapper>
  );
};

export default ListInput;
