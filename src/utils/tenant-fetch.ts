type TenantHeaders = (method?: string) => Record<string, string>;

const isSameOrigin = (url: string, origin: string): boolean => {
  try {
    return new URL(url, origin).origin === new URL(origin).origin;
  } catch {
    return false;
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
  const merged = new Headers(base);
  Object.entries(extra).forEach(([key, value]) => merged.set(key, value));
  return merged;
};

export const createTenantFetch =
  (
    nativeFetch: typeof fetch,
    getTenantHeaders: TenantHeaders,
    origin: string
  ): typeof fetch =>
  (input, init) => {
    // Credential-free requests deliberately opt out of management tenant
    // context too, whether credentials come from a Request or its init override.
    const credentials =
      init?.credentials ??
      (input instanceof Request ? input.credentials : undefined);
    if (credentials === 'omit' || !isSameOrigin(urlOf(input), origin)) {
      return nativeFetch(input, init);
    }

    const headers = getTenantHeaders(methodOf(input, init));
    if (Object.keys(headers).length === 0) return nativeFetch(input, init);

    // Request headers live on the object when init does not override them.
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
