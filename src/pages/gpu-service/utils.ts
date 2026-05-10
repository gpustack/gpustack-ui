import _ from 'lodash';

export const omitPathParams = <T extends Record<string, any>>(
  params: T
): Omit<T, 'namespace' | 'clusterID'> => {
  return _.omit(params, [
    'namespace',
    'clusterID',
    'page',
    'perPage',
    'cluster_id'
  ]) as Omit<T, 'namespace' | 'clusterID'>;
};
