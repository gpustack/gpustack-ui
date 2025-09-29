import IconFont from '@/components/icon-font';
import ListInput from '@/components/list-input';
import { useIntl } from '@umijs/max';
import { Form, Typography } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import { backendParamsHolderTips, getBackendParamsTips } from '../config';
import BackendParameters, {
  backendOptionsMap
} from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const BackendParametersList: React.FC = () => {
  const intl = useIntl();
  const { onValuesChange } = useFormContext();
  const form = Form.useFormInstance();
  const backend = Form.useWatch('backend', form);

  const backendParamsTips = useMemo(() => {
    return getBackendParamsTips(backend);
  }, [backend]);

  const paramsConfig = useMemo(() => {
    return _.get(BackendParameters, backend, []);
  }, [backend]);

  const handleBackendParametersChange = (list: string[]) => {
    form.setFieldValue('backend_parameters', list);
  };

  const handleBackendParametersOnBlur = () => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleDeleteBackendParameters = (index: number) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  return (
    <Form.Item<FormData> name="backend_parameters">
      <ListInput
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
        dataList={form.getFieldValue('backend_parameters') || []}
        onChange={handleBackendParametersChange}
        onBlur={handleBackendParametersOnBlur}
        onDelete={handleDeleteBackendParameters}
        options={paramsConfig}
        description={
          backendParamsTips.link && (
            <span>
              {backend === backendOptionsMap.ascendMindie && (
                <span>
                  {intl.formatMessage({ id: 'models.backend.mindie.310p' })}
                </span>
              )}
              <span style={{ marginLeft: 5 }}>
                {intl.formatMessage(
                  { id: 'models.form.backend_parameters.vllm.tips' },
                  { backend: backendParamsTips.backend || '' }
                )}{' '}
                <Typography.Link
                  style={{ display: 'inline' }}
                  className="flex-center"
                  href={backendParamsTips.link}
                  target="_blank"
                >
                  <span>{intl.formatMessage({ id: 'common.text.here' })}</span>
                  <IconFont
                    type="icon-external-link"
                    className="font-size-14 m-l-4"
                  ></IconFont>
                </Typography.Link>
              </span>
            </span>
          )
        }
      ></ListInput>
    </Form.Item>
  );
};

export default BackendParametersList;
