import { keepAliveRoutes } from './keep-alive';

export default [
  {
    name: 'dashboard',
    path: '/dashboard',
    key: 'dashboard',
    icon: 'icon-dashboard',
    selectedIcon: 'icon-dashboard-filled',
    defaultIcon: 'icon-dashboard',
    access: 'canSeeAdmin',
    component: './dashboard'
  },
  {
    name: 'playground',
    icon: 'icon-experiment',
    selectedIcon: 'icon-experiment-filled',
    defaultIcon: 'icon-experiment',
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
        path: keepAliveRoutes.text2images,
        key: 'text2images',
        icon: 'Comment',
        component: './playground/images'
      },
      {
        name: 'speech',
        title: 'Speech',
        path: keepAliveRoutes.speech,
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
    icon: 'icon-layers',
    selectedIcon: 'icon-layers-filled',
    defaultIcon: 'icon-layers',
    access: 'canSeeAdmin',
    component: './llmodels/catalog'
  },
  {
    name: 'models',
    path: '/models/list',
    key: 'models',
    icon: 'icon-model',
    selectedIcon: 'icon-model-filled',
    defaultIcon: 'icon-model',
    access: 'canSeeAdmin',
    component: './llmodels/index'
  },
  {
    name: 'resources',
    path: '/resources',
    key: 'resources',
    icon: 'icon-resources',
    selectedIcon: 'icon-resources-filled',
    defaultIcon: 'icon-resources',
    access: 'canSeeAdmin',
    component: './resources'
  },
  {
    name: 'apikeys',
    path: '/api-keys',
    key: 'apikeys',
    selectedIcon: 'icon-key-filled',
    icon: 'icon-key',
    defaultIcon: 'icon-key',
    component: './api-keys'
  },
  {
    name: 'users',
    path: '/users',
    key: 'users',
    icon: 'icon-users',
    selectedIcon: 'icon-users-filled',
    defaultIcon: 'icon-users',
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
    hideInMenu: true,
    component: './404'
  }
];
