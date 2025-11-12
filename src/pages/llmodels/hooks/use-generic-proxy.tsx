import ScrollerModal from '@/components/scroller-modal';
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
  const intl = useIntl();
  const [modalStatus, setModalStatus] = useState<{
    open: boolean;
    codeValue: string;
  }>({ open: false, codeValue: '' });

  const onCancel = () => {
    setModalStatus({
      open: false,
      codeValue: ''
    });
  };

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

  const openProxyModal = (data?: any) => {
    const { api, generateCurlCode, parameters } = getModelCategory(
      data?.categories || []
    );

    setModalStatus({
      open: true,
      codeValue: generateCurlCode({
        api,
        modelProxy: true,
        parameters: {
          model: data?.name || '',
          ...parameters
        }
      })
    });
  };

  const GenericProxyModal = (
    <ScrollerModal
      title={intl.formatMessage({
        id: 'models.form.generic_proxy.button'
      })}
      open={modalStatus.open}
      centered={true}
      onCancel={onCancel}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={700}
      footer={false}
    >
      <div
        style={{ marginBottom: 8 }}
        dangerouslySetInnerHTML={{
          __html: intl.formatMessage({ id: 'models.table.genericProxy' })
        }}
      ></div>
      <CommandViewer
        code={modalStatus.codeValue}
        copyText={modalStatus.codeValue}
        options={langOptions}
        defaultValue={'bash'}
      ></CommandViewer>
    </ScrollerModal>
  );

  return {
    GenericProxyModal,
    openProxyModal,
    setModalStatus
  };
};

export default useGenericProxy;
