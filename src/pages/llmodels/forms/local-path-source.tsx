import SealInput from '@/components/seal-form/seal-input';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { useRef } from 'react';
import { DeployFormKeyMap, localPathTipsList, modelSourceMap } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import useCheckBackend from '../hooks/use-check-backend';

const LocalPathForm: React.FC = () => {
  const { checkOnlyAscendNPU } = useCheckBackend();
  const form = Form.useFormInstance();
  const source = Form.useWatch('source', form);
  const {
    formKey,
    gpuOptions,
    flatBackendOptions,
    onValuesChange,
    onBackendChange
  } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const intl = useIntl();
  const localPathCache = useRef<string>(form.getFieldValue('local_path') || '');

  if (
    ![modelSourceMap.local_path_value].includes(source) ||
    formKey === DeployFormKeyMap.CATALOG
  ) {
    return null;
  }

  const handleOnBlur = (e: any) => {
    const value = e.target.value;
    onValuesChange?.({ local_path: value }, form.getFieldsValue());
  };

  const handleLocalPathBlur = async (e: any) => {
    const value = e.target.value;
    if (value === localPathCache.current || !value) {
      return;
    }
    const isEndwithGGUF = _.endsWith(value, '.gguf');
    const isBlobFile = value.split('/').pop().includes('sha256');
    let backend = form.getFieldValue('backend');
    const oldBackend = backend;

    if (isEndwithGGUF || isBlobFile) {
      backend = backendOptionsMap.llamaBox;
    } else if (
      !isEndwithGGUF &&
      !isBlobFile &&
      backend === backendOptionsMap.llamaBox
    ) {
      backend = checkOnlyAscendNPU(gpuOptions || [])
        ? backendOptionsMap.ascendMindie
        : backendOptionsMap.vllm;
    }
    form.setFieldValue('backend', backend);

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 0);
    });

    if (oldBackend !== backend) {
      const option = flatBackendOptions.find((item) => item.value === backend);
      onBackendChange?.(backend, option);
    } else {
      onValuesChange?.({ local_path: value }, form.getFieldsValue());
    }
  };

  const handleOnFocus = () => {
    localPathCache.current = form.getFieldValue('local_path');
  };

  return (
    <>
      <Form.Item<FormData>
        name="local_path"
        key="local_path"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'models.form.filePath')
          }
        ]}
      >
        <SealInput.Input
          allowClear
          required
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          label={intl.formatMessage({ id: 'models.form.filePath' })}
          description={<TooltipList list={localPathTipsList}></TooltipList>}
        ></SealInput.Input>
      </Form.Item>
    </>
  );
};

export default LocalPathForm;
