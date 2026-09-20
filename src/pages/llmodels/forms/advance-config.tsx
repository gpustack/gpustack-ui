import { PageAction } from '@/config';
import DocLink from '@/pages/_components/doc-link';
import { genericReferLink } from '@/pages/model-routes/config';
import {
  CheckboxField,
  Input as CInput,
  LabelSelector,
  Select as SealSelect
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form, message, Modal, Typography } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { createApisKey } from '../../api-keys/apis';
import { modelCategories } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';
import BackendParametersList from './backend-parameters-list';
import ModelLoraList from './model-lora-list';

const AdvanceConfig = () => {
  const [generatingKey, setGeneratingKey] = React.useState(false);

  const handleGenerateApiKey = async () => {
    const modelName = form.getFieldValue('name');
    if (!modelName) {
      message.warning(
        intl.formatMessage({ id: 'models.table.name' }) +
          ' ' +
          intl.formatMessage({
            id: 'common.tips.required',
            defaultMessage: 'is required'
          })
      );
      return;
    }
    try {
      setGeneratingKey(true);
      const res = await createApisKey({
        data: {
          // eslint-disable-next-line react-hooks/purity
          name: `${modelName}-backend-key-${Math.random().toString(36).substring(2, 6)}`,
          allowed_model_names: [modelName],
          scope: ['inference']
        } as any
      });
      if (res && res.value) {
        form.setFieldValue('backend_api_key', res.value);
        message.success('Success');
        Modal.success({
          title: intl.formatMessage({
            id: 'models.form.backend_api_key.generate.success.title',
            defaultMessage: 'API Key Generated'
          }),
          content: (
            <div>
              <p>
                {intl.formatMessage({
                  id: 'models.form.backend_api_key.generate.success.desc',
                  defaultMessage:
                    'Please copy your API key now. You will not be able to see it again.'
                })}
              </p>
              <div
                style={{
                  marginTop: 16,
                  padding: '8px 12px',
                  background: '#f5f5f5',
                  borderRadius: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography.Text
                  copyable
                  style={{ margin: 0, wordBreak: 'break-all', paddingRight: 8 }}
                >
                  {res.value}
                </Typography.Text>
              </div>
            </div>
          ),
          width: 500
        });
        onValuesChange?.({}, form.getFieldsValue());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingKey(false);
    }
  };

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

  // Anthropic Messages is a chat surface, so the declaration only means
  // something on a backend that has one. vox-box serves /v1/audio/* and nothing
  // else, which is a fact about what it is rather than about which build is
  // running — the one exclusion that cannot go stale.
  //
  // Everything else stays, llama-box included: upstream llama.cpp serves
  // /v1/messages as of ggml-org/llama.cpp#17570, so whether a given build
  // answers it is a property of the image. That is the whole reason this is
  // declared by whoever deploys instead of derived here.
  const servesChatCompletions = backend !== backendOptionsMap.voxBox;

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
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          width: '100%'
        }}
      >
        <Form.Item name="backend_api_key" style={{ flex: 1 }}>
          <CInput.Password
            autoComplete="new-password"
            label={intl.formatMessage({ id: 'models.form.backend_api_key' })}
            description={intl.formatMessage({
              id: 'models.form.backend_api_key.tips'
            })}
          />
        </Form.Item>
        <Button
          type="primary"
          loading={generatingKey}
          onClick={handleGenerateApiKey}
          style={{ height: '54px' }}
        >
          {intl.formatMessage({ id: 'models.form.backend_api_key.generate' })}
        </Button>
      </div>

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
      {servesChatCompletions && (
        <Form.Item<FormData>
          name="native_anthropic_api"
          valuePropName="checked"
          style={{ marginBottom: 8 }}
        >
          <CheckboxField
            description={intl.formatMessage({
              id: 'models.form.nativeAnthropicApi.tips'
            })}
            label={intl.formatMessage({
              id: 'models.form.nativeAnthropicApi'
            })}
          ></CheckboxField>
        </Form.Item>
      )}
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
