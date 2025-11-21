import icons from '@/components/icon-font/icons';
import HotKeys from '@/config/hotkeys';
import React from 'react';
import { modelCategoriesMap, modelSourceMap } from './index';

export const modalConfig: Record<
  string,
  { show: boolean; width: string | number; source: any; isGGUF?: boolean }
> = {
  [modelSourceMap.huggingface_value]: {
    show: true,
    width: 'calc(100vw - 220px)',
    source: modelSourceMap.huggingface_value
  },
  [modelSourceMap.modelscope_value]: {
    show: true,
    width: 'calc(100vw - 220px)',
    source: modelSourceMap.modelscope_value
  },
  [modelSourceMap.local_path_value]: {
    show: true,
    width: 600,
    source: modelSourceMap.local_path_value
  }
};

interface ActionItem {
  label: string;
  key: string;
  icon: React.ReactNode;
  props?: {
    danger?: boolean;
  };
}

export const ActionList: ActionItem[] = [
  {
    label: 'common.button.edit',
    key: 'edit',
    icon: icons.EditOutlined
  },
  // {
  //   label: 'common.button.detail',
  //   key: 'details',
  //   icon: icons.FileTextOutlined
  // },
  {
    label: 'models.openinplayground',
    key: 'chat',
    icon: icons.ExperimentOutlined
  },
  {
    label: 'common.button.start',
    key: 'start',
    icon: icons.Play
  },
  {
    label: 'models.table.button.apiAccessInfo',
    key: 'api',
    icon: icons.ApiOutlined
  },
  {
    label: 'models.button.accessSettings',
    key: 'accessControl',
    icon: icons.Permission
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    icon: icons.Stop
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    props: {
      danger: true
    },
    icon: icons.DeleteOutlined
  }
];

export const ButtonList = [
  {
    label: 'common.button.start',
    key: 'start',
    icon: icons.Play
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    icon: icons.Stop
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

export const onLineSourceOptions = [
  {
    label: 'Hugging Face',
    locale: false,
    value: modelSourceMap.huggingface_value,
    key: modelSourceMap.huggingface_value,
    icon: icons.HF
  },
  {
    label: 'ModelScope',
    locale: false,
    value: modelSourceMap.modelscope_value,
    key: modelSourceMap.modelscope_value,
    icon: icons.ModelScope
  },
  {
    label: 'models.form.localPath',
    locale: true,
    value: modelSourceMap.local_path_value,
    key: modelSourceMap.local_path_value,
    icon: icons.LocalPath
  }
];

export const sourceOptions = [
  {
    label: 'menu.models.modelCatalog',
    locale: true,
    value: 'catalog',
    key: 'catalog',
    icon: icons.Catalog
  },
  ...onLineSourceOptions
];

export const generateSource = (record: any) => {
  if (record.source === modelSourceMap.modelscope_value) {
    return `${modelSourceMap.modelScope}/${record.model_scope_model_id}`;
  }
  if (record.source === modelSourceMap.huggingface_value) {
    return `${modelSourceMap.huggingface}/${record.huggingface_repo_id}`;
  }
  if (record.source === modelSourceMap.local_path_value) {
    return `${record.local_path}`;
  }
  if (record.source === modelSourceMap.ollama_library_value) {
    return `${modelSourceMap.ollama_library}/${record.ollama_library_model_name}`;
  }
  return '';
};

export const modelFileActions = [
  {
    label: 'common.button.deploy',
    key: 'deploy',
    icon: icons.Deployment
  },
  {
    label: 'resources.modelfiles.retry.download',
    key: 'retry',
    icon: icons.DownloadOutlined
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    props: {
      danger: true
    },
    icon: icons.DeleteOutlined
  }
];

export const categoryToPathMap: Record<string, string> = {
  [modelCategoriesMap.llm]: '/playground/chat',
  [modelCategoriesMap.image]: '/playground/text-to-image',
  [modelCategoriesMap.text_to_speech]: '/playground/speech?type=tts',
  [modelCategoriesMap.speech_to_text]: '/playground/speech?type=stt',
  [modelCategoriesMap.reranker]: '/playground/rerank',
  [modelCategoriesMap.embedding]: '/playground/embedding'
};

export const hotkeyConfigs = [
  {
    keys: HotKeys.NEW1,
    width: 'calc(100vw - 220px)',
    source: modelSourceMap.huggingface_value
  },
  {
    keys: HotKeys.NEW3,
    width: 'calc(100vw - 220px)',
    source: modelSourceMap.modelscope_value
  },
  {
    keys: HotKeys.NEW2,
    width: 600,
    source: modelSourceMap.ollama_library_value
  },
  { keys: HotKeys.NEW4, width: 600, source: modelSourceMap.local_path_value }
];

/**
 * hotkeyConfigs.map(({ keys, width, source }) =>
       useHotkeys(
         keys.join(','),
         () => {
           setOpenDeployModal({
             show: true,
             width,
             source,
             gpuOptions: gpuDeviceList.current
           });
         },
         {
           preventDefault: true,
           enabled: !openAddModal && !openDeployModal.show && !openLogModal
         }
       )
     );
 * 
 */
