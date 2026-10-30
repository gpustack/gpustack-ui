import { getDocumentationUrl } from '@/utils/documentation';
import { AutoComplete, ListInput } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import { backendParamsHolderTips, getBackendParamsTips } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData, PDMode } from '../config/types';
import BackendParameters, {
  backendOptionsMap
} from '../constants/backend-parameters';
import { getRouterParameterConfig } from '../constants/backend-parameters/router';
import {
  conflictingExternalLBParameters,
  hasConflictingExternalLB
} from '../constants/backend-parameters/vllm';

// ListInput owns adding, removing and pasting rows; each input owns its status.
const ParameterInput = ({
  data,
  handlers,
  options,
  placeholder,
  invalid
}: {
  data: { value: string };
  handlers: {
    onChange: (value: string) => void;
    onBlur?: (event: any) => void;
    onPaste?: (event: any) => void;
  };
  options: Global.HintOptions[];
  placeholder: string;
  invalid: boolean;
}) => {
  const [context, setContext] = useState('');
  const match = context.match(/[^=]+=[^=]*$/);
  const [key, value] = match ? match[0].split('=') : [];
  const hints = !context
    ? options
    : match
      ? (options.find((item) => item.label === key)?.opts || []).filter(
          (item) => String(item.label).includes(value)
        )
      : options.filter((item) => item.label.includes(context));
  const updateContext = (event: any) =>
    setContext(event.target.value.slice(0, event.target.selectionStart));
  return (
    <Form.Item noStyle validateStatus={invalid ? 'error' : ''}>
      <AutoComplete
        value={data.value}
        trim={false}
        placeholder={placeholder}
        options={hints}
        defaultActiveFirstOption
        onFocus={updateContext}
        onInput={(event: any) => {
          updateContext(event);
          handlers.onChange(event.target.value);
        }}
        onSelect={(selected: string) =>
          handlers.onChange(match ? `${key}=${selected}` : selected.trim())
        }
        onBlur={handlers.onBlur}
        onPaste={handlers.onPaste}
        style={{ flex: 1, minWidth: 0 }}
      />
    </Form.Item>
  );
};

interface BackendParametersListProps {
  /**
   * Renders the same field at a nested Form path (e.g. `['roles', 0]`).
   * Absent means the model-level path, byte-for-byte what it was.
   */
  namePrefix?: (string | number)[];
  /** Undefined selects engine hints; null identifies a router without a recipe. */
  router?: PDMode['router'];
}

const BackendParametersList: React.FC<BackendParametersListProps> = ({
  namePrefix,
  router
}) => {
  const intl = useIntl();
  const { onValuesChange, flatBackendOptions } = useFormContext();
  const form = Form.useFormInstance();
  const path = (...field: (string | number)[]) =>
    namePrefix ? [...namePrefix, ...field] : field;
  // The engine is context here, not this section's own field: it only picks
  // which parameter catalog to offer. A role that overrides its parameters
  // without overriding its engine has no `backend` of its own, and it is the
  // model's engine it will actually run — so fall back to it, otherwise the
  // role's list would offer no suggestions at all. Without a prefix both
  // watches read the same field and the fallback is a no-op.
  const roleBackend = Form.useWatch(path('backend'), form);
  const modelBackend = Form.useWatch('backend', form);
  const backend = roleBackend ?? modelBackend;
  const parameters = Form.useWatch(path('backend_parameters'), form);
  const conflicts =
    router === undefined && backend === backendOptionsMap.vllm
      ? conflictingExternalLBParameters(parameters)
      : [];

  const routerConfig = useMemo(
    () => (router === undefined ? undefined : getRouterParameterConfig(router)),
    [router]
  );

  const backendParamsTips = useMemo(() => {
    return routerConfig ?? getBackendParamsTips(backend);
  }, [backend, routerConfig]);
  const backendParamsLink =
    'documentationPath' in backendParamsTips
      ? getDocumentationUrl(backendParamsTips.documentationPath, intl.locale)
      : backendParamsTips.link;
  const holder =
    routerConfig?.holder ?? backendParamsHolderTips[backend]?.holder;

  const paramsConfig = useMemo(() => {
    if (routerConfig) {
      return routerConfig.options;
    }
    const builtIn = _.get(BackendParameters, backend, []) as Array<{
      label: string;
      value: string;
      opts?: { label: any; value: any }[];
    }>;
    const selected = flatBackendOptions?.find((o) => o.value === backend);
    const extra = (selected?.common_parameters || []).map((v) => ({
      label: v,
      value: v
    }));
    return _.uniqBy([...extra, ...builtIn], 'value');
  }, [backend, flatBackendOptions, routerConfig]);

  const handleBackendParametersOnBlur = () => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleDeleteBackendParameters = (index: number) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  return (
    <Form.Item<FormData>
      name={path('backend_parameters')}
      rules={[
        {
          validator: async (_, value) => {
            if (
              router === undefined &&
              backend === backendOptionsMap.vllm &&
              hasConflictingExternalLB(value)
            )
              throw new Error(
                intl.formatMessage({ id: 'models.form.external.conflict' })
              );
          }
        }
      ]}
    >
      <ListInput
        trim={false}
        placeholder={
          holder
            ? intl.formatMessage({
                id: holder
              })
            : ''
        }
        btnText={intl.formatMessage({ id: 'common.button.addParams' })}
        label={intl.formatMessage({
          id: 'models.form.backend_parameters'
        })}
        onBlur={handleBackendParametersOnBlur}
        onDelete={handleDeleteBackendParameters}
        options={paramsConfig}
        renderItem={(data, handlers) => (
          <ParameterInput
            data={data}
            handlers={handlers}
            options={paramsConfig}
            placeholder={holder ? intl.formatMessage({ id: holder }) : ''}
            invalid={conflicts.includes(data.value)}
          />
        )}
        description={
          backendParamsLink && (
            <span>
              <span
                style={{
                  marginLeft: backend === backendOptionsMap.ascendMindie ? 4 : 0
                }}
                dangerouslySetInnerHTML={{
                  __html: intl.formatMessage(
                    { id: 'models.form.backend_parameters.vllm.tips' },
                    {
                      backend: backendParamsTips.backend || '',
                      link: backendParamsLink
                    }
                  )
                }}
              />
            </span>
          )
        }
      ></ListInput>
    </Form.Item>
  );
};

export default BackendParametersList;
