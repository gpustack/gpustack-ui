import { BaseSelect, FilterForm, FilterFormField } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { SelectProps } from 'antd';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle, useRef } from 'react';

interface UserModelsFilterFormProps {
  categoryOptions: Global.BaseOption<string>[];
  statusOptions: SelectProps['options'];
  statusOptionRender?: SelectProps['optionRender'];
  statusLabelRender?: SelectProps['labelRender'];
  initialValues?: Record<string, any>;
  open?: boolean;
  onClose?: () => void;
  onClear: () => void;
  onValuesChange: (values: Record<string, any>) => void;
}

const UserModelsFilterForm = forwardRef<
  { reset: () => void },
  UserModelsFilterFormProps
>(
  (
    {
      categoryOptions,
      statusOptions,
      statusOptionRender,
      statusLabelRender,
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
          label={intl.formatMessage({ id: 'models.filter.category' })}
        >
          <Form.Item noStyle name="categories">
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({ id: 'models.filter.category' })}
              size="large"
              options={categoryOptions}
            />
          </Form.Item>
        </FilterFormField>
        <FilterFormField
          label={intl.formatMessage({ id: 'common.filter.status' })}
        >
          <Form.Item noStyle name="state">
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({ id: 'common.filter.status' })}
              size="large"
              optionRender={statusOptionRender}
              labelRender={statusLabelRender}
              options={statusOptions}
            />
          </Form.Item>
        </FilterFormField>
      </FilterForm>
    );
  }
);

export default UserModelsFilterForm;
