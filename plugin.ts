import { IApi } from '@umijs/max';
import { ASSET_RECOVERY_SCRIPT } from './config/asset-recovery';

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
      // The recovery handler must precede every asset reference in the document — the
      // stylesheet <link> is the first thing a stale index.html can 404 on, and a
      // listener registered after it would miss that failure entirely.
      //
      // Not `prepend`: that lands ahead of <meta charset="utf-8">, pushing the charset
      // declaration past the first 1024 bytes, where browsers stop honouring it. Insert
      // right after the charset instead — still ahead of the stylesheet, which is all
      // the ordering requirement actually asks for.
      const charset = $('head meta[charset]');
      if (charset.length) {
        charset.after(ASSET_RECOVERY_SCRIPT);
      } else {
        $('head').prepend(ASSET_RECOVERY_SCRIPT);
      }

      // Guard the ordering that the paragraph above is entirely about: if a future head
      // reshuffle puts the stylesheet first, recovery silently stops covering the
      // carrier it exists for, and nothing else in the build would notice.
      const headNodes = $('head').children().toArray();
      const scriptAt = headNodes.findIndex(
        (node) => $(node).is('script') && !$(node).attr('src')
      );
      const styleAt = headNodes.findIndex((node) =>
        $(node).is('link[rel="stylesheet"]')
      );
      if (scriptAt < 0 || (styleAt >= 0 && scriptAt > styleAt)) {
        throw new Error(
          `modifyHTML: asset-recovery script must precede the stylesheet link ` +
            `(script at ${scriptAt}, stylesheet at ${styleAt}). A listener registered ` +
            'after the stylesheet cannot see it fail to load.'
        );
      }

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
