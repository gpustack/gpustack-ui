import IconFont from '@/components/icon-font';
import type { SelectProps } from 'antd';
import { Select } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';
import NotFoundContent from '../components/not-found-content';
import SelectCss from './styles.less';

const BaseSelect: React.FC<
  SelectProps & { ref?: any; footer?: React.ReactNode }
> = forwardRef((props, ref) => {
  const { notFoundContent, loading, ...restProps } = props;
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
      {...restProps}
      notFoundContent={
        <NotFoundContent loading={loading} notFoundContent={notFoundContent} />
      }
      placeholder={props.placeholder}
      ref={inputRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      suffixIcon={renderSuffixIcon()}
      popupRender={
        props.footer
          ? (originNode) => (
              <>
                {originNode}
                {props.footer && (
                  <div className={SelectCss.footer}>{props.footer}</div>
                )}
              </>
            )
          : undefined
      }
    />
  );
});

export default BaseSelect;
