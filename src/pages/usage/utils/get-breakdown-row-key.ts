import { BreakdownItem } from '../config/types';

export const getBreakdownRowKey = (
  record: BreakdownItem,
  type: string
): string => {
  if (type === 'models') {
    return `${record.route?.label || ''}`;
  }

  if (type === 'users') {
    return `${record.user.label}`;
  }

  if (type === 'api_keys') {
    return `${record.api_key.label}`;
  }

  return `${record.date?.value || ''}-${record.route?.label || ''}-${record.user.label}-${record.api_key.label}`;
};

export default getBreakdownRowKey;
