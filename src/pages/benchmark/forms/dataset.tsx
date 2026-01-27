import AutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { ProfileValueMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import useQueryDataset from '../services/use-query-dataset';
import useQueryProfiles from '../services/use-query-profiles';
import RandomSettingsForm from './random-settings';

const DatasetForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { action, open } = useFormContext();
  const profile = Form.useWatch('profile', form);
  const {
    datasetList,
    loading: datasetLoading,
    fetchDatasetData,
    cancelRequest: cancelDatasetRequest
  } = useQueryDataset();
  const {
    profilesOptions,
    fetchProfilesData,
    cancelRequest: cancelProfilesRequest
  } = useQueryProfiles();

  const handleOnDataSetChange = (value: any, option: any) => {
    if (value === 'Custom') {
      form.setFieldsValue({
        profile: ProfileValueMap.Custom,
        dataset_id: null
      });
    } else {
      form.setFieldsValue({
        profile: ProfileValueMap.Custom,
        dataset_id: option?.data?.id,
        dataset_prompt_tokens: option?.prompt_tokens,
        dataset_output_tokens: option?.output_tokens,
        request_rate: null,
        total_requests: null
      });
    }
  };

  const handleProfileChange = (value: string, option: any) => {
    if (value === ProfileValueMap.Custom) {
      form.setFieldsValue({
        dataset_name: 'Custom',
        dataset_id: null
      });
    } else {
      const dataset_id = datasetList.find(
        (item) => item.label === option.config?.dataset_name
      )?.value;

      form.setFieldsValue({
        dataset_id: dataset_id,
        ..._.omit(option?.config, ['description', 'dataset_source'])
      });
    }
  };

  useEffect(() => {
    if (!open) {
      cancelDatasetRequest();
      cancelProfilesRequest();
    }
    if (open) {
      fetchProfilesData();
      fetchDatasetData();
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
          onChange={handleProfileChange}
          options={profilesOptions}
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
        <AutoComplete
          options={datasetList.map((item) => ({
            ...item,
            label: item.label,
            value: item.label
          }))}
          loading={datasetLoading}
          onChange={handleOnDataSetChange}
          label={intl.formatMessage({ id: 'benchmark.table.dataset' })}
          required
        ></AutoComplete>
      </Form.Item>
      <Form.Item<FormData> hidden name="dataset_id">
        <SealInput.Input></SealInput.Input>
      </Form.Item>
      {profile === 'Custom' && <RandomSettingsForm></RandomSettingsForm>}
    </>
  );
};

export default DatasetForm;
