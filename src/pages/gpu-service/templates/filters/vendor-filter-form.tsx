import { BaseSelect, FilterForm, FilterFormField } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle, useRef } from 'react';

interface VendorFilterFormProps {
  manufacturerOptions: Global.BaseOption<string>[];
  initialValues?: Record<string, any>;
  open?: boolean;
  onClose?: () => void;
  onClear: () => void;
  onValuesChange: (values: Record<string, any>) => void;
}

const VendorFilterForm = forwardRef<
  { reset: () => void },
  VendorFilterFormProps
>(
  (
    {
      manufacturerOptions,
      initialValues,
      onClose,
      onClear,
      onValuesChange,
      open
    },
    ref
  ) => {
    const intl = useIntl();
    const filterRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        filterRef.current?.reset();
      }
    }));

    return (
      <FilterForm
        ref={filterRef}
        width={232}
        contentHeight={'calc(100vh - var(--app-banner-height, 0px) - 74px)'}
        open={open}
        onClose={onClose}
        onClear={onClear}
        onValuesChange={(_changed, allValues) => onValuesChange(allValues)}
        initialValues={initialValues}
        styles={{ wrapper: { marginTop: 0 } }}
      >
        <FilterFormField
          first
          label={intl.formatMessage({
            id: 'gpuservice.template.filter.vendor'
          })}
        >
          <Form.Item noStyle name="manufacturer">
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({
                id: 'gpuservice.template.filter.vendor'
              })}
              size="large"
              options={manufacturerOptions}
            />
          </Form.Item>
        </FilterFormField>
      </FilterForm>
    );
  }
);

export default VendorFilterForm;
