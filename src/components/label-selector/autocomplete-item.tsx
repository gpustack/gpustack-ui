import AutoComplete from '@/components/seal-form/auto-complete';
import { MinusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useLabelSelectorContext } from './context';
import './styles/label-item.less';
interface LabelItemProps {
  label: {
    key: string;
    value: string;
  };
  labels?: Record<string, any>;
  labelKey?: string;
  labelValue?: string;
  keyAddon?: React.ReactNode;
  valueAddon?: React.ReactNode;
  seperator?: string;
  labelList: { key: string; value: string }[];
  disabled?: boolean;
  onDelete?: () => void;
  onChange?: (params: { key: string; value: string }) => void;
  onPaste?: (e: any) => void;
  onBlur?: (e: any, type: string) => void;
}
const LabelItem: React.FC<LabelItemProps> = ({
  labels,
  label,
  labelList,
  seperator,
  keyAddon,
  valueAddon,
  disabled,
  onChange,
  onDelete,
  onBlur
}) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const { options } = useLabelSelectorContext();

  const keyOptions = useMemo(() => {
    return options?.filter(
      (item) => !_.has(labels, item.value) || item.value === label.key
    );
  }, [labels, options]);

  const valueOptions = useMemo(() => {
    return options?.find((item) => item.value === label.key)?.children || [];
  }, [label.key, options]);

  const handleOnValueChange = (value: string) => {
    onChange?.({
      key: label.key,
      value: value
    });
  };

  const handleOnKeyChange = (key: any) => {
    onChange?.({
      key,
      value: label.value
    });
  };

  const handleKeyOnBlur = (e: any, type: string) => {
    const val = e.target.value;
    // has duplicate key
    const duplicates = _.filter(
      labelList,
      (item: Global.BaseListItem<string>) => val && val === item.key
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
    onBlur?.(e, type);
  };

  return (
    <div className="label-item">
      <div className="label-key">
        {keyAddon ?? (
          <Tooltip
            open={open}
            title={intl.formatMessage({ id: 'resources.table.key.tips' })}
          >
            <AutoComplete
              options={keyOptions}
              disabled={disabled}
              checkStatus="success"
              label={intl.formatMessage({ id: 'common.input.key' })}
              value={label.key}
              onChange={handleOnKeyChange}
              onBlur={(e: any) => handleKeyOnBlur(e, 'key')}
            ></AutoComplete>
          </Tooltip>
        )}
      </div>
      {seperator && <span className="seprator">{seperator}</span>}
      <div className="label-value">
        {valueAddon ?? (
          <AutoComplete
            options={valueOptions}
            disabled={disabled}
            checkStatus={label.value ? 'success' : ''}
            label={intl.formatMessage({ id: 'common.input.value' })}
            value={label.value}
            onChange={handleOnValueChange}
            onBlur={(e: any) => onBlur?.(e, 'value')}
          ></AutoComplete>
        )}
      </div>
      {!disabled && (
        <Button
          size="small"
          className="btn"
          type="default"
          shape="circle"
          onClick={onDelete}
        >
          <MinusOutlined />
        </Button>
      )}
    </div>
  );
};

export default LabelItem;
