import { PageAction } from '@/config';
import _ from 'lodash';
import { FormData, MaasProviderItem } from '../config/types';

export type ProviderApiToken = { hash: string } | { input: string };

// Request body for POST/PUT /model-providers. `api_tokens` is omittable —
// that omission (not an explicit empty array, which the backend validator
// rejects) is the wire contract for a tokenless provider — and the raw
// `api_key` form field never leaves the client.
export interface ProviderSubmitPayload {
  name: string;
  description?: string | null;
  proxy_url?: string | null;
  proxy_timeout?: number | null;
  api_tokens?: ProviderApiToken[];
  config: Record<string, any>;
  models: FormData['models'];
  clone_from_id?: number;
  [key: string]: any;
}

// Serializes the form's credential fields for POST/PUT /model-providers.
// The backend distinguishes an omitted `api_tokens` (field not set — the
// legitimate tokenless state for self-hosted, no-auth endpoints) from an
// explicit empty array, which its validator rejects. A tokenless provider
// therefore must OMIT the field entirely — hence `undefined` when no token
// survives the filters.
export const serializeApiTokens = (
  values: FormData,
  currentData?: MaasProviderItem,
  action?: string
): ProviderApiToken[] | undefined => {
  const apiTokens = values.api_tokens?.filter?.(
    (item) => item && item.trim() !== ''
  );
  const apiTokenList = _.concat([], values.api_key, apiTokens || []).filter(
    (item: string) => item && item.trim() !== ''
  );
  if (apiTokenList.length === 0) {
    return undefined;
  }
  if (action === PageAction.CREATE) {
    return apiTokenList.map((item: string) => ({ input: item }));
  }

  // In edit/copy mode a value matching a stored hash is sent back as a
  // `{ hash }` reference instead of a new `{ input }` token.
  const existingTokens = new Set(
    (currentData?.api_tokens || [])
      .map((item: { hash?: string } | null) => item?.hash)
      .filter(Boolean)
  );
  return apiTokenList.map((item: string) =>
    existingTokens.has(item) ? { hash: item } : { input: item }
  );
};

// a cleared optional field means "unset" — the backend treats '' as an
// explicitly configured empty value, so send null instead
export const normalizeConfig = (config: FormData['config']) => {
  return _.mapValues(config || {}, (value: any) =>
    value === '' ? null : value
  );
};

// The final POST/PUT payload: drops the raw `api_key` form field and the
// form-only `api_tokens` (hash strings list), and re-adds `api_tokens` only
// when the serializer produced real credentials.
export const buildProviderSubmitPayload = (
  values: FormData,
  currentData?: MaasProviderItem,
  action?: string,
  customConfig: Record<string, any> = {}
): ProviderSubmitPayload => {
  const apiTokens = serializeApiTokens(values, currentData, action);
  return {
    ..._.omit(values, ['api_key', 'api_tokens']),
    ...(apiTokens ? { api_tokens: apiTokens } : {}),
    config: {
      ...normalizeConfig(values.config),
      ...customConfig
    },
    // For a decision-service provider this list is the decision engine
    // cache (category "decision") — it may legitimately be empty before the
    // first fetch.
    models: _.uniqBy(values.models || [], 'name'),
    ...(action === PageAction.COPY && currentData?.id
      ? { clone_from_id: currentData.id }
      : {})
  };
};

// True while editing/copying a SAVED provider that has no stored tokens and
// no freshly typed key. The saved-provider endpoints (/{id}/get-models,
// /{id}/test-model) reject these server-side until they learn to talk to
// tokenless upstreams, so callers warn instead of firing a doomed request.
export const isSavedTokenless = (
  action: string | undefined,
  currentData: MaasProviderItem | undefined,
  typedApiKey: string | null | undefined
): boolean =>
  (action === PageAction.EDIT || action === PageAction.COPY) &&
  !(currentData?.api_tokens || []).length &&
  !typedApiKey;

export default serializeApiTokens;
