import _ from 'lodash';
import { CREAT_IMAGE_API } from '../apis';
import { AudioData, MessageItem } from './types';

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

export const acceptType =
  '.txt, .doc, .docx, .xls, .xlsx, .csv, .md, .pdf, .eml, .msg, .ppt, .pptx, .xml, .epub, .html';

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
    if (item.imgs?.length || item.audio?.length) {
      const content: any[] = [];
      // image
      _.each(item.imgs, (img: { uid: string | number; dataUrl: string }) => {
        content.push({
          type: 'image_url',
          image_url: {
            url: img.dataUrl
          }
        });
      });

      // audio
      if (item.audio?.length) {
        _.each(item.audio, (item: AudioData) => {
          content.push({
            type: 'input_audio',
            input_audio: {
              data: item.base64,
              format: item.format
            }
          });
        });
      }

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
    }

    return _.omit(item, ['uid', 'imgs', 'audio']);
  });
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
    api: `${CREAT_IMAGE_API}`,
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

export const SpeechToTextFormat = ['.mp3', '.mp4', '.wav', '.m4a'];

export const promptList = [
  'a lovely cat.',
  "Digital art, portrait of an anthropomorphic roaring Tiger warrior with full armor, close up in the middle of a battle, behind him there is a banner with the text 'Open Source'.",
  'An astronaut riding a green horse.',
  "a female character with long, flowing hair that appears to be made of ethereal, swirling patterns resembling the Northern Lights or Aurora Borealis. The background is dominated by deep blues and purples, creating a mysterious and dramatic atmosphere. The character's face is serene, with pale skin and striking features. She wears a dark-colored outfit with subtle patterns. The overall style of the artwork is reminiscent of fantasy or supernatural genres.",
  "A whimsical and creative image depicting a hybrid creature that is a mix of a waffle and a hippopotamus, basking in a river of melted butter amidst a breakfast-themed landscape. It features the distinctive, bulky body shape of a hippo. However, instead of the usual grey skin, the creature's body resembles a golden-brown, crispy waffle fresh off the griddle. The skin is textured with the familiar grid pattern of a waffle, each square filled with a glistening sheen of syrup. The environment combines the natural habitat of a hippo with elements of a breakfast table setting, a river of warm, melted butter, with oversized utensils or plates peeking out from the lush, pancake-like foliage in the background, a towering pepper mill standing in for a tree.  As the sun rises in this fantastical world, it casts a warm, buttery glow over the scene. The creature, content in its butter river, lets out a yawn. Nearby, a flock of birds take flight.",
  'A cinematic shot of a baby racoon wearing an intricate italian priest robe.',
  'Create portraits of characters in the style of classical oil painting, Capturing the essence of Chinese aristocracy in the Han Dynasty period. This portrait should feature a Chinese male character dressed in exquisite and gorgeous Chinese Han style clothing, with a dignified demeanor. The background should be a simple and elegant wallpaper pattern, with the face and upper body of the character as the focus. The lighting should be soft and diffuse, highlighting the characteristics of the character and the complex details of the clothing. The color palette should be rich and warm, with red, gold, and dark green.',
  'photo of a young woman with long, wavy brown hair tied in a bun and glasses. She has a fair complexion and is wearing subtle makeup, emphasizing her eyes and lips. She is dressed in a black top. The background appears to be an urban setting with a building facade, and the sunlight casts a warm glow on her face.',
  'A portrait of women with blue eyes.',
  "A close-up image of a light brown and cream-colored Bengal kitten, lying on a cream-colored surface, with a person's hand gently touching the kitten's head, capturing the soft textures of the fur and the subtle patterns, emphasizing the natural light and shadow play on the animal's body.",
  'A German Shepherd dog playfully carrying a stick, with a smaller German Shepherd puppy running alongside in a grassy field, showcasing a rich, natural color palette of greens, browns, and tans, and a dynamic action shot with a focus on vibrant texture and depth of field.',
  "A young woman with long, dark, wavy hair, wearing a light olive green flowing dress, looks directly at the camera, standing near a window with a soft out-of-focus background of dark green curtains and light green.  The image should be sharp, focused on the woman's face, and evoke a natural, soft beauty aesthetic with a slightly muted color palette.",
  'A sleepy panda cub rests comfortably on a large, ornate tree branch, its black and white fur contrasting against the reddish-brown bark of the textured, sculpted tree trunk, surrounded by lush green foliage and branches.  ',
  'A full shot of two people jogging at sunset,  featuring a vibrant, warm color palette shifting from twilight blues to peachy-orange tones, with visible sun rays and lens flares, conveying a sense of leisure and athleticism.',
  'A close-up portrait of a golden retriever wearing black-framed glasses,  exhibiting a rich golden-brown coat with a fluffy texture,  and a neutral, light gray background.'
];

export const extractErrorMessage = (result: any) => {
  const errorMsg =
    result?.data?.data?.detail ||
    result?.data?.data?.message ||
    result?.data?.error?.message ||
    result?.data?.error ||
    result?.data?.detail ||
    result?.data?.message ||
    result?.error?.message ||
    result?.detail ||
    result?.message ||
    result?.data ||
    (result?.error === true ? 'Unknown error' : result?.error);

  if (errorMsg) {
    return typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
  }
  try {
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch {
    return 'Unknown error';
  }
};

export const scaleImageSize = (size: { width: number; height: number }) => {
  const { width, height } = size;
  const scale = 64;
  const newWidth = Math.floor(width / scale) * scale;
  const newHeight = Math.floor(height / scale) * scale;
  return { width: newWidth, height: newHeight };
};

// png, jpg, jpeg
const acceptImageType = ['image/png', 'image/jpg', 'image/jpeg'];
export const EDIT_IMAGE_ACCEPT = acceptImageType.join(',');
