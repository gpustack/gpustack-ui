import { request } from '@umijs/max';

export const CHAT_API = '/v1-openai/chat/completions';

export const OPENAI_MODELS = '/v1-openai/models';

export async function execChatCompletions(params: any) {
  return request(`${CHAT_API}`, {
    method: 'POST',
    data: params
  });
}

export const queryModelsList = async () => {
  return request(`${OPENAI_MODELS}`);
};
