import { request } from '@umijs/max';

export const CHAT_API = '/chat/completions';

export async function execChatCompletions(params: any) {
  return request(`${CHAT_API}`, {
    method: 'POST',
    data: params
  });
}

export const fetchChatStream = async (params: any) => {
  const response = await fetch(`/v1${CHAT_API}`, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
    return null;
  }
  const reader = response?.body?.getReader();
  const decoder = new TextDecoder('utf-8');
  return {
    reader,
    decoder
  };
};

export const receiveChatStream = async (
  reader: any,
  decoder: TextDecoder,
  callback: (data: any) => void
) => {
  const { done, value } = await reader.read();

  if (done) {
    return;
  }

  let chunk = decoder.decode(value, { stream: true });
  if (chunk.startsWith('data:')) {
    chunk = chunk.substring('data:'.length);
  }
  const item = JSON.parse(chunk?.trim());
  callback(item);
  await receiveChatStream(reader, decoder, callback);
};
