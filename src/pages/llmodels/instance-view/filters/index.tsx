import { BaseSelect, FilterForm, FilterFormField } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import useFilterStatus from '../../hooks/use-filter-status';

interface InstanceFilterFormProps {
  clusterList: Global.BaseOption<number>[];
  workerList: { id: number; name: string }[];
  initialValues?: Record<string, any>;
  open?: boolean;
  onClose?: () => void;
  onClear: () => void;
  onValuesChange: (values: Record<string, any>) => void;
  filterOptions?: {
    optionList: { label: string; value: string; color: string }[];
  };
}

const InstanceFilterForm = forwardRef<
  { reset: () => void },
  InstanceFilterFormProps
>(
  (
    {
      clusterList,
      workerList,
      initialValues,
      onClose,
      onClear,
      onValuesChange,
      open,
      filterOptions
    },
    ref
  ) => {
    const intl = useIntl();
    const { labelRender, optionRender, statusOptions } =
      useFilterStatus(filterOptions);
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
          label={intl.formatMessage({ id: 'clusters.title' })}
        >
          <Form.Item noStyle name="cluster_id">
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({
                id: 'clusters.filterBy.cluster'
              })}
              size="large"
              options={clusterList}
            />
          </Form.Item>
        </FilterFormField>
        <FilterFormField
          label={intl.formatMessage({ id: 'resources.filter.worker' })}
        >
          <Form.Item noStyle name="worker_id">
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({
                id: 'resources.filter.worker'
              })}
              size="large"
              options={workerList.map((w) => ({
                label: w.name,
                value: w.id
              }))}
            />
          </Form.Item>
        </FilterFormField>
        <FilterFormField
          label={intl.formatMessage({ id: 'models.table.status' })}
        >
          <Form.Item noStyle name="state">
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({ id: 'common.filter.status' })}
              size="large"
              optionRender={optionRender}
              labelRender={labelRender}
              options={statusOptions}
            />
          </Form.Item>
        </FilterFormField>
      </FilterForm>
    );
  }
);

export default InstanceFilterForm;
