import HotKeys from '@/config/hotkeys';
import { IconFont, icons } from '@gpustack/core-ui';
import React from 'react';
import {
  modelCategoriesMap,
  modelSourceMap,
  MyModelsStatusValueMap
} from './index';

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
    label: 'models.button.exportYaml',
    key: 'export',
    icon: icons.DownloadOutlined
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
  ...onLineSourceOptions,
  {
    // A noun, like every other entry here: the dropdown names where the
    // deployment comes from, not what is done to it.
    label: 'models.form.yamlFile',
    locale: true,
    value: 'import_yaml',
    key: 'import_yaml',
    icon: icons.Yaml
  }
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

export interface MyModelAction {
  key: string;
  label: string;
  locale?: boolean;
  // Menu position; the list is sorted by it so a plugin-contributed
  // action can slot between built-ins instead of only appending.
  order: number;
  icon?: React.ReactNode;
  // Per-model visibility. Omitted → always shown.
  show?: (model: Record<string, any>) => boolean;
  // Self-contained handler (a plugin action owns its own overlay);
  // built-ins leave it off and are dispatched by `key` on the card.
  onClick?: (model: Record<string, any>) => void;
}

// Actions in a my-models card's dropdown. Kept next to
// `categoryToPathMap` — the playground route table the built-in action
// drives — so the entry and its destination change together. A plugin
// appends its own entries via `myModels.useGenerateActions`.
export const myModelActions: MyModelAction[] = [
  {
    key: 'playground',
    label: 'models.openinplayground',
    locale: true,
    order: 10,
    // Same glyph as the Playground sidebar entry.
    icon: React.createElement(IconFont, { type: 'icon-experiment' }),
    show: (model) => model.status === MyModelsStatusValueMap.Ready
  }
];

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
