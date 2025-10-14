import IconFont from '@/components/icon-font';
import AutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form, Typography } from 'antd';
import React, { useMemo } from 'react';
import {
  backendLabelMap,
  backendTipsList,
  getBackendParamsTips
} from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const BackendFields: React.FC = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const {
    isGGUF,
    formKey,
    pageAction: action,
    source,
    gpuOptions,
    onValuesChange,
    backendOptions,
    onBackendChange
  } = useFormContext();
  const backend = Form.useWatch('backend', form);

  const handleBackendVersionOnBlur = () => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const backendParamsTips = useMemo(() => {
    return getBackendParamsTips(backend);
  }, [backend]);

  const backendVersions = useMemo(() => {
    if (!backend || backend === backendOptionsMap.custom) {
      return [];
    }
    return (
      backendOptions.find((item) => item.value === backend)?.versions || []
    );
  }, [backend]);

  return (
    <>
      <Form.Item
        name="backend"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'models.form.backend')
          }
        ]}
      >
        <SealSelect
          required
          onChange={onBackendChange}
          label={intl.formatMessage({ id: 'models.form.backend' })}
          description={<TooltipList list={backendTipsList}></TooltipList>}
          options={backendOptions}
        ></SealSelect>
      </Form.Item>
      {backendOptionsMap.custom !== backend && (
        <Form.Item name="backend_version">
          <AutoComplete
            options={backendVersions}
            placeholder="enter or select a version"
            onBlur={handleBackendVersionOnBlur}
            label={intl.formatMessage({ id: 'models.form.backendVersion' })}
            description={intl.formatMessage(
              {
                id: 'models.form.backendVersion.tips'
              },
              {
                backend: backendLabelMap[backend],
                version: backendParamsTips?.version
                  ? `(${intl.formatMessage({ id: 'common.help.eg' })} ${backendParamsTips?.version})`
                  : '',
                link: backendParamsTips?.releases && (
                  <span
                    style={{
                      marginLeft: 5
                    }}
                  >
                    <Typography.Link
                      className="flex-center"
                      style={{ display: 'inline' }}
                      href={backendParamsTips?.releases}
                      target="_blank"
                    >
                      <span>
                        {intl.formatMessage({ id: 'models.form.releases' })}
                      </span>
                      <IconFont
                        type="icon-external-link"
                        className="font-size-14 m-l-4"
                      ></IconFont>
                    </Typography.Link>
                  </span>
                )
              }
            )}
          ></AutoComplete>
        </Form.Item>
      )}
      {backend === backendOptionsMap.custom && (
        <>
          <Form.Item<FormData>
            name="image_name"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'backend.imageName')
              }
            ]}
          >
            <SealInput.Input
              required
              allowClear
              scaleSize={true}
              label={intl.formatMessage({ id: 'backend.imageName' })}
            ></SealInput.Input>
          </Form.Item>
          <Form.Item<FormData>
            name="run_command"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'backend.runCommand')
              }
            ]}
          >
            <SealInput.TextArea
              required
              scaleSize={true}
              allowClear
              label={intl.formatMessage({ id: 'backend.runCommand' })}
            ></SealInput.TextArea>
          </Form.Item>
        </>
      )}
    </>
  );
};

export default BackendFields;
