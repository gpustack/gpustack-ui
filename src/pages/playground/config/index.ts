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
    clientType: 'chat.completions.create',
    logcommand: 'choices[0].message.content'
  },
  embeddings: {
    api: 'embeddings',
    clientType: 'embedding.create',
    logcommand: 'data[0].embedding'
  },
  images: {
    api: 'images/generations',
    clientType: 'images.generate',
    logcommand: 'data[0].b64_json'
  },
  imageAdvanced: {
    api: '/v1-openai/images/generations',
    clientType: 'images.generate',
    logcommand: {
      python: "json()['data'][0]['b64_json']",
      node: 'data.data[0].b64_json'
    }
  },
  rerank: {
    api: '/v1/rerank',
    logcommand: {
      python: 'json()',
      node: 'data'
    }
  }
};

export const promptList = [
  'a lovely cat.',
  "Digital art, portrait of an anthropomorphic roaring Tiger warrior with full armor, close up in the middle of a battle, behind him there is a banner with the text 'Open Source'.",
  'An astronaut riding a green horse.',
  "a female character with long, flowing hair that appears to be made of ethereal, swirling patterns resembling the Northern Lights or Aurora Borealis. The background is dominated by deep blues and purples, creating a mysterious and dramatic atmosphere. The character's face is serene, with pale skin and striking features. She wears a dark-colored outfit with subtle patterns. The overall style of the artwork is reminiscent of fantasy or supernatural genres.",
  "A whimsical and creative image depicting a hybrid creature that is a mix of a waffle and a hippopotamus, basking in a river of melted butter amidst a breakfast-themed landscape. It features the distinctive, bulky body shape of a hippo. However, instead of the usual grey skin, the creature's body resembles a golden-brown, crispy waffle fresh off the griddle. The skin is textured with the familiar grid pattern of a waffle, each square filled with a glistening sheen of syrup. The environment combines the natural habitat of a hippo with elements of a breakfast table setting, a river of warm, melted butter, with oversized utensils or plates peeking out from the lush, pancake-like foliage in the background, a towering pepper mill standing in for a tree.  As the sun rises in this fantastical world, it casts a warm, buttery glow over the scene. The creature, content in its butter river, lets out a yawn. Nearby, a flock of birds take flight.",
  'A cinematic shot of a baby racoon wearing an intricate italian priest robe.',
  'Create portraits of characters in the style of classical oil painting, Capturing the essence of Chinese aristocracy in the Han Dynasty period. This portrait should feature a Chinese male character dressed in exquisite and gorgeous Chinese Han style clothing, with a dignified demeanor. The background should be a simple and elegant wallpaper pattern, with the face and upper body of the character as the focus. The lighting should be soft and diffuse, highlighting the characteristics of the character and the complex details of the clothing. The color palette should be rich and warm, with red, gold, and dark green.',
  'photo of a young woman with long, wavy brown hair tied in a bun and glasses. She has a fair complexion and is wearing subtle makeup, emphasizing her eyes and lips. She is dressed in a black top. The background appears to be an urban setting with a building facade, and the sunlight casts a warm glow on her face.',
  'A portrait of women with blue eyes.'
];
