import { defineConfig } from '@umijs/max';
import routes from './routes';

export default defineConfig({
  clickToComponent: {},
  antd: {
    style: 'less',
    configProvider: {
      theme:{
        'root-entry-name': 'variable',
        cssVar: true,
        hashed: false,
       token: {
        colorPrimary: '#2fbf85',
        motion: true,
       }
      },
    }
  },
  access: {},
  model: {},
  initialState: {},
  request: {},
  // locale: {
  //   // 默认使用 src/locales/zh-CN.ts 作为多语言文件
  //   default: 'zh-CN',
  //   baseSeparator: '-',
  // },
  layout: false,
  routes,
  npmClient: 'pnpm',
});
