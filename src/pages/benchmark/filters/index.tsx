import BaseSelect from '@/components/seal-form/base/select';
import FilterForm from '@/pages/_components/filter-form';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { SearchOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, Input } from 'antd';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import styled from 'styled-components';
import { profileOptions } from '../config';

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
  clusterList?: Global.BaseOption<number>[];
  initialValues?: any;
  open?: boolean;
  ref?: any;
  modelList?: Global.BaseOption<number, { categories: string[] }>[];
  onClose?: () => void;
  onClear?: () => void;
  onValuesChange: (values: any) => void;
}

const FilterFormContent: React.FC<FilterFormContentProps> = forwardRef(
  (
    { initialValues, onClose, onClear, onValuesChange, open, modelList },
    ref
  ) => {
    const intl = useIntl();
    const filterRef = useRef<any>(null);

    const handleOnValuesChange = (changedValues: any, allValues: any) => {
      onValuesChange?.(allValues);
    };

    const modelOptions = modelList
      ?.filter((item) => {
        return item.categories?.includes(modelCategoriesMap.llm);
      })
      .map((item) => ({
        label: item.label,
        value: item.label
      }));

    useImperativeHandle(ref, () => ({
      reset: () => {
        filterRef.current?.reset();
      }
    }));

    return (
      <FilterForm
        ref={filterRef}
        width={232}
        contentHeight={'calc(100vh - 122px)'}
        open={open}
        onClose={onClose}
        onClear={onClear}
        onValuesChange={handleOnValuesChange}
        initialValues={initialValues}
        styles={{
          container: {
            paddingInline: '0 8px',
            marginLeft: '-8px'
          },
          wrapper: {
            marginRight: open ? 24 : 0,
            marginTop: '-24px'
          }
        }}
      >
        <Content>
          <Label style={{ marginTop: 0 }}>GPU</Label>
          <Form.Item name="gpu_summary" noStyle>
            <Input
              prefix={
                <SearchOutlined
                  style={{ color: 'var(--ant-color-text-placeholder)' }}
                ></SearchOutlined>
              }
              placeholder={intl.formatMessage({
                id: 'benchmark.table.filter.bygpu'
              })}
              allowClear
            ></Input>
          </Form.Item>
          <Label>{intl.formatMessage({ id: 'benchmark.form.profile' })}</Label>
          <Form.Item noStyle name="profile">
            <BaseSelect
              allowClear
              placeholder={intl.formatMessage({
                id: 'benchmark.table.filter.byProfile'
              })}
              options={[
                ...profileOptions,
                {
                  label: 'backend.custom',
                  locale: true,
                  value: 'Custom'
                }
              ].map((item) => ({
                label: item.locale
                  ? intl.formatMessage({ id: item.label })
                  : item.label,
                value: item.value
              }))}
            ></BaseSelect>
          </Form.Item>
          <Label>{intl.formatMessage({ id: 'benchmark.table.model' })}</Label>
          <Form.Item noStyle name="model_name">
            {/* <PillButtonGroup
            options={modelCategories.filter((item) => item.value)}
          ></PillButtonGroup> */}
            <BaseSelect
              allowClear
              placeholder={intl.formatMessage({
                id: 'benchmark.table.filter.bymodel'
              })}
              options={modelOptions}
            ></BaseSelect>
          </Form.Item>
        </Content>
      </FilterForm>
    );
  }
);

export default FilterFormContent;
