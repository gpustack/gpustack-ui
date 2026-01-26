import { useQueryData } from '@/hooks/use-query-data-list';
import _ from 'lodash';
import { useState } from 'react';
import { queryProfiles } from '../apis';
import { ProfileOption } from '../config/types';

export default function useQueryProfiles() {
  const { detailData, loading, cancelRequest, fetchData } = useQueryData<{
    profiles: ProfileOption[];
  }>({
    fetchDetail: queryProfiles,
    key: 'profiles'
  });
  const [profilesOptions, setProfilesOptions] = useState<
    {
      label: string;
      value: string;
      config: Partial<ProfileOption>;
    }[]
  >([]);

  const fetchProfilesData = async () => {
    const res = await fetchData({});
    const list =
      res?.profiles?.map((item) => {
        return {
          label: item.name,
          value: item.name,
          config: {
            ..._.omit(item, 'name')
          }
        };
      }) || [];

    setProfilesOptions([
      ...list,
      {
        label: 'Custom',
        value: 'Custom',
        config: {
          dataset_name: '',
          dataset_prompt_tokens: null,
          dataset_output_tokens: null,
          request_rate: null,
          total_requests: null
        }
      }
    ]);
  };

  return {
    profilesOptions,
    loading,
    cancelRequest,
    fetchProfilesData
  };
}
