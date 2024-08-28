import hotkeys from '@/config/hotkeys';
import { SearchOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Input } from 'antd';
import React, { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

const SearchInput: React.FC<{
  onSearch: (e: any) => void;
}> = (props) => {
  const { onSearch } = props;
  const intl = useIntl();
  const [isFocus, setIsFocus] = useState(false);
  const inputRef = useRef<any>(null);

  useHotkeys(hotkeys.INPUT.join(','), () => {
    inputRef.current?.focus?.();
    setIsFocus(true);
  });

  return (
    <Input
      ref={inputRef}
      onPressEnter={onSearch}
      onFocus={() => setIsFocus(true)}
      onBlur={() => setIsFocus(false)}
      allowClear
      placeholder={intl.formatMessage({
        id: 'model.deploy.search.placeholder'
      })}
      prefix={
        <>
          <SearchOutlined
            style={{
              fontSize: '16px',
              color: 'var(--ant-color-text-quaternary)'
            }}
          />
        </>
      }
    ></Input>
  );
};

export default React.memo(SearchInput);
