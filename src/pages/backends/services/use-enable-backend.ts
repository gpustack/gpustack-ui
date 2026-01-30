import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { updateBackend } from '../../backends/apis';
import { FormData } from '../../backends/config/types';

const useEnableBackend = () => {
  const intl = useIntl();
  const handleEnableBackend = async (params: {
    id: number;
    data: FormData;
    showMessage?: boolean;
  }) => {
    const { showMessage = true } = params;
    await updateBackend(params.id, {
      data: params.data
    });
    if (showMessage) {
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    }
  };

  return { handleEnableBackend };
};

export default useEnableBackend;
