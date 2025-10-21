import { useIntl } from '@umijs/max';
import _ from 'lodash';
import React, { useEffect } from 'react';
import AutoCompleteItem from './autocomplete-item';
import LabelItem from './label-item';
import Wrapper from './wrapper';
interface LabelSelectorProps {
  labels: Record<string, any>;
  label?: string;
  btnText?: string;
  isAutoComplete?: boolean;
  labelList: Array<{ key: string; value: string }>;
  onLabelListChange: (list: { key: string; value: string }[]) => void;
  onChange?: (labels: Record<string, any>) => void;
  onPaste?: (e: any, index: number) => void;
  onBlur?: (e: any, type: string, index: number) => void;
  onDelete?: (index: number) => void;
  description?: React.ReactNode;
  disabled?: boolean;
}

const Inner: React.FC<LabelSelectorProps> = ({
  labels,
  labelList,
  onChange,
  onLabelListChange,
  onPaste,
  onBlur,
  onDelete,
  disabled,
  label,
  btnText,
  description,
  isAutoComplete
}) => {
  const intl = useIntl();

  useEffect(() => {
    console.log('labels changed in Inner', labels);
  }, [labels]);

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
    <Wrapper
      label={label}
      description={description}
      onAdd={handleAddLabel}
      disabled={disabled}
      btnText={btnText}
    >
      <>
        {isAutoComplete
          ? labelList?.map((item: any, index: number) => {
              return (
                <AutoCompleteItem
                  disabled={disabled}
                  key={index}
                  label={item}
                  seperator=":"
                  labels={labels}
                  labelList={labelList}
                  onDelete={() => handleOnDelete(index)}
                  onChange={(obj) => handleOnChange(index, obj)}
                  onPaste={(e) => onPaste?.(e, index)}
                  onBlur={(e: any, type: string) => onBlur?.(e, type, index)}
                />
              );
            })
          : labelList?.map((item: any, index: number) => {
              return (
                <LabelItem
                  disabled={disabled}
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
      </>
    </Wrapper>
  );
};

export default Inner;
