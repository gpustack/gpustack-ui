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
import { formatCurlArgs } from '@/pages/playground/view-code/utils';
import { useIntl } from '@umijs/max';
import { useState } from 'react';
import { modelCategoriesMap } from '../config';

const API_MAP: Record<
  string,
  { api: string; generateCurlCode: (args: any) => string }
> = {
  [modelCategoriesMap.embedding]: {
    api: EMBEDDING_API,
    generateCurlCode: generateEmbeddingCurlCode
  },
  [modelCategoriesMap.llm]: {
    api: CHAT_API,
    generateCurlCode: generateLLmCurlCode
  },
  [modelCategoriesMap.image]: {
    api: CREAT_IMAGE_API,
    generateCurlCode: generateImageCurlCode
  },
  [modelCategoriesMap.text_to_speech]: {
    api: AUDIO_TEXT_TO_SPEECH_API,
    generateCurlCode: generateTextToSpeechCurlCode
  },
  [modelCategoriesMap.speech_to_text]: {
    api: AUDIO_SPEECH_TO_TEXT_API,
    generateCurlCode: generateSpeechToTextCurlCode
  },
  [modelCategoriesMap.reranker]: {
    api: RERANKER_API,
    generateCurlCode: generateRerankCurlCode
  }
};

const langOptions = [{ label: 'Curl', value: 'bash' }];

const generateCode = ({ api: url, parameters }: Record<string, any>) => {
  const host = window.location.origin;
  const api = '/model/proxy/v1/';

  // ========================= Curl =========================
  const curlCode = `
curl ${host}${api} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
${formatCurlArgs(parameters, false)}`.trim();

  return curlCode;
};

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
          generateCurlCode: config.generateCurlCode
        };
      }
    }
    return {
      category: modelCategoriesMap.llm,
      api: CHAT_API,
      generateCurlCode: generateLLmCurlCode
    };
  };

  const openProxyModal = (data?: any) => {
    const { api, generateCurlCode } = getModelCategory(data?.categories || []);

    setModalStatus({
      open: true,
      codeValue: generateCurlCode({
        api,
        modelProxy: true,
        parameters: {
          model: data?.name || ''
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
