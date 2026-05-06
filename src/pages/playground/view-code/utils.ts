import _ from 'lodash';

function toShellSafeMultilineJson(value: any): string {
  const json = JSON.stringify(value, null, 2);
  const escaped = json.replace(/'/g, `'\\''`);
  return `${escaped}`;
}

function toShellSafeJson(value: any): string {
  return JSON.stringify(value, null, 2).replace(/'/g, `'\\''`);
}

// curl format
export const formatCurlArgs = (
  parameters: Record<string, any>,
  isFormdata?: boolean
) => {
  if (isFormdata) {
    return _.keys(parameters).reduce((acc: string, key: string) => {
      const val = parameters[key];
      const value =
        typeof val === 'object'
          ? toShellSafeMultilineJson(val)
          : `${toShellSafeJson(val)}`;
      return acc + `-F ${key}="${value}" \\\n`;
    }, '');
  }
  return `-d '${toShellSafeMultilineJson(parameters)}'`;
};

const toPyLiteral = (val: any, indent = 2, level = 0): string => {
  if (val === null) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    const pad = ' '.repeat((level + 1) * indent);
    const closePad = ' '.repeat(level * indent);
    const items = val.map((v) => `${pad}${toPyLiteral(v, indent, level + 1)}`);
    return `[\n${items.join(',\n')}\n${closePad}]`;
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) return '{}';
    const pad = ' '.repeat((level + 1) * indent);
    const closePad = ' '.repeat(level * indent);
    const entries = keys.map(
      (k) =>
        `${pad}${JSON.stringify(k)}: ${toPyLiteral(val[k], indent, level + 1)}`
    );
    return `{\n${entries.join(',\n')}\n${closePad}}`;
  }
  return String(val);
};

// python format
export const formatPyParams = (parameters: Record<string, any>) => {
  return _.keys(parameters).reduce((acc: string, key: string) => {
    if (parameters[key] === null || parameters[key] === undefined) {
      return acc;
    }
    return acc + `  ${key}=${toPyLiteral(parameters[key], 2, 1)},\n`;
  }, '');
};

// node format
export const fomatNodeJsParams = (parameters: Record<string, any>) => {
  return JSON.stringify(
    {
      ...parameters
    },
    null,
    4
  );
};
