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
  base: process.env.npm_config_base || '/',
  ...(isProduction
    ? {
        scripts: [
          {
            src: `/js/umi.${t}.js`
          }
        ],
        cssLoader: {
          modules: {
            localIdentName: 'css/[name]__[local]___[hash:base64:5]'
          }
        },
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
          // config.module
          //   .rule('images')
          //   .test(/\.(png|jpe?g|gif|svg|ico)(\?.*)?$/)
          //   .use('url-loader')
          //   .loader(require.resolve('url-loader'))
          //   .tap((options: any) => {
          //     return {
          //       ...options,
          //       limit: 8192, // 小于8KB的图片会被转为base64
          //       fallback: {
          //         loader: require.resolve('file-loader'),
          //         options: {
          //           name: 'static/[name].[hash:8].[ext]' // 将所有图片输出到 static 目录
          //         }
          //       }
          //     };
          //   });
        }
      }
    : {}),
  // esbuildMinifyIIFE: true,
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
          borderRadius: 16,
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
    default: 'zh-CN',
    title: false,
    useLocalStorage: true
  },
  layout: false,
  routes,
  npmClient: 'pnpm'
}) as any;
