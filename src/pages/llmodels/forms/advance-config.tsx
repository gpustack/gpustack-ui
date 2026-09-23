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

/**
 * @param pdActive Whether PD is on. When it is, this card drops its
 *   model-level backend parameters and env: every role carries its own pair,
 *   so keeping these here showed the same two controls twice and the role
 *   card's "Same as model" pointed back at a copy nobody should be filling.
 *   The values are cleared by the mount site (`clearModelParams`), not just
 *   hidden — see the effect's declaration for why.
 */
const AdvanceConfig = ({ pdActive }: { pdActive?: boolean } = {}) => {
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
      {!pdActive && (
        <>
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
          {/* ⏳ Not «one value lands on every role» — that was the earlier
              reading, and it was too generous. LoRA under PD does not work at
              all: the router indexes its worker registry by SERVED-MODEL name
              while the members register under the base name only, so every
              request addressed to `<base>:<adapter>` comes back 503 «No
              available workers» while the group reports running, the route
              reports `ready_targets=1` and nothing anywhere degrades. Round-4
              E2E reproduced it 3/3 with per-hop evidence; the same adapter on
              the same worker without PD answers 200.

              So the entry is withdrawn while PD is on rather than annotated.
              The value is cleared too (`clearModelLora`), not merely hidden —
              the backend refuses the combination at admission, and a 400 about
              a field the user can no longer see is the worst of both. Bringing
              it back needs F18 answered and the router's membership
              registration to carry the adapter names. */}
          <ModelLoraList></ModelLoraList>
        </>
      )}
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
