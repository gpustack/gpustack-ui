import { request } from '@umijs/max';

export const CHAT_API = '/v1-openai/chat/completions';

export const CREAT_IMAGE_API = '/v1-openai/images/generations';

export const EMBEDDING_API = '/v1-openai/embeddings';

export const OPENAI_MODELS = '/v1-openai/models';

export const RERANKER_API = '/rerank';

export async function execChatCompletions(params: any) {
  return request(`${CHAT_API}`, {
    method: 'POST',
    data: params
  });
}

export const queryModelsList = async (params: any) => {
  return request(`${OPENAI_MODELS}`, {
    method: 'GET',
    params
  });
};

export const rerankerQuery = async (
  params: {
    model: string;
    query: string;
    top_n: number;
    documents: string[];
  },
  options?: any
) => {
  return request(`${RERANKER_API}`, {
    method: 'POST',
    data: params,
    cancelToken: options?.cancelToken
  });
};

export const handleEmbedding = async (
  params: {
    model: string;
    input: string[];
  },
  options?: any
) => {
  return request(`${EMBEDDING_API}`, {
    method: 'POST',
    data: params,
    cancelToken: options?.cancelToken
  });
};

export const createImages = async (
  params: {
    model: string;
    prompt: string;
    n: number;
    size: string;
  },
  options?: any
) => {
  return request(`${CREAT_IMAGE_API}`, {
    method: 'POST',
    data: params,
    cancelToken: options?.cancelToken
  });
};
