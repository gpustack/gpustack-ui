import { BaseSelect, FilterForm } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import styled from 'styled-components';
import { modelCategories } from '../config';
import useFilterStatus from '../hooks/use-filter-status';
const Content = styled.div`
  display: flex;
  flex-direction: column;
`;
const Label = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  margin-block: 12px 8px;
  color: var(--ant-color-text-tertiary);
`;

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
        contentHeight={'calc(100vh - 74px)'}
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
        <Content>
          <Label style={{ marginTop: 0 }}>
            {intl.formatMessage({
              id: 'clusters.title'
            })}
          </Label>
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
          <Label>{intl.formatMessage({ id: 'models.table.category' })}</Label>
          <Form.Item
            noStyle
            name="categories"
            label={intl.formatMessage({
              id: 'models.filter.category'
            })}
          >
            {/* <PillButtonGroup
            options={modelCategories.filter((item) => item.value)}
          ></PillButtonGroup> */}
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({
                id: 'models.filter.category'
              })}
              size="large"
              maxTagCount={1}
              // onChange={handleCategoryChange}
              options={modelCategories.filter((item) => item.value)}
            ></BaseSelect>
          </Form.Item>

          <Label>
            {intl.formatMessage({
              id: 'models.table.status'
            })}
          </Label>
          <Form.Item
            noStyle
            name="state"
            label={intl.formatMessage({
              id: 'models.table.status'
            })}
          >
            {/* <PillButtonGroup options={statusOptions}></PillButtonGroup> */}
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
        </Content>
      </FilterForm>
    );
  }
);

export default FilterFormContent;
