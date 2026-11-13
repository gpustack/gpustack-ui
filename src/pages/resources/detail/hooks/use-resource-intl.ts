import { useIntl } from '@umijs/max';
export const useResourceIntl = () => {
  const intl = useIntl();
  return (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `resourceDetail.${key}` }, values);
};
