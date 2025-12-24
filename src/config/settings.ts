export const HEADER_HEIGHT = 56;

export const DEFAULT_ENTER_PAGE = {
  adminForNormal: '/dashboard',
  adminForFirst: '/resources/workers',
  user: '/models/user-models',
  login: '/login'
};

export const GPUSTACK_API_BASE_URL = 'v2';
export const OPENAI_COMPATIBLE = 'v1';

type SortDirection = 'ascend' | 'descend' | null;

export const TABLE_SORT_DIRECTIONS: SortDirection[] = [
  'ascend',
  'descend',
  null
];

export const tableSorter = (order: number | boolean) => {
  return true;

  // mutiple sorting can be supported in future

  // if (typeof order === 'number') {
  //   return {
  //     multiple: order
  //   };
  // }
  // return order;
};
