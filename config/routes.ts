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
        name: 'text2images',
        title: 'Text2Images',
        path: '/playground/text-to-image',
        key: 'text2images',
        icon: 'Comment',
        component: './playground/images'
      },
      {
        name: 'speech',
        title: 'Speech',
        path: '/playground/speech',
        key: 'speech',
        icon: 'Comment',
        component: './playground/speech'
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
    name: 'modelCatalog',
    path: '/models/catalog',
    key: 'modelsCatalog',
    icon: 'icon-catalog',
    access: 'canSeeAdmin',
    component: './llmodels/catalog'
  },
  {
    name: 'models',
    path: '/models/list',
    key: 'models',
    icon: 'Block',
    access: 'canSeeAdmin',
    component: './llmodels/index'
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
    name: 'chat',
    path: '/chat',
    key: 'chat',
    layout: false,
    hideInMenu: true,
    component: './chat'
  },
  {
    name: '404',
    path: '*',
    key: '404',
    layout: false,
    component: './404'
  }
];
