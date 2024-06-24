import menu from './en-US/menu';
import apikeys from './zh-CN/apikeys';
import common from './zh-CN/common';
import models from './zh-CN/models';
import playground from './zh-CN/playground';
import resources from './zh-CN/resources';

export default {
  ...common,
  ...menu,
  ...models,
  ...playground,
  ...resources,
  ...apikeys
};
