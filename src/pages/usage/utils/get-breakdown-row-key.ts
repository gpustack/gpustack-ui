import { BreakdownItem } from '../config/types';

export const getBreakdownRowKey = (record: BreakdownItem): string => {
  const identity = record?.identity;
  const current = identity?.current;
  const value = identity?.value;

  const key = [
    current?.model_id,
    current?.user_id,
    current?.api_key_id,
    value?.model_name,
    value?.user_name,
    value?.api_key_name,
    value?.cluster_name,
    value?.provider_name,
    value?.provider_type,
    record?.label,
    record?.cluster_name,
    record?.model_name,
    record?.user_name,
    record?.api_key_name,
    record?.last_active,
    record?.input_tokens,
    record?.output_tokens,
    record?.total_tokens,
    record?.api_requests
  ]
    .filter((item) => item !== null && item !== undefined && item !== '')
    .join('__');

  return key || JSON.stringify(record);
};

export default getBreakdownRowKey;
