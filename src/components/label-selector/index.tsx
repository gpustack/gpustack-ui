import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import Inner from './inner';

interface LabelSelectorProps {
  labels: Record<string, any>;
  label?: string;
  btnText?: string;
  description?: React.ReactNode;
  onChange?: (labels: Record<string, any>) => void;
}

const LabelSelector: React.FC<LabelSelectorProps> = ({
  labels,
  onChange,
  label,
  btnText,
  description
}) => {
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
    console.log('labelsData=========', labelsData);
  }, [labels]);

  const handleLabelListChange = useCallback(
    (list: { key: string; value: string }[]) => {
      setLabelList(list);
    },
    [setLabelList]
  );
  const handleLabelsChange = (data: Record<string, any>) => {
    setLabelsData(data);
    onChange?.(data);
  };

  return (
    <Inner
      label={label}
      btnText={btnText}
      description={description}
      labels={labelsData}
      labelList={labelList}
      onChange={handleLabelsChange}
      onLabelListChange={handleLabelListChange}
    />
  );
};

export default React.memo(LabelSelector);
