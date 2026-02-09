import { userAtom } from '@/atoms/user';
import { clearAtomStorage } from '@/atoms/utils';
import { history, RequestConfig } from '@umijs/max';
import { message, Typography } from 'antd';
import styled from 'styled-components';
import { DEFAULT_ENTER_PAGE } from './config/settings';

const Content = styled.div`
  position: relative;
  .cp-btn {
    position: absolute;
    top: 0px;
    right: -4px;
    display: none;
  }
  &:hover .cp-btn {
    display: inline-block;
  }
  .msg {
    display: none;
  }
`;

//  these APIs do not via the GPUSTACK_API_BASE_URL
const NoBaseURLAPIs = ['/auth', '/v1', '/version', '/proxy', '/update'];

export const requestConfig: RequestConfig = {
  headers: {
    'Content-Security-Policy': "frame-ancestors 'self'",
    'X-Frame-Options': 'SAMEORIGIN'
  },
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
        message.error({
          content: (
            <Content>
              <Typography.Text
                className="cp-btn"
                copyable={{
                  text: errMsg
                }}
              >
                <span className="msg">{errMsg}</span>
              </Typography.Text>
              {errMsg}
            </Content>
          )
        });
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
