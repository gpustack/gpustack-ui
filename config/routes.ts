export default [
  {
    path: '/',
    key: 'dashboard',
    layout: false,
    icon: 'home',
    redirect: '/dashboard'
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    key: 'dashboard',
    icon: 'home',
    component: './dashboard'
  },
  {
    name: 'Playground',
    title: 'Playground',
    path: '/playground',
    key: 'playground',
    icon: 'Comment',
    component: './playground'
  },
  {
    name: 'Models',
    path: '/models',
    key: 'models',
    icon: 'Block',
    component: './models'
  },
  {
    name: 'Nodes',
    path: '/nodes',
    key: 'nodes',
    icon: 'CloudServer',
    component: './nodes'
  },
  {
    name: 'Users',
    path: '/users',
    key: 'users',
    icon: 'Team',
    component: './users'
  },
  {
    name: '404',
    path: '*',
    key: '404',
    layout: false,
    component: './404'
  }
];
