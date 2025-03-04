export const LLM_METAKEYS: Record<string, any> = {
  seed: 'seed',
  stop: 'stop',
  temperature: 'temperature',
  top_p: 'top_p',
  n_ctx: 'n_ctx',
  n_slot: 'n_slot',
  max_model_len: 'max_model_len',
  frequency_penalty: 'frequency_penalty',
  presence_penalty: 'presence_penalty'
};

export const IMG_METAKEYS = [
  'sample_method',
  'sampling_steps',
  'schedule_method',
  'cfg_scale',
  'guidance',
  'negative_prompt',
  'seed'
];

export const llmInitialValues = {
  seed: null,
  stop: null,
  temperature: 1,
  top_p: 1,
  max_tokens: null,
  frequency_penalty: null,
  presence_penalty: null
};

export const advancedFieldsDefaultValus = {
  seed: null,
  sample_method: 'euler_a',
  cfg_scale: 4.5,
  guidance: 3.5,
  sampling_steps: 10,
  negative_prompt: null,
  schedule_method: 'discrete',
  preview: 'preview_faster'
};

export const openaiCompatibleFieldsDefaultValus = {
  quality: 'standard',
  style: null
};

export const imgInitialValues = {
  n: 1,
  size: '512x512',
  width: 512,
  height: 512
};
