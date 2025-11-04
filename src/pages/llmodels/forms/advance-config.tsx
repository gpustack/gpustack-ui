import LabelSelector from '@/components/label-selector';
import CheckboxField from '@/components/seal-form/checkbox-field';
import SealSelect from '@/components/seal-form/seal-select';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { useCallback } from 'react';
import { DeployFormKeyMap, modelCategories, ScheduleValueMap } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import BackendForm from './backend';
import BackendParametersList from './backend-parameters-list';
import CustomBackend from './custom-backend';

const AdvanceConfig = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const EnviromentVars = Form.useWatch('env', form);
  const scheduleType = Form.useWatch('scheduleType', form);
  const backend = Form.useWatch('backend', form);
  const { onValuesChange, formKey } = useFormContext();

  const handleEnviromentVarsChange = useCallback(
    (labels: Record<string, any>) => {
      form.setFieldValue('env', labels);
    },
    []
  );

  const onSelectorChange = (field: string, allowEmpty?: boolean) => {
    const workerSelector = form.getFieldValue(field);
    // check if all keys have values
    const hasEmptyValue = _.some(_.keys(workerSelector), (k: string) => {
      return !workerSelector[k];
    });
    if (!hasEmptyValue || allowEmpty) {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleEnvSelectorOnBlur = () => {
    onSelectorChange('env', true);
  };

  const handleDeleteEnvSelector = (index: number) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  return (
    <>
      <Form.Item<FormData>
        name="categories"
        data-field="categories"
        style={{
          scrollMarginTop: 200
        }}
      >
        <SealSelect
          allowNull
          label={intl.formatMessage({
            id: 'models.form.categories'
          })}
          options={modelCategories}
        ></SealSelect>
      </Form.Item>
      {formKey === DeployFormKeyMap.CATALOG && (
        <>
          <BackendForm></BackendForm>
          <CustomBackend></CustomBackend>
        </>
      )}

      <BackendParametersList></BackendParametersList>
      <Form.Item<FormData> name="env">
        <LabelSelector
          label={intl.formatMessage({
            id: 'models.form.env'
          })}
          labels={EnviromentVars}
          btnText={intl.formatMessage({ id: 'common.button.vars' })}
          onBlur={handleEnvSelectorOnBlur}
          onDelete={handleDeleteEnvSelector}
          onChange={handleEnviromentVarsChange}
        ></LabelSelector>
      </Form.Item>

      {scheduleType === ScheduleValueMap.Auto &&
        [backendOptionsMap.vllm, backendOptionsMap.ascendMindie].includes(
          backend
        ) && (
          <Form.Item<FormData>
            name="distributed_inference_across_workers"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <CheckboxField
              description={intl.formatMessage({
                id: 'models.form.distribution.tips'
              })}
              label={intl.formatMessage({
                id: 'resources.form.enableDistributedInferenceAcrossWorkers'
              })}
            ></CheckboxField>
          </Form.Item>
        )}
      <Form.Item<FormData>
        name="restart_on_error"
        valuePropName="checked"
        style={{ marginBottom: 8 }}
      >
        <CheckboxField
          description={intl.formatMessage({
            id: 'models.form.restart.onerror.tips'
          })}
          label={intl.formatMessage({
            id: 'models.form.restart.onerror'
          })}
        ></CheckboxField>
      </Form.Item>
    </>
  );
};

export default AdvanceConfig;
