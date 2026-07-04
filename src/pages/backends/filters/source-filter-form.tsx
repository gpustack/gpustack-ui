import { BaseSelect, FilterForm, FilterFormField } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle, useRef } from 'react';

interface SourceFilterFormProps {
  sourceOptions: Global.BaseOption<string>[];
  initialValues?: Record<string, any>;
  open?: boolean;
  onClose?: () => void;
  onClear: () => void;
  onValuesChange: (values: Record<string, any>) => void;
}

const SourceFilterForm = forwardRef<
  { reset: () => void },
  SourceFilterFormProps
>(
  (
    { sourceOptions, initialValues, onClose, onClear, onValuesChange, open },
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
          label={intl.formatMessage({ id: 'backend.filter.source' })}
        >
          <Form.Item noStyle name="backend_source">
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({ id: 'backend.filter.source' })}
              size="large"
              options={sourceOptions}
            />
          </Form.Item>
        </FilterFormField>
      </FilterForm>
    );
  }
);

export default SourceFilterForm;
