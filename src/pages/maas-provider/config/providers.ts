export enum ProviderEnum {
  AI360 = 'ai360',
  AZURE = 'azure',
  BAICHUAN = 'baichuan',
  BAIDU = 'baidu',
  BEDROCK = 'bedrock',
  CLAUDE = 'claude',
  CLOUDFLARE = 'cloudflare',
  COHERE = 'cohere',
  COZE = 'coze',
  DEEPL = 'deepl',
  DEEPSEEK = 'deepseek',
  DIFY = 'dify',
  DOUBAO = 'doubao',
  FIREWORKS = 'fireworks',
  GEMINI = 'gemini',
  GITHUB = 'github',
  GROK = 'grok',
  GROQ = 'groq',
  HUNYUAN = 'hunyuan',
  LONGCAT = 'longcat',
  MINIMAX = 'minimax',
  MISTRAL = 'mistral',
  MOONSHOT = 'moonshot',
  OLLAMA = 'ollama',
  OPENAI = 'openai',
  OPENROUTER = 'openrouter',
  QWEN = 'qwen',
  SPARK = 'spark',
  STEPFUN = 'stepfun',
  TOGETHERAI = 'together-ai',
  TRITON = 'triton',
  YI = 'yi',
  ZHIPUAI = 'zhipuai'
}

// generate provider list: {label: string;value:string}[]
export const maasProviderOptions = Object.entries(ProviderEnum).map(
  ([key, value]) => ({
    locale: false,
    label: key,
    value: value,
    key: value
  })
);

// generate provider value to label map
export const maasProviderLabelMap: Record<string, string> = Object.entries(
  ProviderEnum
).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);
