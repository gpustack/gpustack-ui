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
import { useIntl } from '@umijs/max';
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
      query: '',
      documents: []
    },
    generateCurlCode: generateEmbeddingCurlCode
  },
  [modelCategoriesMap.llm]: {
    api: CHAT_API,
    parameters: {
      messages: []
    },
    generateCurlCode: generateLLmCurlCode
  },
  [modelCategoriesMap.image]: {
    api: CREAT_IMAGE_API,
    parameters: {
      n: 1,
      size: '512x512',
      response_format: 'b64_json'
    },
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
    parameters: {
      language: 'auto'
    },
    generateCurlCode: generateSpeechToTextCurlCode
  },
  [modelCategoriesMap.reranker]: {
    api: RERANKER_API,
    parameters: {
      messages: []
    },
    generateCurlCode: generateRerankCurlCode
  }
};

const useGenericProxy = () => {
  const [modalStatus, setModalStatus] = useState<{
    codeValue: string;
  }>({ codeValue: '' });
  const intl = useIntl();

  const langOptions = [
    { label: intl.formatMessage({ id: 'common.title.example' }), value: 'bash' }
  ];

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
        messages: []
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
          model: data?.name || '',
          ...parameters
        }
      })
    });
  });

  const GenericProxyCommandCode = (
    <CommandViewer
      showTitle={true}
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
