import { defineConfig } from '@umijs/max';
import keepAlive from './keep-alive';
import { compressionPluginConfig, monacoPluginConfig } from './plugins';
import proxy from './proxy';
import routes from './routes';
import { getBranchInfo } from './utils';
const CompressionWebpackPlugin = require('compression-webpack-plugin');

const versionInfo = getBranchInfo();
process.env.VERSION = JSON.stringify(versionInfo);

const env = process.env.NODE_ENV;
const isProduction = env === 'production';

const t = Date.now();
export default defineConfig({
  proxy: {
    ...proxy(process.env.PROXY_HOST)
  },
  history: {
    type: 'hash'
  },
  analyze: {
    analyzerMode: 'server',
    analyzerPort: 8888,
    openAnalyzer: true,
    generateStatsFile: false,
    statsFilename: 'stats.json',
    logLevel: 'info',
    defaultSizes: 'parsed' // stat  // gzip
  },
  mfsu: {
    exclude: ['lodash', 'ml-pca', 'monaco-editor']
  },
  base: process.env.npm_config_base || '/',
  ...(isProduction
    ? {
        jsMinifierOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        },
        scripts: [
          {
            src: `/js/umi.${t}.js`
          }
        ],
        chainWebpack(config: any) {
          config.plugin('mini-css-extract-plugin').tap((args: any) => [
            {
              ...args[0],
              filename: `css/[name].${t}.css`,
              chunkFilename: `css/[name].${t}.chunk.css`
            }
          ]);
          config.output
            .filename(`js/[name].${t}.js`)
            .chunkFilename(`js/[name].${t}.chunk.js`);
          compressionPluginConfig(config);
        }
      }
    : {}),
  chainWebpack(config) {
    monacoPluginConfig(config);
  },
  favicons: ['/static/favicon.png'],
  jsMinifier: 'terser',
  cssMinifier: 'cssnano',
  presets: ['umi-presets-pro'],
  clickToComponent: {},
  antd: {
    style: 'less'
  },
  hash: true,
  access: {},
  model: {},
  initialState: {},
  request: {},
  keepalive: keepAlive,
  locale: {
    antd: true,
    baseNavigator: true,
    baseSeparator: '-',
    default: 'en-US',
    title: false,
    useLocalStorage: true
  },
  layout: false,
  routes,
  npmClient: 'pnpm'
}) as any;
