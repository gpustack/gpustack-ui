import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import { downloadFile } from '@/utils/download-stream';
import { request } from '@umijs/max';
import { message } from 'antd';
import { GPUDeviceItem, ListItem, ModelFile } from '../config/types';

export const WORKERS_API = '/workers';
export const GPU_DEVICES_API = '/gpu-devices';
export const MODEL_FILES_API = '/model-files';

const matchFilename = (disposition: string | null): string | undefined => {
  if (!disposition) return '';

  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : '';
  return filename;
};

// download stream data and save as a csv file
export async function downloadWorkerPrivateKey({
  id,
  name
}: {
  id: string | number;
  name?: string;
}) {
  try {
    const res = await fetch(
      `/${GPUSTACK_API_BASE_URL}${WORKERS_API}/${id}/privatekey`
    );
    // header
    const contentDispostion = res.headers.get('content-Disposition');
    const filename =
      matchFilename(contentDispostion) || `${name}-privatekey.pem`;
    if (res.ok) {
      const blob = await res.blob();
      downloadFile(blob, filename);
    }
  } catch (error) {
    message.error('Download failed');
  }
}

export async function queryWorkersList<T extends Record<string, any>>(
  params: Global.SearchParams & T,
  options?: {
    token: any;
  }
) {
  return request<Global.PageResponse<ListItem>>(`${WORKERS_API}`, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function queryGpuDevicesList(params: Global.SearchParams) {
  return request<Global.PageResponse<GPUDeviceItem>>(`${GPU_DEVICES_API}`, {
    method: 'GET',
    params
  });
}

export async function queryGPUDeviceItem(id: string) {
  return request<GPUDeviceItem>(`${GPU_DEVICES_API}/${id}`, {
    method: 'GET'
  });
}

export async function deleteWorker(id: string | number) {
  return request(`${WORKERS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function updateWorker(id: string | number, data: any) {
  return request(`${WORKERS_API}/${id}`, {
    method: 'PUT',
    data
  });
}

export async function queryModelFilesList(params: Global.SearchParams) {
  return request<Global.PageResponse<ModelFile>>(MODEL_FILES_API, {
    method: 'GET',
    params
  });
}

export async function deleteModelFile(
  id: string | number,
  params: { checked: boolean }
) {
  return request<Global.PageResponse<ModelFile>>(
    `${MODEL_FILES_API}/${id}?cleanup=${params.checked}`,
    {
      method: 'DELETE'
    }
  );
}

export async function updateModelFile(id: string | number, data: any) {
  return request<Global.PageResponse<ModelFile>>(`${MODEL_FILES_API}/${id}`, {
    method: 'PUT',
    data
  });
}

export async function downloadModelFile(data: any) {
  return request<Global.PageResponse<ModelFile>>(MODEL_FILES_API, {
    method: 'POST',
    data
  });
}

export async function retryDownloadModelFile(id: string | number) {
  return request<Global.PageResponse<ModelFile>>(
    `${MODEL_FILES_API}/${id}/reset`,
    {
      method: 'POST'
    }
  );
}
