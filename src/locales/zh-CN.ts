/**
 * @description The directory name used in require.context must match the language configuration names defined in lang-config-map.ts.
 * @example Directories like 'en-US' or 'zh-CN' should correspond exactly to the configuration names in lang-config-map.ts.
 */

const requireContext = require.context(`./zh-CN`, false, /\.ts$/);

let languageConfig: Record<string, string> = {};

requireContext.keys().forEach((fileName: any) => {
  const moduleConfig = requireContext(fileName).default;
  languageConfig = {
    ...languageConfig,
    ...moduleConfig
  };
});

export default languageConfig;
