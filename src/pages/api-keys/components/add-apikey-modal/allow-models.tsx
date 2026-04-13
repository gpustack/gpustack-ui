import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { queryMyModels } from '@/pages/llmodels/apis';
import { SelectPanel } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Checkbox, Divider, Form, Radio } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { accessScopeOptions } from '../../config';
import { FormData, ListItem } from '../../config/types';

const Label = styled.div`
  font-weight: 500;
  margin-block: -8px 12px;
  font-size: 14px;
  margin-left: 4px;
`;

const AllowModelsForm: React.FC<{
  currentData?: Partial<ListItem> | null;
  action: PageActionType;
  onValuesChange?: (changedValues: any, allValues: any) => void;
}> = ({ currentData, action, onValuesChange }) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const allowedModelNames = Form.useWatch(
    'allowed_model_names',
    form
  ) as string[];
  const allowedType = Form.useWatch('allowed_type', form);
  const scope = Form.useWatch('scope', form) as string[];
  const [modelList, setModelList] = useState<{ key: string; title: string }[]>(
    []
  );

  const getModelList = async () => {
    try {
      const res = await queryMyModels({
        page: -1
      });
      const options = res.items.map((item) => item.name);
      if (action === PageAction.EDIT && currentData) {
        const list = new Set([
          ...options,
          ...(currentData.allowed_model_names?.map((item) => item) || [])
        ]);
        setModelList(
          Array.from(list).map((item) => ({ key: item, title: item }))
        );
      } else {
        setModelList(options.map((item) => ({ key: item, title: item })));
      }
    } catch (error) {}
  };

  const handleAllowTypeChange = (e: any) => {
    const value = e.target.value;
    onValuesChange?.({ allowed_type: value }, form.getFieldsValue());
  };

  const handleOnScopeChange = (checkedValues: any) => {
    console.log('checkedValues', form.getFieldValue('allowed_type'));
  };

  useEffect(() => {
    getModelList();
  }, [action, currentData]);

  return (
    <div>
      <Divider></Divider>
      <Label>{intl.formatMessage({ id: 'apikeys.access.permissions' })}</Label>
      <Form.Item<FormData> name="scope" style={{ marginBottom: 8 }}>
        <Checkbox.Group
          options={accessScopeOptions.map((item) => ({
            label: intl.formatMessage({ id: item.label }),
            value: item.value
          }))}
          onChange={handleOnScopeChange}
        ></Checkbox.Group>
      </Form.Item>
      {scope?.includes('inference') && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--ant-color-fill-quaternary)',
            borderRadius: 4
          }}
        >
          <Form.Item name="allowed_type" noStyle>
            <Radio.Group
              onChange={handleAllowTypeChange}
              options={[
                {
                  label: intl.formatMessage({ id: 'apikeys.models.all' }),
                  value: 'all'
                },
                {
                  label: intl.formatMessage({ id: 'apikeys.models.selected' }),
                  value: 'custom'
                }
              ]}
            ></Radio.Group>
          </Form.Item>
          {allowedType === 'custom' && (
            <Form.Item
              name="allowed_model_names"
              style={{ marginBottom: 0, marginTop: 12 }}
              rules={[
                {
                  required: allowedType === 'custom',
                  message: getRuleMessage(
                    'select',
                    intl.formatMessage({ id: 'models.table.models' })
                  )
                }
              ]}
            >
              <SelectPanel
                height={300}
                styles={{
                  container: {
                    backgroundColor: 'var(--ant-color-bg-container) !important'
                  },
                  header: {
                    backgroundColor: 'var(--ant-color-bg-container) !important'
                  }
                }}
                searchPlaceholder={intl.formatMessage({
                  id: 'common.filter.name'
                })}
                options={modelList}
                selectedKeys={allowedModelNames || []}
                notFoundContent={intl.formatMessage({
                  id: 'apikeys.models.noModelsFound'
                })}
                onSelectChange={(selectedKeys) => {
                  form.setFieldsValue({ allowed_model_names: selectedKeys });
                  onValuesChange?.(
                    { allowed_model_names: selectedKeys },
                    form.getFieldsValue()
                  );
                }}
              />
            </Form.Item>
          )}
        </div>
      )}
    </div>
  );
};

export default AllowModelsForm;
