import BaseSelect from '@/components/seal-form/base/select';
import FilterForm from '@/pages/_components/filter-form';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import styled from 'styled-components';
import { modelCategories } from '../config';
import useFilterStatus from '../hooks/use-filter-status';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

interface FilterFormContentProps {
  clusterList: Global.BaseOption<number>[];
  initialValues?: any;
  onValuesChange?: (values: any) => void;
}

const FilterFormContent: React.FC<FilterFormContentProps> = ({
  clusterList,
  initialValues,
  onValuesChange
}) => {
  const intl = useIntl();
  const { labelRender, optionRender, statusOptions } = useFilterStatus();

  const handleOnValuesChange = (changedValues: any, allValues: any) => {
    onValuesChange?.(allValues);
  };

  return (
    <FilterForm
      onValuesChange={handleOnValuesChange}
      initialValues={initialValues}
    >
      <Content>
        <Form.Item name="categories" noStyle>
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
        <Form.Item name="cluster_id" noStyle>
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
        <Form.Item name="state" noStyle>
          <BaseSelect
            allowClear
            showSearch={false}
            placeholder={intl.formatMessage({
              id: 'common.filter.status'
            })}
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
};

export default FilterFormContent;
