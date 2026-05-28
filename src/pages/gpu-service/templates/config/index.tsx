import { icons } from '@gpustack/core-ui';
import { ImagePullPolicy } from './types';

export const TemplateStatusValueMap = {
  Enabled: 'enabled',
  Disabled: 'disabled'
};

export const TemplateStatusLabelMap: Record<string, string> = {
  [TemplateStatusValueMap.Enabled]: 'common.button.enable',
  [TemplateStatusValueMap.Disabled]: 'common.button.disable'
};

export const ImagePullPolicyOptions: {
  label: string;
  value: ImagePullPolicy;
  locale: boolean;
}[] = [
  {
    label: 'gpuservice.template.imagePullPolicy.always',
    value: 'Always',
    locale: true
  },
  {
    label: 'gpuservice.template.imagePullPolicy.ifNotPresent',
    value: 'IfNotPresent',
    locale: true
  },
  {
    label: 'gpuservice.template.imagePullPolicy.never',
    value: 'Never',
    locale: true
  }
];

export const DefaultImagePullPolicy: ImagePullPolicy = 'IfNotPresent';

export const manufactureColorMap: Record<string, string> = {
  nvidia: 'green',
  amd: 'volcano',
  ascend: 'orange',
  hygon: 'magenta',
  moorthreads: 'cyan',
  iluvatar: 'purple',
  metax: 'geekblue',
  cambricon: 'gold',
  thead: 'red',
  cpu: 'blue'
};

export const normalizeCommand = (value: string): string[] => {
  if (!value) return [];
  const tokens: string[] = [];
  let current = '';
  let inQuote: '"' | "'" | null = null;
  let quoteStart = -1;
  for (const ch of value) {
    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null;
        quoteStart = -1;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
      quoteStart = current.length;
    } else if (/\s/.test(ch)) {
      tokens.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (inQuote && quoteStart >= 0) {
    current =
      current.slice(0, quoteStart) + inQuote + current.slice(quoteStart);
  }
  tokens.push(current);
  return tokens;
};

export const stringifyCommand = (tokens?: string[]): string => {
  if (!tokens?.length) return '';
  return tokens
    .map((token) => {
      if (!/\s/.test(token)) return token;
      if (token.startsWith('"') || token.startsWith("'")) return token;
      return `"${token}"`;
    })
    .join(' ');
};

export const templateActions = [
  {
    label: 'common.button.edit',
    key: 'edit',
    locale: true,
    access: 'canSeeAdmin',
    icon: icons.EditOutlined
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    locale: true,
    icon: icons.DeleteOutlined,
    danger: true
  }
];
