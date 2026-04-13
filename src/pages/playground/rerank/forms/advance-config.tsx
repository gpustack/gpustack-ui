import { InputNumber as CInputNumber } from '@gpustack/core-ui';
import { Form } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useFormContext } from '../../config/form-context';

const AdvanceConfig: React.FC = () => {
  const { meta: modelMeta } = useFormContext();

  return (
    <>
      {modelMeta?.n_ctx && modelMeta?.n_slot && (
        <Form.Item name="max_tokens">
          <CInputNumber
            disabled
            label="Max Tokens"
            value={_.floor(_.divide(modelMeta?.n_ctx, modelMeta?.n_slot))}
          ></CInputNumber>
        </Form.Item>
      )}
    </>
  );
};

export default AdvanceConfig;
