import SealAutoComplete from '@/components/seal-form/auto-complete';
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

const LocalPathForm: React.FC = () => {
  const form = Form.useFormInstance();
  const formCtx = useFormContext();
  const formInnerCtx = useFormInnerContext();
  const source = Form.useWatch('source', form);
  const { onBackendChange } = formInnerCtx;
  const { modelFileOptions, byBuiltIn } = formCtx;
  const { getRuleMessage } = useAppUtils();
  const intl = useIntl();
  const localPathCache = useRef<string>(form.getFieldValue('local_path'));

  if (![modelSourceMap.local_path_value].includes(source) || byBuiltIn) {
    return null;
  }

  const handleLocalPathBlur = (e: any) => {
    const value = e.target.value;
    if (value === localPathCache.current && value) {
      return;
    }
    const isEndwithGGUF = _.endsWith(value, '.gguf');
    const isBlobFile = value.split('/').pop().includes('sha256');
    let backend = backendOptionsMap.llamaBox;
    if (!isEndwithGGUF && !isBlobFile) {
      backend = backendOptionsMap.vllm;
    }
    form.setFieldValue('backend', backend);

    onBackendChange?.(backend);
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
        <SealAutoComplete
          allowClear
          required
          filterOption
          defaultActiveFirstOption
          options={modelFileOptions}
          onBlur={handleLocalPathBlur}
          onFocus={handleOnFocus}
          label={intl.formatMessage({ id: 'models.form.filePath' })}
          description={<TooltipList list={localPathTipsList}></TooltipList>}
        ></SealAutoComplete>
      </Form.Item>
    </>
  );
};

export default LocalPathForm;
