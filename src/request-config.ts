import { userAtom } from '@/atoms/user';
import { clearAtomStorage } from '@/atoms/utils';
import { RequestConfig, history } from '@umijs/max';
import { message } from 'antd';
import { DEFAULT_ENTER_PAGE } from './config/settings';

//  these APIs do not via the GPUSTACK_API_BASE_URL
const NoBaseURLAPIs = ['/auth', '/v1', '/version', '/proxy', '/update'];

export const requestConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res: any) => {
      // to do something
    },
    errorHandler: (error: any, opts: any) => {
      const { message: errorMessage, response } = error;
      const errMsg =
        response?.data?.error?.message ||
        response?.data?.message ||
        errorMessage;

      if (!opts?.skipErrorHandler && response?.status) {
        message.error(errMsg);
      }
      if (response?.status === 401) {
        clearAtomStorage(userAtom);

        history.push(DEFAULT_ENTER_PAGE.login, { replace: true });
      }
    }
  },
  requestInterceptors: [
    (url, options) => {
      if (NoBaseURLAPIs.some((api) => url.startsWith(api))) {
        options.baseURL = '';
        return { url, options };
      }
      return { url, options };
    }
  ],
  responseInterceptors: [
    (response) => {
      // to do something
      return response;
    }
  ]
};
