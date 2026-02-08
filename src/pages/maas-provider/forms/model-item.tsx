import AutoComplete from '@/components/seal-form/auto-complete';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { categoryOptions } from '@/pages/llmodels/config';
import {
  CheckCircleFilled,
  LoadingOutlined,
  WarningFilled
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useFormContext } from '../config/form-context';
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
  onOpenChange?: (open: boolean) => void;
  onChange: (data: ProviderModel) => void;
  providerModelList: Global.BaseOption<
    string,
    {
      category: string;
      accessible: boolean;
    }
  >[];
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
  const { id, action, currentData } = useFormContext();
  const [openTip, setOpenTip] = React.useState(false);

  const generateCurrentAPIKey = (currentAPIKey: string) => {
    if (
      action === PageAction.EDIT &&
      currentAPIKey === currentData?.api_tokens?.[0]?.hash
    ) {
      return undefined;
    }
    return currentAPIKey;
  };

  const handleTestModel = async () => {
    const res = await runTestModel({
      id: action === PageAction.EDIT ? id! : 0,
      data: {
        model_name: item.name,
        api_token: generateCurrentAPIKey(
          form.getFieldValue('api_key')
        ) as string,
        proxy_url: form.getFieldValue('proxy_url') || undefined,
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

  const handleOnChange = (value: string, option: any) => {
    console.log('selected model', value, option);
    onChange({
      ...option,
      name: value
    });
  };

  const handleOnCategoryChange = (value: string) => {
    onChange({
      ...item,
      category: value
    });
  };

  const handleOnBlur = (e: any) => {
    const value = e.target.value;

    const isDuplicate = selectedModelList.some(
      (model) => model.name === value && model !== item
    );
    setOpenTip(isDuplicate);
    // if duplicate, clear the value, and close the tooltip after 2 seconds
    if (isDuplicate) {
      onChange({
        ...item,
        name: ''
      });
      setTimeout(() => {
        setOpenTip(false);
      }, 2000);
    }
  };

  const renderSuffixIcon = () => {
    if (testLoading) {
      return <LoadingOutlined />;
    }
    if (item.accessible === true) {
      return (
        <CheckCircleFilled
          style={{ color: 'var(--ant-color-success)', fontSize: 14 }}
        />
      );
    }
    if (item.accessible === false) {
      return (
        <WarningFilled
          style={{ color: 'var(--ant-color-warning)', fontSize: 14 }}
        />
      );
    }
    return null;
  };

  // filter out already selected models, but keep the current one
  const selectedModelSet = useMemo(() => {
    return new Set(selectedModelList?.map((model) => model.name));
  }, [selectedModelList]);

  const filteredOptions = useMemo(() => {
    return providerModelList.filter((model) => {
      return model.value === item.name || !selectedModelSet.has(model.value);
    });
  }, [providerModelList, item.name, selectedModelSet]);

  return (
    <SelectWrapper>
      <Tooltip
        title={intl.formatMessage({ id: 'providers.form.model.duplicate' })}
        open={openTip}
      >
        <span>
          <AutoComplete
            loading={loading}
            showSearch={{
              filterOption: (inputValue, option: any) => {
                return (
                  option!.value
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) ||
                  option.label
                    ?.toString()
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                );
              }
            }}
            onOpenChange={onOpenChange}
            suffixIcon={renderSuffixIcon()}
            value={item.name}
            onChange={handleOnChange}
            onBlur={handleOnBlur}
            options={filteredOptions}
            placeholder={intl.formatMessage({ id: 'providers.table.models' })}
          />
        </span>
      </Tooltip>
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
