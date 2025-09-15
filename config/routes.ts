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
        icon: 'icon-chat',
        selectedIcon: 'icon-chat-filled',
        defaultIcon: 'icon-chat',
        component: './playground/index'
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
      }
    ]
  },
  {
    name: 'models',
    path: '/models',
    key: 'models',
    access: 'canSeeAdmin',
    routes: [
      {
        path: '/models',
        redirect: '/models/deployments'
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
        path: '/models/deployments',
        key: 'modelDeployments',
        icon: 'icon-rocket-launch1',
        selectedIcon: 'icon-rocket-launch-fill',
        defaultIcon: 'icon-rocket-launch1',
        access: 'canSeeAdmin',
        component: './llmodels/index'
      },
      {
        name: 'userModels',
        path: '/models/user-models',
        key: 'userModels',
        icon: 'icon-models',
        selectedIcon: 'icon-models-filled',
        defaultIcon: 'icon-models',
        access: 'canSeeAdmin',
        component: './llmodels/user-models'
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
  {
    name: 'clusterManagement',
    path: '/cluster-management',
    key: 'clusterManagement',
    access: 'canSeeAdmin',
    routes: [
      {
        path: '/cluster-management',
        redirect: '/cluster-management/clusters/list'
      },
      {
        name: 'clusters',
        path: '/cluster-management/clusters/list',
        key: 'clusters',
        icon: 'icon-cluster2-outline',
        selectedIcon: 'icon-cluster2-filled',
        defaultIcon: 'icon-cluster2-outline',
        component: './cluster-management/clusters',
        subMenu: [
          '/cluster-management/clusters/detail',
          '/cluster-management/clusters/create'
        ]
      },
      {
        name: 'clusterDetail',
        path: '/cluster-management/clusters/detail',
        key: 'clusterDetail',
        icon: 'icon-cluster2-outline',
        selectedIcon: 'icon-cluster2-filled',
        defaultIcon: 'icon-cluster2-outline',
        hideInMenu: true,
        component: './cluster-management/cluster-detail'
      },
      {
        name: 'clusterCreate',
        path: '/cluster-management/clusters/create',
        key: 'clusterCreate',
        icon: 'icon-cluster2-outline',
        selectedIcon: 'icon-cluster2-filled',
        defaultIcon: 'icon-cluster2-outline',
        hideInMenu: true,
        component: './cluster-management/cluster-create'
      },
      {
        name: 'credentials',
        path: '/cluster-management/credentials',
        key: 'credentials',
        icon: 'icon-credential-outline',
        selectedIcon: 'icon-credential-filled',
        defaultIcon: 'icon-credential-outline',
        component: './cluster-management/credentials'
      }
    ]
  },
  {
    name: 'accessControl',
    path: '/access-control',
    key: 'accessControl',
    access: 'canSeeAdmin',
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
