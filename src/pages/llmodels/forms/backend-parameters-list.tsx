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

const BackendParametersList: React.FC = () => {
  const intl = useIntl();
  const { onValuesChange, flatBackendOptions } = useFormContext();
  const form = Form.useFormInstance();
  const backend = Form.useWatch('backend', form);

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
    <Form.Item<FormData> name="backend_parameters">
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
