import { ListItem as UserListItem } from '@/pages/users/config/types';
import { withBasePath } from '@/utils/with-base-path';
import { downloadFile, listFiles, listModels } from '@huggingface/hub';
import { PipelineType } from '@huggingface/tasks';
import { request } from '@umijs/max';
import qs from 'query-string';
import { MODEL_ROUTES } from '../../model-routes/apis';
import {
  AccessControlFormData,
  BackendItem,
  CatalogItem,
  CatalogSpec,
  DraftModelItem,
  EvaluateResult,
  EvaluateSpec,
  FormData,
  GPUListItem,
  ListItem,
  ModelInstanceFormData,
  ModelInstanceListItem,
  ModelLoraAdapterResult
} from '../config/types';

export const MODELS_API = '/models';

export const MODEL_INSTANCE_API = '/model-instances';

export const MODEL_EVALUATIONS = '/model-evaluations';

export const BACKEND_LIST_API = '/inference-backends/list';

export const MY_MODELS_API = '/my-models';

export const DRAFT_MODELS_API = '/draft-models';

export const CATALOG_LIST_API = '/model-sets';

export const MODEL_LORA_ADAPTER_API = '/models/adapters';

// Two spellings of the same endpoint, because the two clients used below
// disagree about who owns the mount prefix. Picking the wrong one is invisible
// at the root — where the prefix is empty — and 404s under a subpath, so the
// names carry the distinction instead of a comment at each call site.

/** For `request`: the axios layer prepends the mount prefix via `baseURL`. */
const proxyPath = (url: string) => `/proxy?url=${encodeURIComponent(url)}`;

/** For raw `fetch`, which gets no `baseURL` treatment and needs the prefix. */
const proxyFetchUrl = (url: string) => withBasePath(proxyPath(url));

// ===================== Models =====================

export async function queryModelsInstances(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<ModelInstanceListItem>>(
    MODEL_INSTANCE_API,
    {
      params,
      method: 'GET',
      cancelToken: options?.token
    }
  );
}
export async function queryModelsList(
  params: Global.SearchParams,
  options?: Record<string, any>
) {
  return request<Global.PageResponse<ListItem>>(
    `${MODELS_API}?${qs.stringify(params)}`,
    {
      method: 'GET',
      ...options
    }
  );
}

export async function queryGPUList<T extends Record<string, any>>(
  params?: Global.SearchParams & T
) {
  return request<Global.PageResponse<GPUListItem>>(`/gpu-devices`, {
    method: 'GET',
    params
  });
}

export async function createModel(params: { data: FormData }) {
  return request(`${MODELS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function deleteModel(id: number) {
  return request(`${MODELS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function updateModel(params: { id: number; data: FormData }) {
  return request(`${MODELS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function queryModelDetail(id: number) {
  return request(`${MODELS_API}/${id}`, {
    method: 'GET'
  });
}

export async function queryModelLoraAdapter(
  params: {
    base: string;
    q?: string;
    limit?: number;
  },
  options?: any
) {
  return request<ModelLoraAdapterResult>(`${MODEL_LORA_ADAPTER_API}`, {
    params,
    cancelToken: options?.token,
    method: 'GET'
  });
}

// ===================== Model Instances start =====================

export async function queryModelInstancesList(
  params: Global.Pagination & { query?: string; id: number },
  options?: any
) {
  return request<Global.PageResponse<ModelInstanceListItem>>(
    `${MODELS_API}/${params.id}/instances`,
    {
      method: 'GET',
      params,
      cancelToken: options?.token
    }
  );
}

export async function createModelInstance(params: {
  data: ModelInstanceFormData;
}) {
  return request(`${MODEL_INSTANCE_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function deleteModelInstance(id: number) {
  return request(`${MODEL_INSTANCE_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function updateModelInstance(params: {
  id: number;
  data: FormData;
}) {
  return request(`${MODEL_INSTANCE_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function queryModelInstanceDetail(id: number) {
  return request(`${MODEL_INSTANCE_API}/${id}`, {
    method: 'GET'
  });
}

export async function queryModelInstanceLogs(id: number) {
  return request(`${MODEL_INSTANCE_API}/${id}/logs`, {
    method: 'GET'
  });
}
export async function queryModelInstanceRestartCount(id: number) {
  return request(`${MODEL_INSTANCE_API}/${id}/log-options`, {
    method: 'GET'
  });
}

/**
 * Download an instance's complete logs across every worker and container.
 *
 * `responseType: 'blob'` keeps the bytes intact: one log stream comes back as
 * text/plain, but several come back zipped, and decoding a zip as text destroys
 * it. `getResponse` keeps the headers reachable, because the server owns the
 * filename — and therefore the extension — via Content-Disposition.
 *
 * `skipErrorHandler`: on failure `response.data` is a Blob the global handler
 * cannot read, so it would only ever show axios's own "Request failed with
 * status code 502"; the caller reads the body itself instead. The 401 -> login
 * redirect sits outside that guard in `request-config.tsx`, so session expiry is
 * still handled.
 *
 * The response streams without a Content-Length, so `onDownloadProgress` gets a
 * ProgressEvent whose `total` is meaningless — only `loaded` is usable.
 */
export async function downloadModelInstanceLogs(
  id: number | string,
  options?: {
    signal?: AbortSignal;
    onDownloadProgress?: (event: ProgressEvent) => void;
  }
): Promise<{ data: Blob; headers: Record<string, any> }> {
  return request(`${MODEL_INSTANCE_API}/${id}/logs/download`, {
    method: 'GET',
    responseType: 'blob',
    getResponse: true,
    skipErrorHandler: true,
    signal: options?.signal,
    onDownloadProgress: options?.onDownloadProgress
  });
}

// ===================== Model Instances end =====================

// ===================== call huggingface quicksearch api =====================

const MODEL_SCOPE_LIST_MODEL_API = `https://www.modelscope.cn/api/v1/dolphin/models`;

const MODE_SCOPE_MODEL_FIELS_API = `https://modelscope.cn/api/v1/models/`;

export async function queryHuggingfaceModelDetail(
  params: { repo: string },
  options?: any
) {
  const url = `https://huggingface.co/api/models/${params.repo}`;
  return request(proxyPath(url), {
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function queryModelScopeModels(
  params: {
    PageSize?: number;
    PageNumber?: number;
    SortBy?: string;
    Target?: string;
    SingleCriterion?: any[];
    Name: string;
    tags?: string[];
    tasks?: string[];
  },
  config?: any
) {
  const tagsCriterion = params.tags?.map((tag: string) => {
    return { category: 'tags', predicate: 'contains', values: [tag] };
  });
  const tasksCriterion = params.tasks?.map((task: string) => {
    return { category: 'tasks', predicate: 'contains', values: [task] };
  });

  const Criterion =
    tagsCriterion?.length || tasksCriterion?.length
      ? {
          Criterion: [...(tagsCriterion || []), ...(tasksCriterion || [])]
        }
      : {};

  const res = await fetch(proxyFetchUrl(`${MODEL_SCOPE_LIST_MODEL_API}`), {
    method: 'PUT',
    signal: config?.signal,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      PageSize: 10,
      PageNumber: 1,
      ...params,
      ...Criterion,
      Name: `${params.Name}`
    })
  });
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
}

export async function queryModelScopeModelDetail(
  params: { name: string },
  options?: any
) {
  return request(proxyPath(`${MODE_SCOPE_MODEL_FIELS_API}${params.name}`), {
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function queryModelScopeModelFiles(
  params: { name: string; revision: string },
  options?: any
) {
  const url = `${MODE_SCOPE_MODEL_FIELS_API}${params.name}/repo/files?${qs.stringify(
    {
      Revision: params.revision,
      Recursive: true,
      Root: ''
    }
  )}`;
  const res = await fetch(proxyFetchUrl(url), {
    method: 'GET',
    signal: options?.signal,
    body: null
  });

  if (!res.ok) {
    throw new Error('Network response was not ok');
  }

  return res.json();
}

// list models from huggingface
export async function queryHuggingfaceModels(
  params: {
    limit?: number;
    search: {
      query: string;
      tags?: string[];
      sort?: string;
      task?: PipelineType;
    };
  },
  options?: any
) {
  console.log('params', params);
  const result = [];
  for await (const model of listModels({
    ...params,
    ...options,
    limit: params.limit || 500,
    additionalFields: ['sha', 'tags'],
    fetch(_url: string, config: any) {
      const url = params.search.sort
        ? `${_url}&sort=${params.search.sort}`
        : _url;
      try {
        return fetch(proxyFetchUrl(url), {
          ...config,
          signal: options.signal
        });
      } catch (error) {
        // ignore
        return [];
      }
    }
  })) {
    result.push(model);
  }
  return result;
}

// list files from huggingface
export async function queryHuggingfaceModelFiles(
  params: { repo: string },
  options?: any
) {
  const result = [];
  for await (const fileInfo of listFiles({
    ...params,
    recursive: true,
    fetch(url: string, config: any) {
      try {
        return fetch(proxyFetchUrl(url), {
          ...config,
          signal: options?.signal
        });
      } catch (error) {
        // ignore
        return [];
      }
    }
  })) {
    result.push(fileInfo);
  }
  return result;
}

export async function downloadModelFile(
  params: { repo: string; revision: string; path: string },
  options?: any
) {
  const { repo, revision, path } = params;
  const res = await (
    await downloadFile({
      repo,
      revision: revision,
      path: path,
      fetch(url: string, config: any) {
        return fetch(proxyFetchUrl(url), {
          ...config,
          signal: options?.signal
        });
      }
    })
  )?.text();
  return res;
}
export async function downloadModelScopeModelfile(
  params: { name: string },
  options?: any
) {
  const url = `${MODE_SCOPE_MODEL_FIELS_API}${params.name}/resolve/master/config.json`;
  const res = await fetch(proxyFetchUrl(url), {
    method: 'GET',
    signal: options?.signal
  });
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
}

// ===================== catalog =====================

export async function queryCatalogList(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<CatalogItem>>(`${CATALOG_LIST_API}`, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function queryCatalogItemSpec(
  params: { id: number; cluster_id: number | null },
  options?: any
) {
  return request<Global.PageResponse<CatalogSpec>>(
    `${CATALOG_LIST_API}/${params.id}/specs`,
    {
      method: 'GET',
      ...options,
      params
    }
  );
}

export async function evaluationsModelSpec(
  data: {
    cluster_id: number;
    model_specs: EvaluateSpec[];
  },
  options: { token: any }
) {
  const result = await request<{ results: EvaluateResult[] }>(
    `${MODEL_EVALUATIONS}`,
    {
      method: 'POST',
      data,
      cancelToken: options?.token
    }
  );

  const resultList = result?.results || [];

  return {
    results: resultList.map((item) => {
      return {
        ...item,
        cluster_id: data.model_specs?.[0]?.cluster_id || undefined
      };
    })
  };
}

export async function queryBackendList(params?: { cluster_id: number }) {
  return request<{
    items: BackendItem[];
  }>(BACKEND_LIST_API, {
    method: 'GET',
    params
  });
}

export async function queryModelAccessUserList(id: number) {
  // The response carries `access_policy` alongside `items` so the
  // Access Settings dialog can refresh both halves from a single
  // GET (the calling list snapshot may be stale after a prior
  // save). `principals` is the full grant set (any kind) used by the
  // principal-based override; `items` stays the USER-only subset.
  return request<{
    items: UserListItem[];
    access_policy?: string;
    principals?: {
      principal_type: string;
      principal_id: number;
      principal_name?: string;
      principal_display_name?: string;
    }[];
  }>(`${MODEL_ROUTES}/${id}/access`, { method: 'GET' });
}

export async function updateModelAccessUser(params: {
  id: number;
  data: AccessControlFormData;
}) {
  return request(`${MODEL_ROUTES}/${params.id}/access`, {
    method: 'POST',
    data: params.data
  });
}

export async function queryMyModels(params: Global.SearchParams) {
  return request<Global.PageResponse<ListItem>>(
    `${MY_MODELS_API}?${qs.stringify(params)}`,
    {
      method: 'GET'
    }
  );
}

export async function queryMyModelDetail(id: number) {
  return request(`${MY_MODELS_API}/${id}`, {
    method: 'GET'
  });
}

export async function queryDraftModelList(params?: Global.SearchParams) {
  return request<{ items: DraftModelItem[] }>(DRAFT_MODELS_API, {
    method: 'GET',
    params
  });
}

export async function queryModelContextLength(params: {
  model: {
    source: string;
    model_scope_model_id?: string;
    huggingface_repo_id?: string;
    local_path?: string;
  };
}) {
  return request<{ native: number; scaled: number }>(
    `${MODELS_API}/context-length`,
    {
      method: 'POST',
      data: params
    }
  );
}
