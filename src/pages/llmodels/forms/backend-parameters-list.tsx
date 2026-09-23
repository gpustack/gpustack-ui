import { ListInput } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import { backendParamsHolderTips, getBackendParamsTips } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import BackendParameters, {
  backendOptionsMap
} from '../constants/backend-parameters';

interface BackendParametersListProps {
  /**
   * Renders the same field at a nested Form path (e.g. `['roles', 0]`).
   * Absent means the model-level path, byte-for-byte what it was.
   */
  namePrefix?: (string | number)[];
}

const BackendParametersList: React.FC<BackendParametersListProps> = ({
  namePrefix
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

  const backendParamsTips = useMemo(() => {
    return getBackendParamsTips(backend);
  }, [backend]);

  const paramsConfig = useMemo(() => {
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
  }, [backend, flatBackendOptions]);

  const handleBackendParametersOnBlur = () => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleDeleteBackendParameters = (index: number) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  return (
    <Form.Item<FormData> name={path('backend_parameters')}>
      <ListInput
        trim={false}
        placeholder={
          backendParamsHolderTips[backend]
            ? intl.formatMessage({
                id: backendParamsHolderTips[backend].holder
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
        description={
          backendParamsTips.link && (
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
                      link: backendParamsTips.link
                    }
                  )
                }}
              ></span>
            </span>
          )
        }
      ></ListInput>
    </Form.Item>
  );
};

export default BackendParametersList;
