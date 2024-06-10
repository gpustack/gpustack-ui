import { RequestConfig } from '@umijs/max';
import { message } from 'antd';

export const requestConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res: any) => {
      console.log('errorThrower+++++++++++++++', res);
    },
    errorHandler: (error: any, opts: any) => {
      const { message: errorMessage, response } = error;
      const errMsg = response?.data?.message || errorMessage;
      message.error(errMsg);
      console.log('errorHandler+++++++++++++++', error, opts);
    }
  },
  requestInterceptors: [
    (url, options) => {
      console.log('requestInterceptors+++++++++++++++', url, options);
      return { url, options };
    }
  ],
  responseInterceptors: [
    (response) => {
      console.log('responseInterceptors+++++++++++++++', response);
      return response;
    }
  ]
};
