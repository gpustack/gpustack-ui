import apikeys from './zh-CN/apikeys';
import common from './zh-CN/common';
import dashboard from './zh-CN/dashboard';
import menu from './zh-CN/menu';
import models from './zh-CN/models';
import playground from './zh-CN/playground';
import resources from './zh-CN/resources';
import shortcuts from './zh-CN/shortcuts';
import usage from './zh-CN/usage';
import users from './zh-CN/users';

export default {
  ...common,
  ...menu,
  ...models,
  ...playground,
  ...resources,
  ...apikeys,
  ...users,
  ...dashboard,
  ...usage,
  ...shortcuts
};
