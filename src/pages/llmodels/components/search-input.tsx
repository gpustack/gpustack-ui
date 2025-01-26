import IconFont from '@/components/icon-font';
import hotkeys from '@/config/hotkeys';
import ModelContext from '@/pages/chat/config/modal-context';
import { useIntl } from '@umijs/max';
import { Input } from 'antd';
import React, { useEffect, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { modelSourceMap, modelSourceValueMap } from '../config';

const SearchInput: React.FC<{
  modelSource: string;
  onChange: (e: any) => void;
  onSearch: (e: any) => void;
}> = (props) => {
  const { onSearch, onChange, modelSource } = props;
  const modelContext = React.useContext<any>(ModelContext);
  const intl = useIntl();
  const inputRef = useRef<any>(null);
  const [inputValue, setInputValue] = React.useState<string>('');

  useHotkeys(hotkeys.FOCUS, (e: any) => {
    e.preventDefault();
    inputRef.current?.focus?.();
  });

  useEffect(() => {
    if (!modelContext.search) {
      return;
    }
    onChange({ target: { value: modelContext.search } });
    onSearch({ target: { value: modelContext.search } });
    setInputValue(modelContext.search);
  }, [modelContext.search]);

  return (
    <Input
      ref={inputRef}
      onPressEnter={onSearch}
      onChange={onChange}
      value={inputValue}
      allowClear
      placeholder={intl.formatMessage(
        {
          id: 'model.deploy.search.placeholder'
        },
        { source: modelSourceValueMap[modelSource] }
      )}
      prefix={
        <>
          <IconFont
            className="font-size-16"
            type={
              modelSource === modelSourceMap.huggingface_value
                ? 'icon-huggingface'
                : 'icon-tu2'
            }
          ></IconFont>
        </>
      }
    ></Input>
  );
};

export default React.memo(SearchInput);
