import SealInputNumber from '@/components/seal-form/input-number';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useMemo } from 'react';
import { DatasetValueMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const RandomSettingsForm: React.FC<{
  datasetList: Global.BaseOption<number | string>[];
}> = (props) => {
  const { datasetList } = props;
  const intl = useIntl();
  const { action, open } = useFormContext();
  const form = Form.useFormInstance();
  const profile = Form.useWatch('profile', form);
  const datasetName = Form.useWatch('dataset_name', form);
  const { getRuleMessage } = useAppUtils();

  const disabled = useMemo(() => {
    return (
      (profile !== 'Custom' && Boolean(profile)) || action === PageAction.EDIT
    );
  }, [profile, action]);

  return (
    <>
      <Form.Item<FormData>
        name="dataset_name"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'benchmark.table.dataset')
          }
        ]}
      >
        <SealSelect
          disabled={disabled}
          options={datasetList?.map((item) => ({
            ...item,
            label: item.label,
            value: item.label
          }))}
          label={intl.formatMessage({ id: 'benchmark.table.dataset' })}
          required
        ></SealSelect>
      </Form.Item>
      {datasetName === DatasetValueMap.Random && (
        <>
          <Form.Item<FormData>
            name="dataset_input_tokens"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'benchmark.table.inputTokenLength'
                )
              }
            ]}
          >
            <SealInputNumber
              min={0}
              disabled={disabled}
              label={intl.formatMessage({
                id: 'benchmark.table.inputTokenLength'
              })}
              required
            ></SealInputNumber>
          </Form.Item>
          <Form.Item<FormData>
            name="dataset_output_tokens"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'benchmark.table.outputTokenLength'
                )
              }
            ]}
          >
            <SealInputNumber
              min={0}
              disabled={disabled}
              label={intl.formatMessage({
                id: 'benchmark.table.outputTokenLength'
              })}
              required
            ></SealInputNumber>
          </Form.Item>
          <Form.Item<FormData>
            name="dataset_seed"
            getValueProps={(value) => ({ value: value || null })}
          >
            <SealInputNumber
              min={0}
              disabled={disabled}
              label={intl.formatMessage({ id: 'playground.image.params.seed' })}
            ></SealInputNumber>
          </Form.Item>
        </>
      )}
      <Form.Item<FormData>
        name="request_rate"
        getValueProps={(value) => ({ value: value < 0 ? 'Infinity' : value })}
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'benchmark.table.requestRate')
          }
        ]}
      >
        <SealInputNumber
          disabled={disabled}
          label={intl.formatMessage({ id: 'benchmark.table.requestRate' })}
          required
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="total_requests"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'benchmark.form.totalRequests')
          }
        ]}
      >
        <SealInputNumber
          min={0}
          disabled={disabled}
          label={intl.formatMessage({ id: 'benchmark.form.totalRequests' })}
          required
        ></SealInputNumber>
      </Form.Item>
    </>
  );
};

export default RandomSettingsForm;
