import { RequestConfig } from '@umijs/max';
import { message } from 'antd';

const NoBaseURLAPIs = ['/auth'];

export const requestConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res: any) => {
      console.log('errorThrower+++++++++++++++', res);
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      const { message: errorMessage, response } = error;
      const errMsg = response?.data?.message || errorMessage;
      message.error(errMsg);
      console.log('errorHandler+++++++++++++++', error, opts);
    }
  },
  requestInterceptors: [
    (url, options) => {
      console.log('requestInterceptors+++++++++++++++', url, options);
      if (NoBaseURLAPIs.some((api) => url.startsWith(api))) {
        options.baseURL = '';
        return { url, options };
      }
      return { url, options };
    }
  ],
  responseInterceptors: [
    (response) => {
      return response;
    }
  ]
};
