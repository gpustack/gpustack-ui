import SealInput from '@/components/seal-form/seal-input';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { useRef } from 'react';
import {
  backendOptionsMap,
  localPathTipsList,
  modelSourceMap
} from '../config';
import { useFormContext, useFormInnerContext } from '../config/form-context';
import { FormData } from '../config/types';
import { checkOnlyAscendNPU } from '../hooks';

const LocalPathForm: React.FC = () => {
  const form = Form.useFormInstance();
  const formCtx = useFormContext();
  const formInnerCtx = useFormInnerContext();
  const source = Form.useWatch('source', form);
  const { onBackendChange, onValuesChange, gpuOptions } = formInnerCtx;
  const { byBuiltIn } = formCtx;
  const { getRuleMessage } = useAppUtils();
  const intl = useIntl();
  const localPathCache = useRef<string>(form.getFieldValue('local_path') || '');

  if (![modelSourceMap.local_path_value].includes(source) || byBuiltIn) {
    return null;
  }

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
      onBackendChange?.(backend);
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
          onBlur={handleLocalPathBlur}
          onFocus={handleOnFocus}
          label={intl.formatMessage({ id: 'models.form.filePath' })}
          description={<TooltipList list={localPathTipsList}></TooltipList>}
        ></SealInput.Input>
      </Form.Item>
    </>
  );
};

export default LocalPathForm;
