import { ListItem as UserListItem } from '@/pages/users/config/types';
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
  DeploymentImportResult,
  DraftModelItem,
  EvaluateResult,
  EvaluateSpec,
  FormData,
  GPUListItem,
  KVTransferBudget,
  ListItem,
  ModelCacheMetrics,
  ModelInstanceFormData,
  ModelInstanceListItem,
  ModelLoraAdapterResult,
  ModelRestartResult,
  PDMetrics,
  PDMode,
  PDModeResolution,
  SpanningPreview
} from '../config/types';

export const MODELS_API = '/models';

export const MODEL_INSTANCE_API = '/model-instances';

export const MODEL_EVALUATIONS = '/model-evaluations';

export const BACKEND_LIST_API = '/inference-backends/list';

export const MY_MODELS_API = '/my-models';

export const DRAFT_MODELS_API = '/draft-models';

export const CATALOG_LIST_API = '/model-sets';

export const MODEL_LORA_ADAPTER_API = '/models/adapters';

export const PD_MODES_API = '/pd-modes';

const setProxyUrl = (url: string) => {
  return `/proxy?url=${encodeURIComponent(url)}`;
};

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

/**
 * Whether a disaggregated group is actually disaggregating.
 *
 * Server-side it is a PromQL query scoped to this model, so the caller never
 * learns a metric name and can only read the series of a model it can already
 * see. Fetched on expand rather than with the list: it is the only field that
 * costs a Prometheus round trip, and a collapsed row does not show it.
 */
export async function queryModelPDMetrics(
  id: number,
  params?: { window?: string }
) {
  return request<PDMetrics>(`${MODELS_API}/${id}/pd-metrics`, {
    method: 'GET',
    params
  });
}

/**
 * The bandwidth this model's KV transfer would need.
 *
 * Computed from the model's own config, so it answers for a model that is not
 * deployed yet — which is when the question is actually asked, and why this is
 * a POST taking a source rather than a GET on an id. An id is accepted too,
 * for the deployed case: paired with the group's measured transfer rate in
 * `measured_bandwidth_bytes_per_second`, the response comes back with a
 * verdict, so a reading becomes "the link is fast enough" or "it is not, and
 * here is what to do".
 */
export async function estimateKVTransferBudget(payload: {
  model_id?: number;
  model_source?: Record<string, any>;
  backend_parameters?: string[];
  seq_len?: number;
  ttft_budget_ms?: number;
  prefill_ms?: number;
  /** The transfer's window stated directly; wins over the two above. */
  transfer_budget_ms?: number;
  measured_bandwidth_bytes_per_second?: number;
  trust_remote_code?: boolean;
}) {
  return request<KVTransferBudget>(`${MODELS_API}/kv-transfer-budget`, {
    method: 'POST',
    data: payload
  });
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

// Whether a member of this draft will have to occupy more than one machine.
//
// 🔴 Safe to ask while the form is still being typed, which the removed
// `gather-feasibility` was not: this is one comparison between a width the user
// has typed and the widest machine in the cluster — no placement solve, no free
// capacity — so the answer does not move as the rest of the form is filled in.
// Every uncertainty comes back empty, and the caller must render that the same
// as «no», never as a third state.
export async function queryModelSpanningRoles(
  data: Record<string, any>,
  options?: any
) {
  return request<SpanningPreview>(`${MODELS_API}/spanning-roles`, {
    method: 'POST',
    data,
    cancelToken: options?.token,
    skipErrorHandler: true
  });
}

export async function updateModel(params: { id: number; data: FormData }) {
  return request(`${MODELS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

// Retire the running generation so the current spec takes effect. Not a PUT
// with the same body: the whole group has to stop before any of it restarts,
// or replica convergence pairs a new-generation prefill with an old-generation
// decode — a combination the engines accept and only fail on later.
//
// `skipErrorHandler` because the one error this reliably returns is 409 "a
// restart is already in flight", which is a wait rather than a fault and reads
// wrong as a red toast. Every caller therefore owns its own error reporting.
export async function restartModel(id: number) {
  return request<ModelRestartResult>(`${MODELS_API}/${id}/restart`, {
    method: 'POST',
    skipErrorHandler: true
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

export async function queryModelCacheMetrics(
  id: number,
  params: { window: string },
  options?: any
) {
  return request<ModelCacheMetrics>(`${MODELS_API}/${id}/cache-metrics`, {
    method: 'GET',
    params,
    cancelToken: options?.token,
    // the hit rate only enriches a tooltip: a failure (or observability
    // being disabled) drops the line instead of toasting
    skipErrorHandler: true
  });
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
 * A Content-Length comes back only where the server can state a length that
 * will still hold when the last byte is sent: one stream, of known size, that
 * the size cap has not truncated. Everywhere else the ProgressEvent carries no
 * `total` and `loaded` is all there is to show.
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

// ===================== Deployment YAML export / import =====================

/**
 * `responseType: 'blob'` + `getResponse`: the body is the YAML file itself and
 * the server names it via Content-Disposition. `skipErrorHandler` because the
 * failure body is a Blob the global handler cannot read; the caller decodes it.
 */
export async function exportModels(params: {
  ids?: number[];
  cluster_id?: number;
}): Promise<{ data: Blob; headers: Record<string, any> }> {
  return request(`${MODELS_API}/export`, {
    method: 'POST',
    data: params,
    responseType: 'blob',
    getResponse: true,
    skipErrorHandler: true
  });
}

/**
 * A dry run answers with the plan and puts each problem on the entry that
 * caused it; only a write fails with a 400 listing them. Either way the modal
 * renders them in place, so the global toast is skipped.
 */
export async function importModels(
  params: {
    content: string;
    // Omitted to let every entry land in the cluster its own `cluster` names,
    // which is how a file that spans clusters restores. Set to force them all
    // into one.
    cluster_id?: number;
    dry_run?: boolean;
    // The names the caller agreed to overwrite, sent with the write. A dry
    // run does not carry them: what it answers is what the agreement is then
    // given for, and the write repeats the document unchanged beside it.
    overwrite?: string[];
  },
  // A dry run is re-sent as the document is edited, and the one being
  // answered is worth no more than the keystroke that superseded it — on
  // either side of the wire.
  options?: { signal?: AbortSignal }
): Promise<DeploymentImportResult> {
  return request(`${MODELS_API}/import`, {
    method: 'POST',
    data: params,
    signal: options?.signal,
    skipErrorHandler: true
  });
}

// ===================== call huggingface quicksearch api =====================

const MODEL_SCOPE_LIST_MODEL_API = `https://www.modelscope.cn/api/v1/dolphin/models`;

const MODE_SCOPE_MODEL_FIELS_API = `https://modelscope.cn/api/v1/models/`;

export async function queryHuggingfaceModelDetail(
  params: { repo: string },
  options?: any
) {
  const url = `https://huggingface.co/api/models/${params.repo}`;
  return request(setProxyUrl(url), {
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

  const res = await fetch(setProxyUrl(`${MODEL_SCOPE_LIST_MODEL_API}`), {
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
  return request(setProxyUrl(`${MODE_SCOPE_MODEL_FIELS_API}${params.name}`), {
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
  const res = await fetch(setProxyUrl(url), {
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
        return fetch(setProxyUrl(url), {
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
        return fetch(setProxyUrl(url), {
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
        return fetch(setProxyUrl(url), {
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
  const res = await fetch(setProxyUrl(url), {
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

/**
 * The PD-mode catalog.
 *
 * Read from the server rather than mirrored in the frontend: the catalog's
 * whole point is that adding an engine is a YAML change, and a hardcoded enum
 * here would spend that benefit. Fetch it when the deploy drawer opens.
 */
export async function queryPDModes() {
  return request<{
    items: PDMode[];
  }>(PD_MODES_API, {
    method: 'GET'
  });
}

/**
 * Which PD recipe this deployment gets, and why every other one is out.
 *
 * The judgement is the server's because the deciding fact — which
 * accelerators the cluster's ready workers report — is not in the deploy
 * form. What the form has is the cluster's `provider` (Docker / Kubernetes),
 * which is the infrastructure provider, not the accelerator vendor.
 *
 * Action-driven per the repo's conventions: called from the handlers that
 * change an input it depends on (engine, cluster, vendor), never from an
 * effect keyed on those values.
 */
export async function resolvePDMode(params: {
  cluster_id?: number;
  backend?: string;
  vendor?: string;
}) {
  return request<PDModeResolution>(`${PD_MODES_API}/resolve`, {
    method: 'GET',
    params
  });
}
