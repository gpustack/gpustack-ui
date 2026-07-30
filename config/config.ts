import { defineConfig } from '@umijs/max';
import keepAlive from './keep-alive';
import { extraMfsuExclude } from './mfsu.extensions';
import { compressionPluginConfig, monacoPluginConfig } from './plugins';
import proxy from './proxy';
import routes from './routes';
import { getBranchInfo } from './utils';

const versionInfo = getBranchInfo();
process.env.VERSION = JSON.stringify(versionInfo);

const env = process.env.NODE_ENV;
const isProduction = env === 'production';

export default defineConfig({
  proxy: {
    ...proxy(process.env.PROXY_HOST)
  },
  history: {
    type: 'hash'
  },
  define: {
    'process.env.ENABLE_ENTERPRISE': process.env.ENABLE_ENTERPRISE
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
    exclude: ['lodash', 'ml-pca', ...extraMfsuExclude]
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
        chainWebpack(config: any) {
          // Keep the js/ and css/ output directories, but name files by content
          // hash instead of the build clock: a release then only invalidates the
          // assets it actually changed.
          config.plugin('mini-css-extract-plugin').tap((args: any) => [
            {
              ...args[0],
              filename: 'css/[name].[contenthash:8].css',
              chunkFilename: 'css/[name].[contenthash:8].chunk.css'
            }
          ]);
          config.output
            .filename('js/[name].[contenthash:8].js')
            .chunkFilename('js/[name].[contenthash:8].chunk.js');
          compressionPluginConfig(config);
          monacoPluginConfig(config);
        }
      }
    : {
        chainWebpack(config) {
          monacoPluginConfig(config);
        }
      }),
  favicons: ['/static/favicon.png'],
  jsMinifier: 'terser',
  cssMinifier: 'cssnano',
  presets: ['umi-presets-pro'],
  clickToComponent: {},
  antd: {
    style: 'less'
  },
  title: 'GPUStack',
  hash: true,
  access: {},
  model: {},
  initialState: {},
  request: {},
  routePrefetch: {
    defaultPrefetch: 'intent'
  },
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
