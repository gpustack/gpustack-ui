import { getTenantHeaders } from '@/request.extensions';

const isSameOrigin = (url: string): boolean => {
  try {
    // Relative URLs resolve against the current origin → same-origin.
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    // Unparseable input — treat as a relative same-origin path.
    return true;
  }
};

const urlOf = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

const methodOf = (input: RequestInfo | URL, init?: RequestInit): string => {
  if (init?.method) return init.method;
  if (input instanceof Request) return input.method;
  return 'GET';
};

const mergeHeaders = (
  base: HeadersInit | undefined,
  extra: Record<string, string>
): Headers => {
  const merged = new Headers(base ?? undefined);
  Object.entries(extra).forEach(([key, value]) => merged.set(key, value));
  return merged;
};

let installed = false;

export const installTenantFetch = (): void => {
  if (installed || typeof window === 'undefined' || !window.fetch) {
    return;
  }
  installed = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const headers = getTenantHeaders(methodOf(input, init));
    if (Object.keys(headers).length === 0 || !isSameOrigin(urlOf(input))) {
      return nativeFetch(input, init);
    }

    // For a Request object the existing headers live on the object, not
    // in `init`; fold them in so they survive the override.
    if (input instanceof Request && init?.headers == null) {
      return nativeFetch(
        new Request(input, { headers: mergeHeaders(input.headers, headers) }),
        init
      );
    }

    return nativeFetch(input, {
      ...init,
      headers: mergeHeaders(init?.headers, headers)
    });
  };
};
