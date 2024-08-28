import apikeys from './en-US/apikeys';
import common from './en-US/common';
import dashboard from './en-US/dashboard';
import menu from './en-US/menu';
import models from './en-US/models';
import playground from './en-US/playground';
import resources from './en-US/resources';
import shortcuts from './en-US/shortcuts';
import usage from './en-US/usage';
import users from './en-US/users';

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
