export default [
  {
    name: 'dashboard',
    path: '/dashboard',
    key: 'dashboard',
    icon: 'AppstoreOutlined',
    access: 'canSeeAdmin',
    component: './dashboard'
  },
  {
    name: 'playground',
    title: 'Playground',
    path: '/playground',
    key: 'playground',
    icon: 'Comment',
    component: './playground'
  },
  {
    name: 'models',
    path: '/models',
    key: 'models',
    icon: 'Block',
    access: 'canSeeAdmin',
    component: './llmodels'
  },
  {
    name: 'resources',
    path: '/resources',
    key: 'resources',
    icon: 'CloudServer',
    access: 'canSeeAdmin',
    component: './resources'
  },
  {
    name: 'apikeys',
    path: '/api-keys',
    key: 'apikeys',
    icon: 'LockOutlined',
    component: './api-keys'
  },
  {
    name: 'users',
    path: '/users',
    key: 'users',
    icon: 'Team',
    access: 'canSeeAdmin',
    component: './users'
  },
  {
    name: 'profile',
    path: '/profile',
    key: 'profile',
    hideInMenu: true,
    component: './profile',
    icon: 'User'
  },
  {
    name: 'login',
    path: '/login',
    key: 'login',
    layout: false,
    hideInMenu: true,
    component: './login'
  },
  {
    name: '404',
    path: '*',
    key: '404',
    layout: false,
    component: './404'
  }
];
