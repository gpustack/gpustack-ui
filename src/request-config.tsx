import { userAtom } from '@/atoms/user';
import { clearAtomStorage } from '@/atoms/utils';
import { history, RequestConfig } from '@umijs/max';
import { message } from 'antd';
import { DEFAULT_ENTER_PAGE } from './config/settings';
import ErrorMessageContent from './pages/_components/error-message-content';
import {
  extraRequestInterceptors,
  extraResponseInterceptors
} from './request.extensions';

//  these APIs do not via the GPUSTACK_API_BASE_URL
const NoBaseURLAPIs = ['/auth', '/v1', '/version', '/proxy', '/update'];

/**
 * Extracts a human-readable message from a FastAPI error `detail`.
 * Handles the string form and the array form (objects with `msg`, or plain
 * strings). For discriminated-union validation errors, Pydantic emits one
 * `literal_error` per non-matching schema (its `loc` ends with the
 * discriminator field, e.g. `type`); those are noise — skip them and prefer
 * the first entry about the actual field that failed.
 */
const getFastApiDetailMessage = (detail: unknown): string | undefined => {
  if (typeof detail === 'string') {
    return detail || undefined;
  }
  if (!Array.isArray(detail) || detail.length === 0) {
    return undefined;
  }
  if (detail.every((item) => typeof item === 'string')) {
    return (detail[0] as string) || undefined;
  }
  const relevant = detail.find(
    (item: any) =>
      Array.isArray(item?.loc) && item.loc[item.loc.length - 1] !== 'type'
  ) as any;
  return (relevant ?? detail[0])?.msg;
};

export const requestConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res: any) => {
      // to do something
    },
    errorHandler: (error: any, opts: any) => {
      const { message: errorMessage, response } = error;
      // FastAPI validation errors arrive as `{ detail: [{ msg, ... }, ...] }`.
      // `config` is validated as a discriminated union across all provider
      // types, so the array also carries one `literal_error` per non-matching
      // provider `type`. Skip those and surface the first relevant entry as a
      // readable message instead of dumping the whole array.
      const detail = response?.data?.detail;
      const firstDetailMsg = getFastApiDetailMessage(detail);
      const errMsg =
        firstDetailMsg ||
        response?.data?.error?.message ||
        response?.data?.message ||
        errorMessage;

      if (!opts?.skipErrorHandler && response?.status) {
        message.error({
          content: <ErrorMessageContent errMsg={errMsg}></ErrorMessageContent>
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
    },
    // Build-time tooling can plug additional interceptors via
    // `request.extensions.ts`. Default is an empty list.
    ...extraRequestInterceptors
  ],
  responseInterceptors: [
    (response) => {
      // to do something
      return response;
    },
    // Build-time tooling can plug additional response interceptors via
    // `request.extensions.ts`. Default is an empty list.
    ...extraResponseInterceptors
  ]
};
