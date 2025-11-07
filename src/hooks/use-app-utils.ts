import { useIntl } from '@umijs/max';
import { message } from 'antd';

type MessageType = 'input' | 'select';

const useAppUtils = () => {
  const intl = useIntl();
  const [messageApi, contextHolder] = message.useMessage();

  /**
   *
   * @param type Array<'input' | 'select'>
   * @param name
   * @param locale boolean
   * @returns
   */
  const getRuleMessage = (
    type: MessageType | MessageType[],
    name: string,
    locale = true
  ) => {
    const nameStr = locale ? intl.formatMessage({ id: name }) : name;
    // transform type to array
    const typeList = Array.isArray(type) ? type : [type];

    if (typeList.includes('select') && typeList.includes('input')) {
      return intl.formatMessage(
        { id: 'common.form.rule.selectInput' },
        { name: nameStr }
      );
    }

    if (typeList.includes('input')) {
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
