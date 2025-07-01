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
    component: './dashboard',
    routes: []
  },
  {
    name: 'playground',
    // icon: 'icon-experiment',
    // selectedIcon: 'icon-experiment-filled',
    // defaultIcon: 'icon-experiment',
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
        icon: 'icon-chat',
        selectedIcon: 'icon-chat-filled',
        defaultIcon: 'icon-chat',
        component: './playground/index'
      },
      {
        name: 'text2images',
        title: 'Text2Images',
        path: keepAliveRoutes.text2images,
        key: 'text2images',
        icon: 'icon-image1',
        selectedIcon: 'icon-image-filled',
        defaultIcon: 'icon-image1',
        component: './playground/images'
      },
      {
        name: 'speech',
        title: 'Speech',
        path: keepAliveRoutes.speech,
        key: 'speech',
        icon: 'icon-audio1',
        selectedIcon: 'icon-audio-filled',
        defaultIcon: 'icon-audio1',
        component: './playground/speech'
      },
      {
        name: 'embedding',
        title: 'embedding',
        path: '/playground/embedding',
        key: 'embedding',
        icon: 'icon-embedding',
        selectedIcon: 'icon-embedding-filled',
        defaultIcon: 'icon-embedding',
        component: './playground/embedding'
      },
      {
        name: 'rerank',
        title: 'Rerank',
        path: '/playground/rerank',
        key: 'rerank',
        icon: 'icon-reranker',
        selectedIcon: 'icon-reranker-filled',
        defaultIcon: 'icon-reranker',
        component: './playground/rerank'
      }
    ]
  },
  {
    name: 'models',
    path: '/models',
    key: 'models',
    routes: [
      {
        path: '/models',
        redirect: '/models/deployment'
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
        name: 'deployment',
        path: '/models/deployment',
        key: 'modelDeployments',
        icon: 'icon-model',
        selectedIcon: 'icon-model-filled',
        defaultIcon: 'icon-model',
        access: 'canSeeAdmin',
        component: './llmodels/index'
      }
    ]
  },
  {
    name: 'resources',
    path: '/resources',
    key: 'resources',
    access: 'canSeeAdmin',
    routes: [
      {
        path: '/resources',
        redirect: '/resources/workers'
      },
      {
        name: 'workers',
        path: '/resources/workers',
        key: 'workers',
        icon: 'icon-resources',
        selectedIcon: 'icon-resources-filled',
        defaultIcon: 'icon-resources',
        component: './resources/components/workers'
      },
      {
        name: 'gpus',
        path: '/resources/gpus',
        key: 'gpus',
        icon: 'icon-gpu1',
        selectedIcon: 'icon-gpu-filled',
        defaultIcon: 'icon-gpu1',
        component: './resources/components/gpus'
      },
      {
        name: 'modelfiles',
        path: '/resources/modelfiles',
        key: 'modelfiles',
        icon: 'icon-files',
        selectedIcon: 'icon-files-filled',
        defaultIcon: 'icon-files',
        component: './resources/components/model-files'
      }
    ]
  },
  // {
  //   name: 'users',
  //   path: '/users',
  //   key: 'users',
  //   icon: 'icon-users',
  //   selectedIcon: 'icon-users-filled',
  //   defaultIcon: 'icon-users',
  //   access: 'canSeeAdmin',
  //   component: './users'
  // },
  {
    name: 'accessControl',
    path: '/access-control',
    key: 'accessControl',
    routes: [
      {
        path: '/access-control',
        redirect: '/access-control/users'
      },
      {
        name: 'users',
        path: '/access-control/users',
        key: 'users',
        icon: 'icon-users',
        selectedIcon: 'icon-users-filled',
        defaultIcon: 'icon-users',
        access: 'canSeeAdmin',
        component: './users'
      }
    ]
  },
  {
    name: 'apikeys',
    path: '/api-keys',
    key: 'apikeys',
    hideInMenu: true,
    selectedIcon: 'icon-key-filled',
    icon: 'icon-key',
    defaultIcon: 'icon-key',
    component: './api-keys'
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
