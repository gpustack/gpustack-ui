import { map } from 'lodash';
import { MessageItem } from './types';

export const Roles = {
  User: 'user',
  Assistant: 'assistant',
  System: 'system'
};
export const playGroundRoles = [
  {
    key: Roles.User,
    label: 'playground.user'
  },
  {
    key: Roles.Assistant,
    label: 'playground.assitant'
  }
];

export const formatMessageParams = (messageList: any[]) => {
  const result: any[] = [];

  messageList.forEach((item) => {
    const { role, content, title, imgs, uid } = item;
    content?.forEach((contentItem: any) => {
      if (contentItem.type === 'text') {
        result.push({
          role,
          content: contentItem.text
        });
      }
      if (contentItem.type === 'image_url') {
        result.push({
          role,
          content: [
            {
              ...contentItem
            }
          ]
        });
      }
    });
  });
  return result;
};

export const generateMessagesByListContent = (messageList: any[]) => {
  if (!messageList.length) return [];

  return messageList.map((item: MessageItem) => {
    const content = map(
      item.imgs,
      (img: { uid: string | number; dataUrl: string }) => {
        return {
          type: 'image_url',
          image_url: {
            url: img.dataUrl
          }
        };
      }
    );

    if (item.content) {
      content.push({
        type: 'text',
        text: item.content
      });
    }
    return {
      role: item.role,
      content: content
    };
  });
};

export const generateMessages = (messageList: Omit<MessageItem, 'uid'>[]) => {
  if (!messageList.length) return [];

  const result: any[] = [];

  messageList.forEach((item: Omit<MessageItem, 'uid'>) => {
    if (item.imgs?.length) {
      const imgList = item.imgs.map((img) => {
        return {
          type: 'image_url',
          image_url: {
            url: img.dataUrl
          }
        };
      });
      result.push({
        role: item.role,
        content: imgList
      });
    }
    if (item.content) {
      result.push({
        role: item.role,
        content: item.content
      });
    }
  });

  return result;
};

export const OpenAIViewCode = {
  chat: {
    api: 'chat/completions',
    clientType: 'chat.completions',
    logcommand: 'choices[0].message.content'
  },
  embeddings: {
    api: 'embeddings',
    clientType: 'embeddings',
    logcommand: 'data[0].embedding'
  },
  images: {
    api: 'images/generations',
    clientType: 'images.generate'
  }
};
