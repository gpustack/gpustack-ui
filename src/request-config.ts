import { RequestConfig, history } from '@umijs/max';
import { message } from 'antd';

const NoBaseURLAPIs = ['/auth', '/v1-openai'];

export const requestConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res: any) => {
      // to do something
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      const { message: errorMessage, response } = error;
      const errMsg = response?.data?.message || errorMessage;
      message.error(errMsg);
      if (response.status === 401) {
        history.push('/login', { replace: true });
      }
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
      // to do something
      return response;
    }
  ]
};
