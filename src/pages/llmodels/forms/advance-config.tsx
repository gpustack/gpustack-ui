import { PageAction } from '@/config';
import DocLink from '@/pages/_components/doc-link';
import { genericReferLink } from '@/pages/model-routes/config';
import {
  CheckboxField,
  LabelSelector,
  Select as SealSelect
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import { modelCategories } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';
import BackendParametersList from './backend-parameters-list';
import ModelLoraList from './model-lora-list';

const AdvanceConfig = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const backend = Form.useWatch('backend', form);
  const modelRouteEnable = Form.useWatch('enable_model_route', form);
  const {
    onValuesChange,
    realAction,
    action,
    backendOptions,
    flatBackendOptions,
    isGGUF,
    modelContextData
  } = useFormContext();

  const currentBackendOptions = useMemo(() => {
    return flatBackendOptions?.find((item) => item.value === backend);
  }, [backend, flatBackendOptions]);

  console.log('currentBackendOptions', currentBackendOptions);

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

  const handleContextLengthChange = _.debounce((value: number) => {
    onValuesChange?.({}, form.getFieldsValue());
  }, 300);

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
      <BackendParametersList></BackendParametersList>
      <Form.Item<FormData> name="env">
        <LabelSelector
          label={intl.formatMessage({
            id: 'models.form.env'
          })}
          btnText={intl.formatMessage({ id: 'common.button.vars' })}
          onBlur={handleEnvSelectorOnBlur}
          onDelete={handleDeleteEnvSelector}
        ></LabelSelector>
      </Form.Item>
      <ModelLoraList></ModelLoraList>
      {(backend === backendOptionsMap.custom ||
        !currentBackendOptions?.isBuiltIn) && (
        <Form.Item<FormData>
          name="cpu_offloading"
          valuePropName="checked"
          style={{ marginBottom: 8 }}
        >
          <CheckboxField
            description={intl.formatMessage({
              id: 'models.form.partialoffload.tips'
            })}
            label={intl.formatMessage({
              id: 'resources.form.enablePartialOffload'
            })}
          ></CheckboxField>
        </Form.Item>
      )}
      {currentBackendOptions?.isBuiltIn && (
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
      {realAction === PageAction.COPY || action === PageAction.CREATE ? (
        <>
          <Form.Item<FormData>
            name="enable_model_route"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <CheckboxField
              label={intl.formatMessage({
                id: 'models.form.enableModelRoute'
              })}
            ></CheckboxField>
          </Form.Item>
          {modelRouteEnable && (
            <Form.Item<FormData>
              name="generic_proxy"
              valuePropName="checked"
              style={{ marginBottom: 8 }}
            >
              <CheckboxField
                description={
                  <DocLink
                    title={intl.formatMessage({
                      id: 'models.form.generic_proxy.tips'
                    })}
                    link={genericReferLink}
                  ></DocLink>
                }
                label={intl.formatMessage({
                  id: 'models.form.generic_proxy'
                })}
              ></CheckboxField>
            </Form.Item>
          )}
        </>
      ) : null}
    </>
  );
};

export default AdvanceConfig;
