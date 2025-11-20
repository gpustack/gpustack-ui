import CommandViewer from '@/pages/_components/command-viewer';
import {
  AUDIO_SPEECH_TO_TEXT_API,
  AUDIO_TEXT_TO_SPEECH_API,
  CHAT_API,
  CREAT_IMAGE_API,
  EMBEDDING_API,
  MODEL_PROXY,
  RERANKER_API
} from '@/pages/playground/apis';
import {
  generateSpeechToTextCurlCode,
  generateTextToSpeechCurlCode
} from '@/pages/playground/view-code/audio';
import { generateEmbeddingCurlCode } from '@/pages/playground/view-code/embedding';
import { generateImageCurlCode } from '@/pages/playground/view-code/image';
import { generateLLmCurlCode } from '@/pages/playground/view-code/llm';
import { generateRerankCurlCode } from '@/pages/playground/view-code/rerank';
import { useMemoizedFn } from 'ahooks';
import { useState } from 'react';
import { modelCategoriesMap } from '../config';

const API_MAP: Record<
  string,
  { api: string; parameters: any; generateCurlCode: (args: any) => string }
> = {
  [modelCategoriesMap.embedding]: {
    api: EMBEDDING_API,
    parameters: {
      query: 'What are the benefits of regular exercise?',
      documents: [
        'Regular physical activity helps improve cardiovascular health and mental well-being.',
        'Eating too much sugar can lead to health issues.',
        'Exercise is often done in gyms or outdoors.'
      ]
    },
    generateCurlCode: generateEmbeddingCurlCode
  },
  [modelCategoriesMap.llm]: {
    api: CHAT_API,
    parameters: {
      messages: [
        {
          role: 'user',
          content: 'Hello, introduce yourself'
        }
      ]
    },
    generateCurlCode: generateLLmCurlCode
  },
  [modelCategoriesMap.image]: {
    api: CREAT_IMAGE_API,
    parameters: {},
    generateCurlCode: generateImageCurlCode
  },
  [modelCategoriesMap.text_to_speech]: {
    api: AUDIO_TEXT_TO_SPEECH_API,
    parameters: {
      response_format: 'mp3',
      input: ''
    },
    generateCurlCode: generateTextToSpeechCurlCode
  },
  [modelCategoriesMap.speech_to_text]: {
    api: AUDIO_SPEECH_TO_TEXT_API,
    parameters: {},
    generateCurlCode: generateSpeechToTextCurlCode
  },
  [modelCategoriesMap.reranker]: {
    api: RERANKER_API,
    parameters: {
      messages: [
        {
          role: 'user',
          content: 'Hello, introduce yourself'
        }
      ]
    },
    generateCurlCode: generateRerankCurlCode
  }
};

const langOptions = [{ label: 'Curl', value: 'bash' }];

const useGenericProxy = () => {
  const [modalStatus, setModalStatus] = useState<{
    codeValue: string;
  }>({ codeValue: '' });

  const getModelCategory = (categories: string[]) => {
    for (const [category, config] of Object.entries(API_MAP)) {
      if (categories.includes(category)) {
        return {
          category,
          api: `${MODEL_PROXY}${config.api}`,
          parameters: config.parameters,
          generateCurlCode: config.generateCurlCode
        };
      }
    }
    return {
      category: modelCategoriesMap.llm,
      api: CHAT_API,
      parameters: {
        messages: [
          {
            role: 'user',
            content: 'Hello, introduce yourself'
          }
        ]
      },
      generateCurlCode: generateLLmCurlCode
    };
  };

  const openProxyModal = useMemoizedFn((data?: any) => {
    const { api, generateCurlCode, parameters } = getModelCategory(
      data?.categories || []
    );

    setModalStatus({
      codeValue: generateCurlCode({
        api,
        modelProxy: true,
        parameters: {
          model: data?.name || ''
        }
      })
    });
  });

  const GenericProxyCommandCode = (
    <CommandViewer
      code={modalStatus.codeValue}
      copyText={modalStatus.codeValue}
      options={langOptions}
      defaultValue={'bash'}
      height={200}
    ></CommandViewer>
  );

  return {
    GenericProxyCommandCode,
    openProxyModal,
    setModalStatus
  };
};

export default useGenericProxy;
