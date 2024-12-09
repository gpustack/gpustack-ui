import _ from 'lodash';

// curl format
export const formatCurlArgs = (
  parameters: Record<string, any>,
  isFormdata?: boolean
) => {
  if (isFormdata) {
    return _.keys(parameters).reduce((acc: string, key: string) => {
      const val = parameters[key];
      const value =
        typeof val === 'object' ? JSON.stringify(val, null, 2) : `${val}`;
      return acc + `-F ${key}="${value}" \\\n`;
    }, '');
  }
  return `-d '${JSON.stringify(parameters, null, 2)}'`;
};

// python format
export const formatPyParams = (parameters: Record<string, any>) => {
  return _.keys(parameters).reduce((acc: string, key: string) => {
    if (parameters[key] === null || parameters[key] === undefined) {
      return acc;
    }
    const value =
      typeof parameters[key] === 'object'
        ? JSON.stringify(parameters[key], null, 2)
        : `"${parameters[key]}"`;
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
