import { useIntl } from '@umijs/max';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Inner from './inner';

interface LabelSelectorProps {
  labels: Record<string, any>;
  label?: string;
  btnText?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  isAutoComplete?: boolean;
  enablePaste?: boolean;
  onChange?: (labels: Record<string, any>) => void;
  onBlur?: (e: any, type: string, index: number) => void;
  onDelete?: (index: number) => void;
}

const LabelSelector: React.FC<LabelSelectorProps> = ({
  labels,
  onChange,
  onBlur,
  onDelete,
  disabled,
  label,
  btnText,
  description,
  isAutoComplete,
  enablePaste = true
}) => {
  const intl = useIntl();
  const [labelsData, setLabelsData] = useState({});
  const [labelList, setLabelList] = useState<{ key: string; value: string }[]>(
    []
  );

  useEffect(() => {
    if (!_.isEqual(labels, labelsData)) {
      setLabelsData(labels || {});
      const list = _.map(_.keys(labels), (key: string) => {
        return {
          key,
          value: labels[key]
        };
      });
      setLabelList(list);
    }
  }, [labels]);

  const handleLabelListChange = (list: { key: string; value: string }[]) => {
    setLabelList(list);
  };

  const handleLabelsChange = (data: Record<string, any>) => {
    console.log('handleLabelsChange', data);
    setLabelsData(data);
    onChange?.(data);
  };

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

  const handleOnPaste = (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    if (!enablePaste) return;
    const clipboardText = e.clipboardData.getData('text');
    if (!clipboardText || clipboardText.indexOf('=') === -1) return;
    e.preventDefault();

    const lines = _.split(clipboardText, /\r?\n/)
      .map((line: string) => line.trim())
      .filter((line: string) => line && line.includes('='));

    const parsedData = lines.map((line: string) => {
      const [key, value] = line.split(/=(.+)/).map((s) => s.trim());
      return { key, value };
    });

    const newPairs = [...labelList];
    newPairs.splice(index, 1, ...parsedData);

    updateLabels(newPairs);
    setLabelList(newPairs);
  };

  return (
    <Inner
      disabled={disabled}
      label={label}
      btnText={btnText}
      description={
        description ?? intl.formatMessage({ id: 'models.form.keyvalue.paste' })
      }
      isAutoComplete={isAutoComplete}
      labels={labelsData}
      labelList={labelList}
      onChange={handleLabelsChange}
      onLabelListChange={handleLabelListChange}
      onPaste={handleOnPaste}
      onBlur={onBlur}
      onDelete={onDelete}
    />
  );
};

export default LabelSelector;
