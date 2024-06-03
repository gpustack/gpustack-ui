import { defineConfig } from '@umijs/max';
import routes from './routes';

export default defineConfig({
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
