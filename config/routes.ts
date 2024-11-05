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
    icon: 'ExperimentOutlined',
    path: '/playground',
    key: 'playground',
    routes: [
      {
        path: '/playground',
        redirect: '/playground/chat'
      },
      {
        name: 'chat',
        title: 'Chat',
        path: '/playground/chat',
        key: 'chat',
        icon: 'Comment',
        component: './playground/index'
      },
      {
        name: 'embedding',
        title: 'embedding',
        path: '/playground/embedding',
        key: 'embedding',
        icon: 'Comment',
        component: './playground/embedding'
      },
      {
        name: 'rerank',
        title: 'Rerank',
        path: '/playground/rerank',
        key: 'rerank',
        icon: 'Comment',
        component: './playground/rerank'
      }
    ]
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
