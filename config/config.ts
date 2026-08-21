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
  // This block has to stay. It is what makes umi emit
  // `window.__umi_route_prefetch__`, and a route's chunk is only pulled behind
  // a check on that global — remove the block and `preloadRoute` still
  // resolves and still gets called, it just silently stops fetching anything.
  // The sider menu calls it directly, so it would break with no error.
  //
  // The value is live too: it is the fallback for a Link that omits the prop,
  // and the credential link in cloud-provider-form is one. Nothing wraps that
  // Link, so umi's own hover handler survives there and does the work. The
  // sider menu is the exception — Tooltip replaces the handler on its Link,
  // which is why it wires preloading by hand instead.
  //
  // `defaultPrefetchTimeout` is deliberately left at umi's 50ms. The only
  // Link reaching this path is an isolated one inside a form, so there is no
  // row above it to cross on the way and nothing to debounce against; a longer
  // delay would only cut into the head start. The sider menu holds its own,
  // much longer delay, for the opposite reason.
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
