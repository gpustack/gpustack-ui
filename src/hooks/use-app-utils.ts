import { useIntl } from '@umijs/max';

const useAppUtils = () => {
  const intl = useIntl();

  const getRuleMessage = (
    type: 'input' | 'select',
    name: string,
    locale = true
  ) => {
    const nameStr = locale ? intl.formatMessage({ id: name }) : name;

    if (type === 'input') {
      return intl.formatMessage(
        { id: 'common.form.rule.input' },
        { name: nameStr }
      );
    }
    return intl.formatMessage(
      { id: 'common.form.rule.select' },
      { name: nameStr }
    );
  };

  return {
    getRuleMessage
  };
};

export default useAppUtils;
