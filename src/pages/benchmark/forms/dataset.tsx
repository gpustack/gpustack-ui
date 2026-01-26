import AutoComplete from '@/components/seal-form/auto-complete';
import SealInputNumber from '@/components/seal-form/input-number';
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

const profileFields = [
  'dataset_prompt_tokens',
  'dataset_output_tokens',
  'request_rate',
  'total_requests'
];

const DatasetForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { action, open } = useFormContext();
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
  const profileConfigCache = React.useRef<{ [key: string]: any }>({});

  const handleOnDataSetChange = (value: any, option: any) => {
    if (value === 'Custom') {
      form.setFieldsValue({
        profile: ProfileValueMap.Custom,
        dataset_id: null,
        dataset_prompt_tokens: null,
        dataset_output_tokens: null,
        request_rate: null,
        total_requests: null
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

  const setCustomProfileValues = () => {
    form.setFieldsValue({
      dataset_name: 'Custom',
      dataset_id: null,
      dataset_prompt_tokens: null,
      dataset_output_tokens: null,
      request_rate: null,
      total_requests: null
    });
  };

  const handleProfileChange = (value: string, option: any) => {
    if (value === ProfileValueMap.Custom) {
      setCustomProfileValues();
      profileConfigCache.current = {};
    } else {
      const dataset_id = datasetList.find(
        (item) => item.label === option.config?.dataset_name
      )?.value;

      form.setFieldsValue({
        dataset_id: dataset_id,
        ..._.omit(option?.config, ['description', 'dataset_source'])
      });

      profileConfigCache.current = {
        profile: value,
        config: {
          dataset_id: dataset_id,
          ..._.omit(option?.config, ['description', 'dataset_source'])
        }
      };
    }
  };

  const handleOnProfileConfigChange = async () => {
    const values = form.getFieldsValue(profileFields);
    if (
      _.isEqual(values, {
        ..._.pick(profileConfigCache.current.config, profileFields)
      })
    ) {
      form.setFieldsValue({
        profile: profileConfigCache.current.profile,
        ...profileConfigCache.current.config
      });
      return;
    }

    form.setFieldsValue({
      profile: 'Custom',
      dataset_name: 'Custom'
    });
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
      <RandomSettingsForm
        onValueChange={handleOnProfileConfigChange}
      ></RandomSettingsForm>
      <Form.Item<FormData>
        name="request_rate"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'benchmark.table.requestRate')
          }
        ]}
      >
        <SealInputNumber
          min={0}
          onChange={handleOnProfileConfigChange}
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
          onChange={handleOnProfileConfigChange}
          label={intl.formatMessage({ id: 'benchmark.form.totalRequests' })}
          required
        ></SealInputNumber>
      </Form.Item>
    </>
  );
};

export default DatasetForm;
