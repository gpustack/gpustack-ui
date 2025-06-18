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

// python format
export const formatPyParams = (parameters: Record<string, any>) => {
  return _.keys(parameters).reduce((acc: string, key: string) => {
    if (parameters[key] === null || parameters[key] === undefined) {
      return acc;
    }
    const vauleType = typeof parameters[key];
    const value =
      vauleType === 'object'
        ? JSON.stringify(parameters[key], null, 2)
        : vauleType === 'string'
          ? `"${parameters[key]}"`
          : parameters[key];

    return acc + `  ${key}=${value},\n`;
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
