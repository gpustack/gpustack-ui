import { BaseSelect, FilterForm, FilterFormField } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle, useRef } from 'react';

interface CreatorFilterFormProps {
  userList: Global.BaseOption<number>[];
  initialValues?: Record<string, any>;
  open?: boolean;
  onClose?: () => void;
  onClear: () => void;
  onValuesChange: (values: Record<string, any>) => void;
}

const CreatorFilterForm = forwardRef<
  { reset: () => void },
  CreatorFilterFormProps
>(
  (
    { userList, initialValues, onClose, onClear, onValuesChange, open },
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
          label={intl.formatMessage({ id: 'common.filter.byCreator' })}
        >
          <Form.Item noStyle name="user_id">
            <BaseSelect
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              placeholder={intl.formatMessage({
                id: 'common.filter.byCreator'
              })}
              size="large"
              options={userList}
            />
          </Form.Item>
        </FilterFormField>
      </FilterForm>
    );
  }
);

export default CreatorFilterForm;
