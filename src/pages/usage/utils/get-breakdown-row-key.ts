import { BreakdownItem } from '../config/types';

export const getBreakdownRowKey = (
  record: BreakdownItem,
  type: string
): string => {
  if (type === 'models') {
    return `${record.model.label}`;
  }

  if (type === 'users') {
    return `${record.user.label}`;
  }

  if (type === 'api_keys') {
    return `${record.api_key.label}`;
  }

  return record.last_active;
};

export default getBreakdownRowKey;
