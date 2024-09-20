import SealInput from '@/components/seal-form/seal-input';
import { MinusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useState } from 'react';
import './styles/label-item.less';
interface LabelItemProps {
  label: {
    key: string;
    value: string;
  };
  labelKey?: string;
  labelValue?: string;
  keyAddon?: React.ReactNode;
  valueAddon?: React.ReactNode;
  seperator?: string;
  onDelete?: () => void;
  labelList: { key: string; value: string }[];
  onChange?: (params: { key: string; value: string }) => void;
}
const LabelItem: React.FC<LabelItemProps> = ({
  label,
  labelList,
  seperator,
  keyAddon,
  valueAddon,
  onChange,
  onDelete
}) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);

  const handleOnValueChange = (e: any) => {
    const value = e.target.value;
    onChange?.({
      key: label.key,
      value: value
    });
  };

  const handleOnKeyChange = (e: any) => {
    const key = e.target.value;
    onChange?.({
      key,
      value: label.value
    });
  };

  const handleKeyOnBlur = (e: any) => {
    const val = e.target.value;
    // has duplicate key
    const duplicates = _.filter(
      labelList,
      (item: Global.BaseListItem) => val && val === item.key
    );
    if (duplicates.length > 1) {
      setOpen(true);
      onChange?.({
        key: '',
        value: label.value
      });
      setTimeout(() => {
        setOpen(false);
      }, 1000);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="label-item">
      <div className="label-key">
        {keyAddon ?? (
          <Tooltip
            open={open}
            title={intl.formatMessage({ id: 'resources.table.key.tips' })}
          >
            <SealInput.Input
              label={intl.formatMessage({ id: 'common.input.key' })}
              value={label.key}
              onChange={handleOnKeyChange}
              onBlur={handleKeyOnBlur}
            ></SealInput.Input>
          </Tooltip>
        )}
      </div>
      {seperator && <span className="seprator">{seperator}</span>}
      <div className="label-value">
        {valueAddon ?? (
          <SealInput.Input
            label={intl.formatMessage({ id: 'common.input.value' })}
            value={label.value}
            onChange={handleOnValueChange}
          ></SealInput.Input>
        )}
      </div>
      <Button
        size="small"
        className="btn"
        type="default"
        shape="circle"
        onClick={onDelete}
      >
        <MinusOutlined />
      </Button>
    </div>
  );
};

export default React.memo(LabelItem);
