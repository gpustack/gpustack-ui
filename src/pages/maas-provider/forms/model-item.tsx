import AutoComplete from '@/components/seal-form/auto-complete';
import SealSelect from '@/components/seal-form/seal-select';
import { categoryOptions } from '@/pages/llmodels/config';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { FormData, ProviderModel } from '../config/types';
import { useTestProviderModel } from '../hooks/use-query-provider-models';

const SelectWrapper = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 265px 160px max-content;
  align-items: center;
  gap: 8px;
  .icon-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
  }
`;

interface ModelItemProps {
  onOpenChange: (open: boolean) => void;
  onChange: (data: ProviderModel) => void;
  providerModelList: Global.BaseOption<string>[];
  selectedModelList: ProviderModel[];
  item: ProviderModel;
  loading?: boolean;
}

const ModelItem: React.FC<ModelItemProps> = ({
  onOpenChange,
  onChange,
  loading,
  providerModelList,
  selectedModelList,
  item
}) => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const { runTestModel, loading: testLoading } = useTestProviderModel();

  const handleTestModel = async () => {
    const res = await runTestModel({
      data: {
        model_name: item.name,
        api_token: form.getFieldValue('api_key') || '',
        config: {
          type: form.getFieldValue(['config', 'type']) || ''
        }
      }
    });
    onChange({
      ...item,
      accessible: res.accessible
    });
  };

  const handleOnChange = (value: string) => {
    onChange({
      ...item,
      accessible: null,
      name: value
    });
  };

  const handleOnCategoryChange = (value: string) => {
    onChange({
      ...item,
      category: value
    });
  };

  const renderSuffixIcon = () => {
    if (testLoading) {
      return <LoadingOutlined />;
    }
    if (item.accessible === true) {
      return (
        <CheckCircleFilled
          style={{ color: 'var(--ant-color-success)', fontSize: 16 }}
        />
      );
    }
    if (item.accessible === false) {
      return (
        <CloseCircleFilled
          style={{ color: 'var(--ant-color-error)', fontSize: 16 }}
        />
      );
    }
    return null;
  };

  // filter out already selected models, but keep the current one
  const selectedModelMap = new Map(
    selectedModelList?.map((model) => [model.name, true])
  );
  const filteredOptions = () => {
    return providerModelList.filter((model) => {
      return model.value === item.name || !selectedModelMap.has(model.value);
    });
  };

  return (
    <SelectWrapper>
      <AutoComplete
        loading={loading}
        showSearch
        onOpenChange={onOpenChange}
        suffixIcon={renderSuffixIcon()}
        value={item.name}
        onChange={handleOnChange}
        options={filteredOptions()}
        placeholder={intl.formatMessage({ id: 'providers.table.models' })}
      />
      <SealSelect
        value={item.category || undefined}
        onChange={handleOnCategoryChange}
        options={categoryOptions}
        placeholder={intl.formatMessage({
          id: 'models.form.categories'
        })}
      ></SealSelect>
      <Tooltip
        title={intl.formatMessage({ id: 'providers.form.model.test.tips' })}
      >
        <Button type="link" size="small" onClick={handleTestModel}>
          {testLoading ? (
            <LoadingOutlined />
          ) : (
            intl.formatMessage({ id: 'providers.form.model.test' })
          )}
        </Button>
      </Tooltip>
    </SelectWrapper>
  );
};

export default ModelItem;
