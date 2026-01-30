import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
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

  const handleProfileChange = (value: string, option: any) => {
    if (value !== ProfileValueMap.Custom) {
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
          disabled={action === PageAction.EDIT}
          onChange={handleProfileChange}
          options={profilesOptions}
          label={intl.formatMessage({ id: 'benchmark.form.profile' })}
          required
        ></SealSelect>
      </Form.Item>

      <RandomSettingsForm
        datasetList={datasetList}
        datasetLoading={datasetLoading}
      ></RandomSettingsForm>
    </>
  );
};

export default DatasetForm;
