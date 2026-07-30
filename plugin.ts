import { IApi } from '@umijs/max';

export default (api: IApi) => {
  api.modifyHTML(($) => {
    const info = JSON.parse(process.env.VERSION || '{}');
    const env = process.env.NODE_ENV;

    $('html').attr('lang', 'en');

    $('html').attr('data-env', env);

    $('html').attr(
      'data-version',
      env === 'production' ? info.version || info.commitId : `${info.commitId}`
    );
    if (env === 'production') {
      // Umi injects the entry bundle through addHTMLHeadScripts, so it lands in
      // <head> — before <div id="root"> exists, leaving the app nothing to mount
      // into. Move it to the end of <body>. `append` relocates the existing node,
      // so the content-hashed src is never restated here, and re-appending a node
      // that is already last is a no-op.
      const entry = $('script[src*="js/umi."]');
      if (entry.length !== 1) {
        throw new Error(
          `modifyHTML: expected exactly 1 entry script, found ${entry.length}. ` +
            'Moving it after #root is what keeps the app mountable, so a silent ' +
            'miss here would ship a blank page.'
        );
      }
      $('body').append(entry);
    }
    return $;
  });
  api.onStart(() => {
    console.log('start');
  });
};
