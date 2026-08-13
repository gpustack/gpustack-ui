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

  // The export preview is the one caller whose grouping VARIES: a member (or
  // anyone in a personal Org) is forced to self scope, where grouping by user
  // is forbidden, so that dimension is dropped from the request — and the row
  // then has no ``user`` at all. Reading it unguarded crashed the dialog on
  // open. Every part is optional for that reason; the key stays unique because
  // whatever dimensions the grouping does have are all in it.
  return [
    record.date?.value || '',
    record.route?.label || '',
    record.user?.label || '',
    record.api_key?.label || ''
  ].join('-');
};

export default getBreakdownRowKey;
