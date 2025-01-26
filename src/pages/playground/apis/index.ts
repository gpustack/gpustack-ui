import { request } from '@umijs/max';
import qs from 'query-string';

export const CHAT_API = '/v1-openai/chat/completions';

export const CREAT_IMAGE_API = '/v1-openai/images/generations';
export const EDIT_IMAGE_API = '/v1-openai/images/edits';

export const EMBEDDING_API = '/v1-openai/embeddings';

export const OPENAI_MODELS = '/v1-openai/models';

export const RERANKER_API = '/rerank';

export const AUDIO_TEXT_TO_SPEECH_API = '/v1-openai/audio/speech';

export const AUDIO_SPEECH_TO_TEXT_API = '/v1-openai/audio/transcriptions';

export async function execChatCompletions(params: any) {
  return request(`${CHAT_API}`, {
    method: 'POST',
    data: params
  });
}

export const queryModelsList = async (params: any) => {
  return request(`${OPENAI_MODELS}?${qs.stringify(params)}`, {
    method: 'GET'
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
    encoding_format?: string;
    dimensions?: number;
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
  const res = await fetch(`${CREAT_IMAGE_API}`, {
    method: 'POST',
    body: JSON.stringify(params),
    signal: options.signal,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    return {
      error: true,
      data: await res.json()
    };
  }
  return res.json();
};

// ============ audio ============
export const textToSpeech = async (params: any, options?: any) => {
  const res = await fetch(AUDIO_TEXT_TO_SPEECH_API, {
    method: 'POST',
    body: JSON.stringify(params.data),
    signal: params.signal
  });
  if (!res.ok) {
    return await res.json();
  }

  const audioBlob = await res.blob();
  if (audioBlob?.type?.indexOf('audio') === -1) {
    return {
      url: '',
      type: ''
    };
  }
  const audioUrl = audioBlob.size > 0 ? URL.createObjectURL(audioBlob) : '';
  return {
    url: audioUrl,
    type: audioBlob.type
  };
};

export const speechToText = async (params: any, options?: any) => {
  return request(AUDIO_SPEECH_TO_TEXT_API, {
    method: 'POST',
    data: params.data,
    cancelToken: options?.cancelToken,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const queryModelVoices = async (params: { model: string }) => {
  return request(`/voices`, {
    method: 'GET',
    params,
    skipErrorHandler: true
  });
};
