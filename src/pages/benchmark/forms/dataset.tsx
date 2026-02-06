import AutoTooltip from '@/components/auto-tooltip';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form, Select } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { ProfileValueMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import RandomSettingsForm from './random-settings';

const DatasetForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { action, open, profilesOptions, datasetList } = useFormContext();

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

  // Initialize profile when open form
  const initProfile = (
    value: string,
    option: any,
    datasetList: Global.BaseOption<number | string>[]
  ) => {
    if (value !== ProfileValueMap.Custom) {
      const dataset_id = datasetList.find(
        (item) => item.label === option.config?.dataset_name
      )?.value;

      form.setFieldsValue({
        profile: value,
        dataset_id: dataset_id,
        ..._.omit(option?.config, ['description', 'dataset_source'])
      });
    }
  };

  useEffect(() => {
    if (open && action === PageAction.CREATE) {
      const init = async () => {
        if (!profilesOptions || profilesOptions.length === 0) return;

        const throughputProfile = profilesOptions.find(
          (item) => item.value === ProfileValueMap.ThroughputMedium
        );
        if (throughputProfile) {
          initProfile(throughputProfile.value, throughputProfile, datasetList);
        }
      };
      init();
    }
  }, [open, action, profilesOptions, datasetList]);

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
          label={intl.formatMessage({ id: 'benchmark.form.profile' })}
          required
        >
          {profilesOptions?.map((item: any) => (
            <Select.Option
              key={item.value}
              value={item.value}
              label={item.label}
              config={item.config}
            >
              <AutoTooltip
                ghost
                showTitle={!!item.tips}
                title={
                  item?.tips
                    ? intl.formatMessage({ id: item?.tips || '' })
                    : false
                }
              >
                {item?.label}
              </AutoTooltip>
            </Select.Option>
          ))}
        </SealSelect>
      </Form.Item>

      <RandomSettingsForm datasetList={datasetList}></RandomSettingsForm>
    </>
  );
};

export default DatasetForm;
