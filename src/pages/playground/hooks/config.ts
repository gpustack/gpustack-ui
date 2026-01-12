export const VLLMMetaKeys: Record<string, any> = {};

export const SGLangMetaKeys: Record<string, any> = {};

/**
 * LLM Meta Keys
 * @description Keys used for configuring large language models (LLMs)
 * These keys are from model metadata
 * These values are set to the from, use uniform keys for easier management
 */
export const LLM_METAKEYS: Record<string, any> = {
  seed: 'seed',
  stop: 'stop',
  temperature: 'temperature',
  top_p: 'top_p',
  n_ctx: 'n_ctx',
  n_slot: 'n_slot',
  max_model_len: 'max_model_len',
  frequency_penalty: 'frequency_penalty',
  presence_penalty: 'presence_penalty',
  max_total_tokens: 'max_total_tokens',
  max_stop_sequences: 'stop'
};

export const precisionTwoKeys = [
  'temperature',
  'top_p',
  'frequency_penalty',
  'presence_penalty'
];

export const IMG_METAKEYS = [
  'sample_method',
  'sampling_steps',
  'schedule_method',
  'cfg_scale',
  'guidance',
  'negative_prompt',
  'seed',
  'strength'
];

export const VIDEO_METAKEYS = [];

export const llmInitialValues = {
  seed: null,
  stop: null,
  temperature: 1,
  top_p: 1,
  max_tokens: 1024,
  frequency_penalty: 0,
  presence_penalty: 0
};

export const advancedFieldsDefaultValus = {
  seed: null
  // sample_method: 'euler_a',
  // cfg_scale: 4.5,
  // guidance: 3.5,
  // sampling_steps: 10,
  // negative_prompt: null,
  // strength: null,
  // schedule_method: 'discrete',
  // preview: 'preview_faster'
};

export const videoAdvancedDefaultValues = {};

export const openaiCompatibleFieldsDefaultValus = {
  // quality: 'standard',
  style: null
};

export const imgInitialValues = {
  n: 1,
  size: '512x512',
  response_format: 'b64_json',
  width: 512,
  height: 512,
  random_seed: true
};
