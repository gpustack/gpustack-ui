import typesafeLogo from '@/assets/providers-logo/typesafe-ai.png';

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
  ['glm', 'zai'],
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
  ['hy', 'hunyuan'],
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

// Default llm logo, used as the ultimate fallback when neither a brand
// logo nor a model-category icon can be resolved.
export const defaultModelLogo = iconMap[DEFAULT_ICON];

// 模型类别 → model_icons 下的类别图标文件名。
const CATEGORY_ICON_MAP: Record<string, string> = {
  llm: 'llm',
  embedding: 'embedding',
  reranker: 'reranker',
  image: 'image',
  text_to_speech: 'tts',
  speech_to_text: 'stt',
  // Decision models (System One / Jev) reuse the TypeSafe provider mark
  // from providers-logo — a direct asset url instead of an iconMap key.
  decision: typesafeLogo
};

// The TypeSafe mark is drawn light-on-dark (see provider-logo.tsx); the
// model card inverts it on light themes so it stays visible.
export const isInvertibleModelLogo = (url?: string | null): boolean =>
  !!url && url === typesafeLogo;

/**
 * Resolve a category icon for a model's categories. Map values are either
 * an iconMap key (a model_icons filename) or a direct asset url — the
 * TypeSafe mark above. Returns the first resolved url, or null when none
 * match.
 */
export const getCategoryLogo = (categories?: string[]): string | null => {
  const resolved = categories
    ?.map((category) => CATEGORY_ICON_MAP[category])
    .find(Boolean);

  if (!resolved) {
    return null;
  }
  return iconMap[resolved] || resolved;
};

/**
 * Resolve a brand logo from a model name.
 * 1. Match against the keyword rules in order (first substring hit wins).
 * 2. Fall back to a direct match where the name contains an icon filename.
 * 3. Return null when nothing matches — the caller then falls back to a
 *    category-based icon (see `categoryConfig`) rather than a default image.
 */
export const getModelLogo = (modelName?: string): string | null => {
  const name = (modelName || '').toLowerCase();

  const rule = MODEL_ICON_RULES.find(([keyword]) => name.includes(keyword));
  if (rule && iconMap[rule[1]]) {
    return iconMap[rule[1]];
  }

  const directHit = Object.keys(iconMap)
    .filter((iconName) => iconName !== DEFAULT_ICON)
    .sort((a, b) => b.length - a.length)
    .find((iconName) => name.includes(iconName));

  return directHit ? iconMap[directHit] : null;
};
