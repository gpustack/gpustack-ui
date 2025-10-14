import IconFont from '@/components/icon-font';
import hotkeys from '@/config/hotkeys';
import { SearchOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Input } from 'antd';
import React, { useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import styled from 'styled-components';
import { modelSourceMap, modelSourceValueMap } from '../config';

const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;
const Holder = styled.div`
  pointer-events: none;
  position: absolute;
  top: 13px;
  left: 34px;
  color: var(--ant-color-text-quaternary);
  font-size: var(--font-size-small);
  z-index: 10;
  kbd {
    border: 1px solid var(--ant-color-border);
    border-radius: 3px;
    padding: 0 2px;
  }
`;
const SearchInput: React.FC<{
  modelSource: string;
  onChange: (e: any) => void;
  onSearch: (e: any) => void;
}> = (props) => {
  const { onSearch, onChange, modelSource } = props;
  const intl = useIntl();
  const inputRef = useRef<any>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [value, setValue] = React.useState('');

  useHotkeys(hotkeys.FOCUS, (e: any) => {
    e.preventDefault();
    inputRef.current?.focus?.();
  });

  const handleOnChange = (e: any) => {
    setValue(e.target.value);
    onChange(e);
  };

  return (
    <SearchInputWrapper>
      <Input
        ref={inputRef}
        onPressEnter={onSearch}
        onChange={handleOnChange}
        onFocus={(e) => {
          setIsFocused(true);
          e.stopPropagation();
        }}
        onBlur={(e) => {
          setIsFocused(false);
          e.stopPropagation();
        }}
        allowClear
        suffix={
          <SearchOutlined
            className="font-size-16"
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          />
        }
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
      {!value && !isFocused && (
        <Holder
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage(
              {
                id: 'model.deploy.search.placeholder'
              },
              { source: modelSourceValueMap[modelSource] }
            )
          }}
        ></Holder>
      )}
    </SearchInputWrapper>
  );
};

export default SearchInput;
