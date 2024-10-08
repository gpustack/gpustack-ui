import { IApi } from '@umijs/max';

export default (api: IApi) => {
  api.modifyHTML(($) => {
    const info = JSON.parse(process.env.VERSION || '{}');
    const env = process.env.NODE_ENV;
    $('html').attr(
      'data-version',
      env === 'production'
        ? info.version || info.commitId
        : `dev-${info.commitId}`
    );
    if (env === 'production') {
      $('script[src^="/js/umi"]').first?.().remove?.();
    }
    return $;
  });
  api.onStart(() => {
    console.log('start');
  });
};
