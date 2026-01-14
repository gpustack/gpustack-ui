import AutoComplete from '@/components/seal-form/auto-complete';
import _ from 'lodash';
import React from 'react';

interface HintInputProps {
  value: string;
  label?: string;
  onChange: (value: string) => void;
  onBlur?: (e: any) => void;
  placeholder?: string;
  trim?: boolean;
  sourceOptions?: Global.HintOptions[];
}

const matchReg = /[^=]+=[^=]*$/;

const HintInput: React.FC<HintInputProps> = (props) => {
  const { value, label, onChange, onBlur, sourceOptions, trim = true } = props;
  const cursorPosRef = React.useRef(0);
  const contextBeforeCursorRef = React.useRef('');
  const [options, setOptions] = React.useState<
    Array<Global.BaseOption<string>>
  >([]);

  const generateOptions = (context: string) => {
    if (!context) {
      setOptions(sourceOptions || []);
      return;
    }
    const match = context.match(matchReg);
    if (!match) {
      const list = _.filter(sourceOptions, (item: Global.HintOptions) =>
        item.label.includes(context)
      );
      setOptions(list);
      return;
    }
    const [key, value] = _.split(match[0], '=');
    const data = _.find(
      sourceOptions,
      (item: Global.HintOptions) => item.label === key
    );
    if (!data) {
      setOptions([]);
      return;
    }
    const list = _.filter(data.opts, (item: Global.BaseOption<string>) =>
      item.label.includes(value)
    );
    setOptions(list);
  };

  const replaceLastEqual = (value: string) => {
    const matchStr = contextBeforeCursorRef.current.match(matchReg);
    if (matchStr) {
      const arr = _.split(matchStr[0], '=');
      onChange(`${arr[0]}=${value}`);
    } else {
      onChange(value?.trim());
    }
  };

  const getContextBeforeCursor = _.debounce((e: any) => {
    cursorPosRef.current = e.target.selectionStart;
    contextBeforeCursorRef.current = e.target.value.slice(
      0,
      cursorPosRef.current
    );
    generateOptions(contextBeforeCursorRef.current);
  }, 100);

  const handleInput = (e: any) => {
    getContextBeforeCursor(e);
    onChange(e.target.value);
  };

  const handleOnSelect = (value: string) => {
    replaceLastEqual(value);
    setOptions([]);
  };

  return (
    <AutoComplete
      placeholder={props.placeholder}
      defaultActiveFirstOption={true}
      value={value}
      onInput={handleInput}
      onSelect={handleOnSelect}
      onFocus={getContextBeforeCursor}
      onBlur={onBlur}
      label={label}
      options={options}
      trim={trim}
      style={{ flex: 1 }}
    />
  );
};

export default HintInput;
