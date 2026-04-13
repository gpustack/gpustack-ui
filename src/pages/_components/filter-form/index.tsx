import { CloseOutlined } from '@ant-design/icons';
import { OverlayScroller } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import classNames from 'classnames';
import React, { forwardRef, useImperativeHandle } from 'react';
import filterFormCss from '../styles/filter-form.less';

const FilterForm: React.FC<
  React.PropsWithChildren & {
    ref?: any;
    width?: number;
    contentHeight?: number | string;
    initialValues?: any;
    hasFilters?: boolean;
    open?: boolean;
    onClear?: () => void;
    onClose?: () => void;
    onValuesChange?: (ChangeValues: any, allValues: any) => void;
    styles?: {
      container?: React.CSSProperties;
      wrapper?: React.CSSProperties;
    };
  }
> = forwardRef(
  (
    {
      children,
      open,
      width = 300,
      contentHeight = 400,
      initialValues = {},
      styles,
      onClose,
      onClear,
      onValuesChange
    },
    ref
  ) => {
    const intl = useIntl();
    const [form] = Form.useForm();

    const handleOnReset = () => {
      form.resetFields(Object.keys(initialValues));
      form.resetFields();
      onValuesChange?.({}, form.getFieldsValue());
    };

    const handleOnClose = () => {
      onClose?.();
    };

    const handleOnValuesChange = (changedValues: any, allValues: any) => {
      onValuesChange?.(changedValues, allValues);
    };

    const handleOnClear = () => {
      handleOnReset();
    };

    const filtersCount = Object.values(form.getFieldsValue()).filter(
      (value) => value !== undefined && value !== null && value !== ''
    ).length;

    const renderFooter = () => {
      return (
        <div className={filterFormCss['btn-wrapper']}>
          <Button size="middle" onClick={handleOnReset}>
            {intl.formatMessage({ id: 'common.button.reset' })}
          </Button>
          <div className={filterFormCss.buttons}>
            <Button size="middle" type="primary" onClick={handleOnClose}>
              {intl.formatMessage({ id: 'common.button.close' })}
            </Button>
          </div>
        </div>
      );
    };

    useImperativeHandle(ref, () => ({
      form,
      reset: handleOnReset,
      getValues: () => form.getFieldsValue(),
      setValues: (values: any) => form.setFieldsValue(values)
    }));

    return (
      <div
        className={classNames(filterFormCss.wrapper, {
          [filterFormCss.show]: open
        })}
        style={{
          width: open ? width : 0,
          height: contentHeight,
          ...styles?.wrapper
        }}
      >
        <div
          style={{ width: width, ...styles?.container }}
          className={filterFormCss.container}
        >
          <div className={filterFormCss.title}>
            <span
              style={{
                fontWeight: 500,
                color: 'var(--ant-color-text-tertiary)'
              }}
            >
              {intl.formatMessage({ id: 'common.filter.label' })}
            </span>
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={handleOnClose}
              type="text"
              style={{
                color: 'var(--ant-color-text-secondary)'
              }}
            ></Button>
          </div>
          <OverlayScroller
            maxHeight={contentHeight}
            styles={{
              wrapper: {
                paddingInline: 8
              }
            }}
          >
            <Form
              onValuesChange={handleOnValuesChange}
              initialValues={initialValues}
              form={form}
              layout="vertical"
              styles={{
                label: {
                  lineHeight: 1,
                  height: 'auto',
                  marginBottom: 8,
                  fontWeight: 500
                },
                content: {
                  minHeight: 0
                }
              }}
            >
              {children}
            </Form>
          </OverlayScroller>
        </div>
      </div>
    );
  }
);

export default FilterForm;
