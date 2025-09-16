import IconFont from '@/components/icon-font';
import type { SelectProps } from 'antd';
import { Select } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';

const BaseSelect: React.FC<SelectProps> = forwardRef((props, ref) => {
  const [isFocus, setIsFocus] = React.useState(false);
  const inputRef = React.useRef<any>(null);

  useImperativeHandle(ref, () => ({
    ...(inputRef.current || ({} as any))
  }));

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocus(true);
    props.onFocus?.(e);
  };
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocus(false);
    props.onBlur?.(e);
  };
  const renderSuffixIcon = () => {
    if (props.suffixIcon) {
      return props.suffixIcon;
    }
    if (!props.showSearch) {
      return <IconFont type="icon-down"></IconFont>;
    }
    return !isFocus ? <IconFont type="icon-down"></IconFont> : undefined;
  };

  return (
    <Select
      {...props}
      ref={inputRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      suffixIcon={renderSuffixIcon()}
    />
  );
});

export default BaseSelect;
