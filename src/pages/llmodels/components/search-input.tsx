import IconFont from '@/components/icon-font';
import hotkeys from '@/config/hotkeys';
import { useIntl } from '@umijs/max';
import { Input } from 'antd';
import React, { useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { modelSourceMap, modelSourceValueMap } from '../config';

const SearchInput: React.FC<{
  modelSource: string;
  onChange: (e: any) => void;
  onSearch: (e: any) => void;
}> = (props) => {
  const { onSearch, onChange, modelSource } = props;
  const intl = useIntl();
  const inputRef = useRef<any>(null);

  useHotkeys(hotkeys.FOCUS, (e: any) => {
    e.preventDefault();
    inputRef.current?.focus?.();
  });

  return (
    <Input
      ref={inputRef}
      onPressEnter={onSearch}
      onChange={onChange}
      allowClear
      placeholder={intl.formatMessage(
        {
          id: 'model.deploy.search.placeholder'
        },
        { source: modelSourceValueMap[modelSource] }
      )}
      prefix={
        <IconFont
          className="font-size-16"
          type={
            modelSource === modelSourceMap.huggingface_value
              ? 'icon-huggingface'
              : 'icon-tu2'
          }
        ></IconFont>
      }
    ></Input>
  );
};

export default SearchInput;
