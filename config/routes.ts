import { keepAliveRoutes } from './keep-alive';
import { applyRouteExtensions } from './routes.extensions';

const baseRoutes = [
  {
    name: 'dashboard',
    path: '/dashboard',
    key: 'dashboard',
    icon: 'icon-dashboard',
    selectedIcon: 'icon-dashboard-filled',
    defaultIcon: 'icon-dashboard',
    // `canSeeOrgAdmin` widens to anyone the access seam grants
    // admin-ish visibility — by default platform admin, plus
    // whatever the routes extension chooses to allow.
    access: 'canSeeOrgAdmin',
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
        component: './playground/chat/index'
      },
      {
        name: 'embedding',
        title: 'embedding',
        path: '/playground/embedding',
        key: 'embedding',
        icon: 'icon-embedding',
        selectedIcon: 'icon-embedding-filled',
        defaultIcon: 'icon-embedding',
        component: './playground/embedding/index'
      },
      {
        name: 'rerank',
        title: 'Rerank',
        path: '/playground/rerank',
        key: 'rerank',
        icon: 'icon-reranker',
        selectedIcon: 'icon-reranker-filled',
        defaultIcon: 'icon-reranker',
        component: './playground/rerank/index'
      },
      {
        name: 'text2images',
        title: 'Text2Images',
        path: keepAliveRoutes.text2images,
        key: 'text2images',
        icon: 'icon-image1',
        selectedIcon: 'icon-image-filled',
        defaultIcon: 'icon-image1',
        component: './playground/images/index'
      },
      {
        name: 'speech',
        title: 'Speech',
        path: keepAliveRoutes.speech,
        key: 'speech',
        icon: 'icon-audio1',
        selectedIcon: 'icon-audio-filled',
        defaultIcon: 'icon-audio1',
        component: './playground/speech/index'
      }
      // {
      //   name: 'video',
      //   title: 'Video',
      //   path: '/playground/video',
      //   key: 'video',
      //   icon: 'icon-video-outline',
      //   hideInMenu: false,
      //   selectedIcon: 'icon-video-filled02',
      //   defaultIcon: 'icon-video-outline',
      //   component: './playground/video'
      // }
    ]
  },
  {
    name: 'models',
    path: '/models',
    key: 'models',
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
        access: 'canSeeOrgAdmin',
        component: './llmodels/catalog'
      },
      {
        name: 'userModels',
        path: '/models/user-models',
        key: 'userModels',
        icon: 'icon-models',
        selectedIcon: 'icon-models-filled',
        defaultIcon: 'icon-models',
        access: 'canSeeUser',
        component: './llmodels/user-models'
      },
      {
        name: 'deployment',
        path: '/models/deployments',
        key: 'modelDeployments',
        icon: 'icon-rocket-launch1',
        selectedIcon: 'icon-rocket-launch-fill',
        defaultIcon: 'icon-rocket-launch1',
        access: 'canSeeOrgAdmin',
        component: './llmodels/index'
      },
      {
        name: 'routes',
        path: '/models/routes',
        key: 'routes',
        icon: 'icon-captive_portal',
        selectedIcon: 'icon-captive_portal',
        defaultIcon: 'icon-captive_portal',
        access: 'canSeeOrgAdmin',
        component: './model-routes/index'
      },
      {
        name: 'usage',
        path: '/models/usage',
        key: 'usage',
        icon: 'icon-usage-outlined',
        selectedIcon: 'icon-usage-filled',
        defaultIcon: 'icon-usage-outlined',
        component: './usage/index'
      },
      {
        name: 'providers',
        path: '/models/providers',
        key: 'modelProviders',
        icon: 'icon-extension-outline',
        selectedIcon: 'icon-extension-filled',
        defaultIcon: 'icon-extension-outline',
        access: 'canSeeOrgAdmin',
        component: './maas-provider/index'
      },
      {
        name: 'benchmark',
        path: '/models/benchmark',
        key: 'benchmark',
        icon: 'icon-speed',
        selectedIcon: 'icon-speed-filled',
        defaultIcon: 'icon-speed',
        access: 'canSeeOrgAdmin',
        component: './benchmark/index'
      },
      {
        name: 'benchmarkDetail',
        path: '/models/benchmark/detail',
        key: 'benchmarkDetail',
        icon: 'icon-speed',
        selectedIcon: 'icon-speed-filled',
        defaultIcon: 'icon-speed',
        access: 'canSeeOrgAdmin',
        hideInMenu: true,
        component: './benchmark/details'
      }
    ]
  },
  {
    name: 'gpuService',
    path: '/gpu-service',
    key: 'gpuService',
    access: 'canSeeGpuService',
    routes: [
      {
        path: '/gpu-service',
        redirect: '/gpu-service/instances'
      },
      {
        name: 'instances',
        path: '/gpu-service/instances',
        key: 'gpuServiceList',
        icon: 'icon-cloud-outlined',
        selectedIcon: 'icon-cloud-filled',
        defaultIcon: 'icon-cloud-outlined',
        component: './gpu-service/instances'
      },
      {
        name: 'templates',
        path: '/gpu-service/templates',
        key: 'gpuServiceTemplates',
        icon: 'icon-instance-template-outlined',
        selectedIcon: 'icon-instance-template-filled',
        defaultIcon: 'icon-instance-template-outlined',
        component: './gpu-service/templates'
      },
      {
        name: 'storage',
        path: '/gpu-service/storage',
        key: 'gpuServiceStorage',
        icon: 'icon-database-outlined',
        selectedIcon: 'icon-database-filled',
        defaultIcon: 'icon-database-outlined',
        component: './gpu-service/storage'
      },
      {
        name: 'storageTypes',
        path: '/gpu-service/storage-types',
        key: 'gpuServiceStorageTypes',
        icon: 'icon-storage-outlined',
        access: 'canSeeAdmin',
        selectedIcon: 'icon-storage-filled',
        defaultIcon: 'icon-storage-outlined',
        component: './gpu-service/storage-types'
      },
      {
        name: 'publicKeys',
        path: '/gpu-service/public-keys',
        key: 'gpuServicePublicKeys',
        icon: 'icon-ssh-outlined',
        selectedIcon: 'icon-ssh-filled',
        defaultIcon: 'icon-ssh-outlined',
        component: './gpu-service/public-keys'
      }
    ]
  },
  {
    name: 'resources',
    path: '/resources',
    key: 'resources',
    access: 'canSeeOrgAdmin',
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
        name: 'backendsList',
        path: '/resources/backends',
        key: 'backendsList',
        icon: 'icon-backend',
        selectedIcon: 'icon-backend-filled',
        defaultIcon: 'icon-backend',
        access: 'canSeeOrgAdmin',
        component: './backends/index'
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
    access: 'canSeeOrgAdmin',
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
      },
      {
        name: 'apikeys',
        path: '/access-control/api-keys',
        key: 'apikeys',
        selectedIcon: 'icon-key-filled',
        icon: 'icon-key',
        defaultIcon: 'icon-key',
        component: './api-keys'
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

export default applyRouteExtensions(baseRoutes);
