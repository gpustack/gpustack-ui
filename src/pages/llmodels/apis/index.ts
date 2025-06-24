import { downloadFile, listFiles, listModels } from '@huggingface/hub';
import { PipelineType } from '@huggingface/tasks';
import { request } from '@umijs/max';
import qs from 'query-string';
import {
  CatalogItem,
  CatalogSpec,
  EvaluateResult,
  EvaluateSpec,
  FormData,
  GPUListItem,
  ListItem,
  ModelInstanceFormData,
  ModelInstanceListItem
} from '../config/types';

export const MODELS_API = '/models';

export const MODEL_INSTANCE_API = '/model-instances';

export const MODEL_EVALUATIONS = '/model-evaluations';

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
      methos: 'GET',
      ...options
    }
  );
}

export async function queryGPUList(params?: Global.SearchParams) {
  return request<Global.PageResponse<GPUListItem>>(`/gpu-devices`, {
    methos: 'GET',
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

// ===================== Model Instances end =====================

// ===================== call huggingface quicksearch api =====================

const MODEL_SCOPE_LIST_MODEL_API =
  'https://www.modelscope.cn/api/v1/dolphin/models';

const MODE_SCOPE_MODEL_FIELS_API = 'https://modelscope.cn/api/v1/models/';

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
    return { category: 'libraries', predicate: 'contains', values: [tag] };
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
    return null;
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
    return null;
  }

  return res.json();
}

// list models from huggingface
export async function queryHuggingfaceModels(
  params: {
    search: {
      query: string;
      tags: string[];
      sort?: string;
      task?: PipelineType;
    };
  },
  options?: any
) {
  const result = [];
  for await (const model of listModels({
    ...params,
    ...options,
    limit: 500,
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
  return request<Global.PageResponse<CatalogItem>>(
    `/model-sets?${qs.stringify(params)}`,
    {
      methos: 'GET',
      ...options
    }
  );
}

export async function queryCatalogItemSpec(
  params: { id: number },
  options?: any
) {
  return await request<Global.PageResponse<CatalogSpec>>(
    `/model-sets/${params.id}/specs`,
    {
      method: 'GET',
      ...options,
      params
    }
  );
}

export async function evaluationsModelSpec(
  data: {
    model_specs: EvaluateSpec[];
  },
  options: { token: any }
) {
  return request<{ results: EvaluateResult[] }>(`${MODEL_EVALUATIONS}`, {
    method: 'POST',
    data,
    cancelToken: options?.token
  });
}

// export const evaluationsModelSpec = async (
//   data: {
//     model_specs: EvaluateSpec[];
//   },
//   options: { token: any }
// ) => {
//   const response = await fetch(`v1/${MODEL_EVALUATIONS}`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data)
//   });
//   return response.json();
// };
