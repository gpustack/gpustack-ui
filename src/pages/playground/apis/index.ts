import { request } from '@umijs/max';

export const CHAT_API = '/chat/completions';

export async function execChatCompletions(params: any) {
  return request(`${CHAT_API}`, {
    method: 'POST',
    data: params
  });
}
