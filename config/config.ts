import { defineConfig } from '@umijs/max';
const CompressionWebpackPlugin = require('compression-webpack-plugin');

import proxy from './proxy';
import routes from './routes';
const env = process.env.NODE_ENV;
const isProduction = env === 'production';

const t = Date.now();
export default defineConfig({
  proxy: {
    ...proxy()
  },
  history: {
    type: 'hash'
  },
  base: process.env.npm_config_base || '/',
  ...(isProduction
    ? {
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
          config
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
        },
        jsMinifierOptions: {
          drop_console: true,
          drop_debugger: true
        }
      }
    : {}),
  // esbuildMinifyIIFE: true,

  favicons: ['/static/favicon.ico'],
  jsMinifier: 'terser',
  cssMinifier: 'cssnano',
  presets: ['umi-presets-pro'],
  clickToComponent: {},
  antd: {
    style: 'less',
    configProvider: {
      componentSize: 'large',
      theme: {
        'root-entry-name': 'variable',
        cssVar: true,
        hashed: false,
        components: {
          Input: {
            inputFontSize: 12
          },
          Table: {
            cellFontSize: 12
          }
        },
        token: {
          colorPrimary: '#2fbf85',
          borderRadius: 8,
          fontSize: 12,
          motion: true
        }
      }
    }
  },
  hash: true,
  access: {},
  model: {},
  initialState: {},
  request: {},
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
