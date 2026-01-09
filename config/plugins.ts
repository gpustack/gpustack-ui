import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
const CompressionWebpackPlugin = require('compression-webpack-plugin');

export function monacoPluginConfig(config: any) {
  return config
    .plugin('monaco-editor-webpack-plugin')
    .use(MonacoWebpackPlugin, [
      {
        languages: ['yaml'],
        customLanguages: [
          {
            label: 'yaml',
            entry: 'monaco-yaml',
            worker: {
              id: 'monaco-yaml/yamlWorker',
              entry: 'monaco-yaml/yaml.worker.js'
            }
          }
        ]
      }
    ]);
}

export function compressionPluginConfig(config: any) {
  return config
    .plugin('compression-webpack-plugin')
    .use(CompressionWebpackPlugin, [
      {
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8
      }
    ]);
}
