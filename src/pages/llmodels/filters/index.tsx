import { BaseSelect, FilterForm, FilterFormField } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { modelCategories } from '../config';
import useFilterStatus from '../hooks/use-filter-status';

interface FilterFormContentProps {
  clusterList: Global.BaseOption<number>[];
  initialValues?: any;
  open?: boolean;
  ref?: any;
  onClose?: () => void;
  onClear: () => void;
  onValuesChange: (values: any) => void;
}

const FilterFormContent: React.FC<FilterFormContentProps> = forwardRef(
  (
    { clusterList, initialValues, onClose, onClear, onValuesChange, open },
    ref
  ) => {
    const intl = useIntl();
    const { labelRender, optionRender, statusOptions } = useFilterStatus();
    const filterRef = useRef<any>(null);

    const handleOnValuesChange = (changedValues: any, allValues: any) => {
      onValuesChange?.(allValues);
    };

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
        onValuesChange={handleOnValuesChange}
        initialValues={initialValues}
        styles={{
          wrapper: {
            marginTop: 0
          }
        }}
      >
        <FilterFormField
          first
          label={intl.formatMessage({
            id: 'clusters.title'
          })}
        >
          <Form.Item
            noStyle
            name="cluster_id"
            label={intl.formatMessage({
              id: 'clusters.filterBy.cluster'
            })}
          >
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({
                id: 'clusters.filterBy.cluster'
              })}
              size="large"
              maxTagCount={1}
              options={clusterList}
            ></BaseSelect>
          </Form.Item>
        </FilterFormField>
        <FilterFormField
          label={intl.formatMessage({ id: 'models.table.category' })}
        >
          <Form.Item
            noStyle
            name="categories"
            label={intl.formatMessage({
              id: 'models.filter.category'
            })}
          >
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({
                id: 'models.filter.category'
              })}
              size="large"
              maxTagCount={1}
              options={modelCategories.filter((item) => item.value)}
            ></BaseSelect>
          </Form.Item>
        </FilterFormField>
        <FilterFormField
          label={intl.formatMessage({
            id: 'models.table.status'
          })}
        >
          <Form.Item
            noStyle
            name="state"
            label={intl.formatMessage({
              id: 'models.table.status'
            })}
          >
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({ id: 'common.filter.status' })}
              size="large"
              maxTagCount={1}
              optionRender={optionRender}
              labelRender={labelRender}
              options={statusOptions}
            ></BaseSelect>
          </Form.Item>
        </FilterFormField>
      </FilterForm>
    );
  }
);

export default FilterFormContent;
