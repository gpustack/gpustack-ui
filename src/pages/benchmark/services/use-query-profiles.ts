import { useQueryData } from '@/hooks/use-query-data-list';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import { useState } from 'react';
import { queryProfiles } from '../apis';
import { profileOptions } from '../config';
import { ProfileOption } from '../config/types';

export default function useQueryProfiles() {
  const { detailData, loading, cancelRequest, fetchData } = useQueryData<{
    profiles: ProfileOption[];
  }>({
    fetchDetail: queryProfiles,
    key: 'profiles'
  });
  const intl = useIntl();
  const [profilesOptions, setProfilesOptions] = useState<
    {
      label: string;
      value: string;
      config: Partial<ProfileOption>;
    }[]
  >([]);

  const fetchProfilesData = async () => {
    const res = await fetchData({});
    const profileMap = profileOptions.reduce((map, obj) => {
      map.set(obj.value, obj);
      return map;
    }, new Map<string, any>());

    const list =
      res?.profiles?.map((item) => {
        const label = profileMap.get(item.name)?.label;
        return {
          label: label ? intl.formatMessage({ id: label }) : item.name,
          tips: profileMap.get(item.name)?.tips || '',
          value: item.name,
          config: {
            ..._.omit(item, 'name')
          }
        };
      }) || [];

    const options = [
      ...list,
      {
        label: intl.formatMessage({ id: 'backend.custom' }),
        tips: '',
        value: 'Custom',
        config: {
          dataset_name: '',
          dataset_input_tokens: null,
          dataset_output_tokens: null,
          request_rate: null,
          total_requests: null
        }
      }
    ];
    console.log('options===', options);
    setProfilesOptions(options);
    return options;
  };

  return {
    profilesOptions,
    loading,
    cancelRequest,
    fetchProfilesData
  };
}
