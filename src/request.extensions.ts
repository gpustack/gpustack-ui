// Identity hook for build-time request-interceptor extensions. Tooling
// may overwrite this file to inject extra interceptors (e.g. context
// headers); the original is restored on cleanup. Mirrors
// `src/access.extensions.ts` and `config/routes.extensions.ts`.
//
// Each interceptor follows the umi/max signature: it receives
// `(url, options)` and returns `{ url, options }` — typed loosely
// here so this file has no dependency on the framework's exact
// option types.
export type RequestInterceptor = (
  url: string,
  options: Record<string, any>
) => { url: string; options: Record<string, any> };

export const extraRequestInterceptors: RequestInterceptor[] = [];

export const getTenantHeaders = (
  _method?: string
): Record<string, string> => ({});

export type ResponseInterceptor = (response: any) => any;

export const extraResponseInterceptors: ResponseInterceptor[] = [];
