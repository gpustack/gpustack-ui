import { useIntl } from '@umijs/max';
import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import Inner from './inner';

interface LabelSelectorProps {
  labels: Record<string, any>;
  label?: string;
  btnText?: string;
  description?: React.ReactNode;
  onChange?: (labels: Record<string, any>) => void;
  onBlur?: (e: any, type: string, index: number) => void;
  onDelete?: (index: number) => void;
}

const LabelSelector: React.FC<LabelSelectorProps> = ({
  labels,
  onChange,
  onBlur,
  onDelete,
  label,
  btnText,
  description
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

  const handleLabelListChange = useCallback(
    (list: { key: string; value: string }[]) => {
      setLabelList(list);
    },
    [setLabelList]
  );
  const handleLabelsChange = (data: Record<string, any>) => {
    console.log('handleLabelsChange', data);
    setLabelsData(data);
    onChange?.(data);
  };

  const handleOnPaste = (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    const clipboardText = e.clipboardData.getData('text');
    if (!clipboardText || clipboardText.indexOf('=') === -1) return;
    e.preventDefault();

    const lines = clipboardText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line.includes('='));

    const parsedData = lines.map((line) => {
      const [key, value] = line.split('=').map((part) => part.trim());
      return { key, value };
    });
    console.log(lines, parsedData);

    setLabelList((prevPairs) => {
      const newPairs = [...prevPairs];
      newPairs.splice(index, 1, ...parsedData);
      return newPairs;
    });
  };

  return (
    <Inner
      label={label}
      btnText={btnText}
      description={
        description ?? intl.formatMessage({ id: 'models.form.keyvalue.paste' })
      }
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

export default React.memo(LabelSelector);
