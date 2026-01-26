import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import { profileOptions } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import useQueryDataset from '../services/use-query-dataset';
import RandomSettingsForm from './random-settings';

const DatasetForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { action, open } = useFormContext();
  const {
    dataList: datasetList,
    loading: datasetLoading,
    fetchData,
    cancelRequest: cancelDatasetRequest
  } = useQueryDataset();

  const handleOnDataSetChange = (value: any, option: any) => {
    form.setFieldValue('dataset_id', option?.data?.id);
  };

  const handleOnDatasetOpenChange = async (open: boolean) => {
    if (!datasetList.length && open) {
      await fetchData({ page: -1 });
    }
  };

  useEffect(() => {
    if (!open) {
      cancelDatasetRequest();
    }
  }, [open]);

  return (
    <>
      <Form.Item<FormData>
        data-field="profile"
        name="profile"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'benchmark.form.profile')
          }
        ]}
      >
        <SealSelect
          options={profileOptions}
          label={intl.formatMessage({ id: 'benchmark.form.profile' })}
          required
        ></SealSelect>
      </Form.Item>
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
          options={datasetList.map((item) => ({
            label: item.name,
            value: item.name
          }))}
          loading={datasetLoading}
          onChange={handleOnDataSetChange}
          onOpenChange={handleOnDatasetOpenChange}
          label={intl.formatMessage({ id: 'benchmark.table.dataset' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData> hidden name="dataset_id">
        <SealInput.Input></SealInput.Input>
      </Form.Item>
      <RandomSettingsForm></RandomSettingsForm>
      <Form.Item<FormData>
        name="request_rate"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'benchmark.table.requestRate')
          }
        ]}
      >
        <SealSelect
          options={[]}
          label={intl.formatMessage({ id: 'benchmark.table.requestRate' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="total_requests"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'benchmark.form.totalRequests')
          }
        ]}
      >
        <SealSelect
          options={[]}
          label={intl.formatMessage({ id: 'benchmark.form.totalRequests' })}
          required
        ></SealSelect>
      </Form.Item>
    </>
  );
};

export default DatasetForm;
