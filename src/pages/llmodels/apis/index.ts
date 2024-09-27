import { downloadFile, listFiles, listModels } from '@huggingface/hub';
import { PipelineType } from '@huggingface/tasks';
import { request } from '@umijs/max';
import qs from 'query-string';
import {
  FormData,
  GPUListItem,
  ListItem,
  ModelInstanceFormData,
  ModelInstanceListItem
} from '../config/types';

export const MODELS_API = '/models';

export const MODEL_INSTANCE_API = '/model-instances';

// ===================== Models =====================
export async function queryModelsList(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<ListItem>>(`${MODELS_API}`, {
    methos: 'GET',
    ...options,
    params
  });
}

export async function queryGPUList() {
  return request<Global.PageResponse<GPUListItem>>(`/gpu-devices`, {
    methos: 'GET'
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
  params: Global.Pagination & { query?: string; id: number }
) {
  return request<Global.PageResponse<ModelInstanceListItem>>(
    `${MODELS_API}/${params.id}/instances`,
    {
      method: 'GET',
      params
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

export async function callHuggingfaceQuickSearch(params: any) {
  return request<{
    models: Array<{
      id: string;
      _id: string;
    }>;
  }>(`https://huggingface.co/api/quicksearch`, {
    method: 'GET',
    params
  });
}

const HUGGINGFACE_API = 'https://huggingface.co/api/models';

const MODEL_SCOPE_LIST_MODEL_API =
  '/proxy?url=https://www.modelscope.cn/api/v1/dolphin/models';

const MODEL_SCOPE_DETAIL_MODEL_API =
  '/proxy?url=https://www.modelscope.cn/api/v1/dolphin/models/';

const MODE_SCOPE_MODEL_FIELS_API =
  '/proxy?url=https://modelscope.cn/api/v1/models/';

export async function queryHuggingfaceModelDetail(
  params: { repo: string },
  options?: any
) {
  return request(`${HUGGINGFACE_API}/${params.repo}`, {
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
    filterGGUF?: boolean;
  },
  config?: any
) {
  const Criterion = params.filterGGUF
    ? {
        Criterion: [
          { category: 'tags', predicate: 'contains', values: ['gguf'] }
        ]
      }
    : {};
  const res = await fetch(`${MODEL_SCOPE_LIST_MODEL_API}`, {
    method: 'PUT',
    signal: config?.signal,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...params,
      ...Criterion,
      Name: `${params.Name}`,
      PageSize: 100,
      PageNumber: 1
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
  return request(`${MODE_SCOPE_MODEL_FIELS_API}${params.name}`, {
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function queryModelScopeModelFiles(
  params: { name: string },
  options?: any
) {
  const res = await fetch(
    `${MODE_SCOPE_MODEL_FIELS_API}${params.name}/repo/files?${qs.stringify({
      Revision: 'master',
      Recursive: true,
      Root: ''
    })}`,
    {
      method: 'GET',
      signal: options?.signal,
      body: null
    }
  );

  if (!res.ok) {
    throw new Error('Network response was not ok');
    return null;
  }

  return res.json();
}

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
    limit: 100,
    additionalFields: ['sha', 'tags'],
    fetch(url: string, config: any) {
      try {
        const newUrl = params.search.sort
          ? `${url}&sort=${params.search.sort}`
          : url;
        return fetch(`${newUrl}`, {
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
        return fetch(url, {
          ...config,
          signal: options?.signal
        });
      } catch (error) {
        console.log('queryHuggingfaceModels error===', error);
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
        return fetch(url, {
          ...config,
          signal: options?.signal
        });
      }
    })
  )?.text();
  return res;
}
