import { useIntl } from '@umijs/max';
import { message } from 'antd';

const useAppUtils = () => {
  const intl = useIntl();
  const [messageApi, contextHolder] = message.useMessage();

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

  const showSuccess = (msg?: string) => {
    messageApi.success(
      msg || intl.formatMessage({ id: 'common.message.success' })
    );
  };

  return {
    getRuleMessage,
    showSuccess
  };
};

export default useAppUtils;
