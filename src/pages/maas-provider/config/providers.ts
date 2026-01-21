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

export const ProviderI18nKeyMap: Record<ProviderEnum, string> = {
  [ProviderEnum.AI360]: 'ai.provider.ai360',
  [ProviderEnum.AZURE]: 'ai.provider.azure',
  [ProviderEnum.BAICHUAN]: 'ai.provider.baichuan',
  [ProviderEnum.BAIDU]: 'ai.provider.baidu',
  [ProviderEnum.BEDROCK]: 'ai.provider.bedrock',
  [ProviderEnum.CLAUDE]: 'ai.provider.claude',
  [ProviderEnum.CLOUDFLARE]: 'ai.provider.cloudflare',
  [ProviderEnum.COHERE]: 'ai.provider.cohere',
  [ProviderEnum.COZE]: 'ai.provider.coze',
  [ProviderEnum.DEEPL]: 'ai.provider.deepl',
  [ProviderEnum.DEEPSEEK]: 'ai.provider.deepseek',
  [ProviderEnum.DIFY]: 'ai.provider.dify',
  [ProviderEnum.DOUBAO]: 'ai.provider.doubao',
  [ProviderEnum.FIREWORKS]: 'ai.provider.fireworks',
  [ProviderEnum.GEMINI]: 'ai.provider.gemini',
  [ProviderEnum.GITHUB]: 'ai.provider.github',
  [ProviderEnum.GROK]: 'ai.provider.grok',
  [ProviderEnum.GROQ]: 'ai.provider.groq',
  [ProviderEnum.HUNYUAN]: 'ai.provider.hunyuan',
  [ProviderEnum.LONGCAT]: 'ai.provider.longcat',
  [ProviderEnum.MINIMAX]: 'ai.provider.minimax',
  [ProviderEnum.MISTRAL]: 'ai.provider.mistral',
  [ProviderEnum.MOONSHOT]: 'ai.provider.moonshot',
  [ProviderEnum.OLLAMA]: 'ai.provider.ollama',
  [ProviderEnum.OPENAI]: 'ai.provider.openai',
  [ProviderEnum.OPENROUTER]: 'ai.provider.openrouter',
  [ProviderEnum.QWEN]: 'ai.provider.qwen',
  [ProviderEnum.SPARK]: 'ai.provider.spark',
  [ProviderEnum.STEPFUN]: 'ai.provider.stepfun',
  [ProviderEnum.TOGETHERAI]: 'ai.provider.together-ai',
  [ProviderEnum.TRITON]: 'ai.provider.triton',
  [ProviderEnum.YI]: 'ai.provider.yi',
  [ProviderEnum.ZHIPUAI]: 'ai.provider.zhipuai'
};

// generate provider list: {label: string;value:string}[]
export const maasProviderOptions = Object.entries(ProviderEnum).map(
  ([key, value]) => ({
    locale: true,
    label: ProviderI18nKeyMap[value],
    value: value,
    key: value
  })
);

// generate provider value to label map
export const maasProviderLabelMap: Record<string, string> = Object.entries(
  ProviderEnum
).reduce(
  (acc, [key, value]) => {
    acc[value] = ProviderI18nKeyMap[value];
    return acc;
  },
  {} as Record<string, string>
);
