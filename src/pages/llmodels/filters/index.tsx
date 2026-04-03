import BaseSelect from '@/components/seal-form/base/select';
import FilterForm from '@/pages/_components/filter-form';
import PillButtonGroup from '@/pages/_components/pill-button-group';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import styled from 'styled-components';
import { modelCategories } from '../config';
import useFilterStatus from '../hooks/use-filter-status';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  // gap: 16px;
`;
const Label = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  margin-block: 16px;
  color: var(--ant-color-text-tertiary);
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
      width={430}
      onValuesChange={handleOnValuesChange}
      initialValues={initialValues}
    >
      <Content>
        <Label style={{ marginTop: 0 }}>
          {intl.formatMessage({
            id: 'clusters.filterBy.cluster'
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
        <Label>
          {intl.formatMessage({
            id: 'models.filter.category'
          })}
        </Label>
        <Form.Item
          noStyle
          name="categories"
          label={intl.formatMessage({
            id: 'models.filter.category'
          })}
        >
          <PillButtonGroup
            allowClear
            showSearch={false}
            placeholder={intl.formatMessage({
              id: 'models.filter.category'
            })}
            size="large"
            maxTagCount={1}
            variant="filled"
            options={modelCategories.filter((item) => item.value)}
          ></PillButtonGroup>
        </Form.Item>

        <Label>
          {intl.formatMessage({
            id: 'common.filter.status'
          })}
        </Label>
        <Form.Item
          noStyle
          name="state"
          label={intl.formatMessage({
            id: 'common.filter.status'
          })}
        >
          <PillButtonGroup
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
          ></PillButtonGroup>
        </Form.Item>
      </Content>
    </FilterForm>
  );
};

export default FilterFormContent;
