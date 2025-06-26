import { isNotEmptyValue } from '@/utils/index';
import { useIntl } from '@umijs/max';
import type { CascaderAutoProps } from 'antd';
import { Cascader, Empty, Form } from 'antd';
import _, { cloneDeep } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AutoTooltip from '../auto-tooltip';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import SelectWrapper from './wrapper/select';

const tag = (props: any) => {
  if (props.isMaxTag) {
    return props.label?.slice(0, -3);
  }
  const parent = _.split(props.value, '__RC_CASCADER_SPLIT__')?.[0];
  return `${parent} / ${props?.label}`;
};

const renderTag = (props: any) => {
  return (
    <AutoTooltip
      className="m-r-4"
      closable={props.closable}
      onClose={props.onClose}
      maxWidth={240}
      filled
    >
      {tag(props)}
    </AutoTooltip>
  );
};

const OptionNodes = (props: {
  data: any;
  optionNode: React.FC<{ data: any }>;
}) => {
  const intl = useIntl();
  const { data, optionNode: OptionNode } = props;
  if (data.value === '__EMPTY__') {
    return (
      <Empty
        image={false}
        style={{
          height: 100,
          alignSelf: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        description={intl.formatMessage({
          id: 'common.search.empty'
        })}
      ></Empty>
    );
  }
  let width: any = {
    maxWidth: 140,
    minWidth: 140
  };
  if (!data.parent) {
    width = undefined;
  }
  if (data.parent) {
    return (
      <AutoTooltip ghost {...width}>
        {data.label}
      </AutoTooltip>
    );
  }
  return OptionNode ? <OptionNode data={data}></OptionNode> : data.label;
};

const SealCascader: React.FC<
  CascaderAutoProps &
    SealFormItemProps & { optionNode?: React.FC<{ data: any }> }
> = (props) => {
  const {
    label,
    placeholder,
    children,
    required,
    description,
    options,
    allowNull,
    isInFormItems = true,
    optionNode,
    tagRender,
    ...rest
  } = props;
  const intl = useIntl();
  const [isFocus, setIsFocus] = useState(false);
  const inputRef = useRef<any>(null);
  const [visible, setVisible] = useState(false);
  let status = '';

  // the status can be controlled by Form.Item
  if (isInFormItems) {
    const statusData = Form?.Item?.useStatus?.();
    status = statusData?.status || '';
  }

  const _options = useMemo(() => {
    if (!options?.length) {
      return [];
    }
    const list = cloneDeep(options);
    return list.map((item: any) => {
      if (item.locale) {
        item.label = intl.formatMessage({ id: item.label as string });
      }
      return item;
    });
  }, [options, intl]);

  useEffect(() => {
    if (isNotEmptyValue(props.value) || (allowNull && props.value === null)) {
      setIsFocus(true);
    }
  }, [props.value, allowNull]);

  const handleClickWrapper = () => {
    if (!props.disabled && !isFocus) {
      inputRef.current?.focus?.();
      setIsFocus(true);
    }
  };

  const handleChange = (val: any, options: any) => {
    if (isNotEmptyValue(val) || (allowNull && val === null)) {
      setIsFocus(true);
    } else {
      setIsFocus(false);
    }
    props.onChange?.(val, options);
  };

  const handleOnFocus = (e: any) => {
    setIsFocus(true);
    props.onFocus?.(e);
  };

  const handleOnBlur = (e: any) => {
    if (allowNull && props.value === null) {
      setIsFocus(true);
    } else if (!props.value) {
      setIsFocus(false);
    }
    props.onBlur?.(e);
  };

  const handleDropdownVisibleChange = (open: boolean) => {
    setVisible(open);
  };

  return (
    <SelectWrapper>
      <Wrapper
        className="seal-select-wrapper"
        classList={visible ? 'dropdown-visible' : ''}
        status={status}
        label={label}
        isFocus={isFocus}
        required={required}
        description={description}
        disabled={props.disabled}
        onClick={handleClickWrapper}
      >
        <Cascader
          {...rest}
          optionRender={
            optionNode
              ? (data) => (
                  <OptionNodes
                    data={data}
                    optionNode={optionNode}
                  ></OptionNodes>
                )
              : undefined
          }
          tagRender={tagRender ?? renderTag}
          ref={inputRef}
          options={children ? null : _options}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onChange={handleChange}
          notFoundContent={null}
          onDropdownVisibleChange={handleDropdownVisibleChange}
        ></Cascader>
      </Wrapper>
    </SelectWrapper>
  );
};

export default SealCascader;
