export const modelCategoriesMap = {
  image: 'image',
  video: 'video',
  text_to_speech: 'text_to_speech',
  speech_to_text: 'speech_to_text',
  embedding: 'embedding',
  reranker: 'reranker',
  llm: 'llm',
  decision: 'decision'
};

export const categoryOptions = [
  {
    label: 'LLM',
    value: modelCategoriesMap.llm,
    icon: 'chat',
    color: 'green'
  },
  {
    label: 'Embedding',
    value: modelCategoriesMap.embedding,
    icon: 'cube',
    color: 'magenta'
  },
  {
    label: 'Reranker',
    value: modelCategoriesMap.reranker,
    icon: 'rank',
    color: 'cyan'
  },
  {
    label: 'Image',
    value: modelCategoriesMap.image,
    icon: 'picture',
    color: 'orange'
  },
  {
    label: 'Video',
    value: modelCategoriesMap.video,
    icon: 'video',
    color: 'blue'
  },
  {
    label: 'Text-to-Speech',
    value: modelCategoriesMap.text_to_speech,
    icon: 'sound-wave',
    color: 'geekblue'
  },
  {
    label: 'Speech-to-Text',
    value: modelCategoriesMap.speech_to_text,
    icon: 'audio',
    color: 'processing'
  },
  {
    label: 'Decision',
    value: modelCategoriesMap.decision,
    icon: 'alt-route',
    color: 'purple'
  }
];

export const modelCategories = [
  { label: 'common.options.auto', value: null, locale: true },
  ...categoryOptions
];

export const categoryOptionsWithOther = [
  ...categoryOptions,
  { label: 'common.option.other', value: null, locale: true }
];
