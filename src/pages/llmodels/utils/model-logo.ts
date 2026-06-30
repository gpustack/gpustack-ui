// Load every image under src/assets/model_icons at build time.
const iconContext = (require as any).context(
  '@/assets/model_icons',
  false,
  /\.(png|jpe?g|svg)$/
);

const DEFAULT_ICON = 'llm-icon';

// Map of lowercased base filename (without extension) -> resolved asset url.
const iconMap: Record<string, string> = iconContext
  .keys()
  .reduce((acc: Record<string, string>, key: string) => {
    const base = key
      .replace(/^\.\//, '')
      .replace(/\.(png|jpe?g|svg)$/, '')
      .toLowerCase();
    acc[base] = iconContext(key).default || iconContext(key);
    return acc;
  }, {});

// 模型名关键字 → logo 文件名（按顺序匹配第一个命中的子串）。
const MODEL_ICON_RULES: [string, string][] = [
  ['llama', 'meta'],
  ['qwen', 'qwen'],
  ['deepseek', 'deepseek'],
  ['mixtral', 'mistral'],
  ['mistral', 'mistral'],
  ['phi', 'microsoft'],
  ['gemma', 'google'],
  ['command-r', 'cohere'],
  ['cohere', 'cohere'],
  ['glm', 'thudm'],
  ['yi-', '01ai'],
  ['ernie', 'ernie'],
  ['hunyuan', 'hunyuan'],
  ['kimi', 'kimi'],
  ['minimax', 'minimax'],
  ['falcon', 'falcon3'],
  ['stable-diffusion', 'stability'],
  ['sdxl', 'stability'],
  ['stepfun', 'stepfun'],
  ['nvidia', 'nvidia'],
  // 其余厂商/系列 → 对应 logo（按子串命中）
  ['gemini', 'google'],
  ['gpt', 'openai'],
  ['openai', 'openai'],
  ['internvl', 'opengvlab'],
  ['minicpm', 'openbmb'],
  ['mimo', 'xiaomimimo'],
  ['flux', 'blackforestlabs'],
  ['granite', 'ibm'],
  ['lfm', 'liquidai'],
  ['liquid', 'liquidai'],
  ['nomic', 'nomic'],
  ['jina', 'jina'],
  ['bge', 'bge'],
  ['cosyvoice', 'funaudiollm'],
  ['sensevoice', 'funaudiollm'],
  ['paddle', 'paddlepaddle'],
  ['baidu', 'baidu'],
  ['youdao', 'youdao'],
  ['systran', 'systran'],
  ['nanbeige', 'nanbeige'],
  ['nari', 'narilabs'],
  ['bagel', 'bagel'],
  ['zai', 'zai'],
  ['tencent', 'tencentarc'],
  ['jetbrains', 'jetbrains'],
  ['freepik', 'freepik'],
  ['alibaba', 'alibaba']
];

/**
 * Resolve a model logo from its name.
 * 1. Match against the keyword rules in order (first substring hit wins).
 * 2. Fall back to a direct match where the name contains an icon filename.
 * 3. Fall back to the default llm icon.
 */
export const getModelLogo = (modelName?: string): string => {
  const name = (modelName || '').toLowerCase();

  const rule = MODEL_ICON_RULES.find(([keyword]) => name.includes(keyword));
  if (rule && iconMap[rule[1]]) {
    return iconMap[rule[1]];
  }

  const directHit = Object.keys(iconMap)
    .filter((iconName) => iconName !== DEFAULT_ICON)
    .sort((a, b) => b.length - a.length)
    .find((iconName) => name.includes(iconName));

  return iconMap[directHit || DEFAULT_ICON] || iconMap[DEFAULT_ICON];
};
