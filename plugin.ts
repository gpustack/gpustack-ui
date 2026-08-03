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
      // Hold on to the node just inserted rather than looking it back up: the guard
      // below has to be about *this* script, and "the first inline script in <head>"
      // stops meaning that the moment anything else inline lands there (analytics, a
      // theme-flash snippet, a runtime shim from a umi upgrade) — the guard would then
      // vouch for a stranger's position and miss the very reshuffle it exists to catch.
      // Node identity cannot drift that way.
      const charset = $('head meta[charset]');
      let recovery;
      if (charset.length) {
        charset.after(ASSET_RECOVERY_SCRIPT);
        recovery = charset.next();
      } else {
        $('head').prepend(ASSET_RECOVERY_SCRIPT);
        recovery = $('head').children().first();
      }

      // Guard the ordering that the paragraph above is entirely about: if a future head
      // reshuffle puts the stylesheet first, recovery silently stops covering the
      // carrier it exists for, and nothing else in the build would notice.
      const headNodes = $('head').children().toArray();
      const scriptAt = headNodes.indexOf(recovery[0]);
      const styleAt = headNodes.findIndex((node) =>
        $(node).is('link[rel="stylesheet"]')
      );
      if (scriptAt < 0) {
        throw new Error(
          'modifyHTML: the asset-recovery script is not a direct child of <head> after ' +
            'insertion, so its position relative to the stylesheet cannot be verified.'
        );
      }
      if (styleAt >= 0 && scriptAt > styleAt) {
        throw new Error(
          `modifyHTML: asset-recovery script must precede the stylesheet link ` +
            `(script at ${scriptAt}, stylesheet at ${styleAt}). A listener registered ` +
            'after the stylesheet cannot see it fail to load.'
        );
      }

      // The snippet only treats *same-origin* asset failures as staleness — anything else
      // is a third-party script or an ad blocker, not our deploy. That test is correct only
      // while webpack emits root-relative URLs, which it does because `publicPath` is unset.
      // Point `publicPath` at a CDN origin and the test stops matching: recovery would go on
      // running and silently never fire again. Catch it here, at the moment someone makes
      // that change. Scoped to the build's own two assets, so adding a third-party <script>
      // to the HTML later cannot trip it.
      const ownAssets = [
        ...$('script[src*="js/umi."]').toArray(),
        ...$('link[rel="stylesheet"][href*="css/umi."]').toArray()
      ].map((node) => $(node).attr('src') || $(node).attr('href') || '');
      const crossOrigin = ownAssets.filter(
        (url) => !url.startsWith('/') || url.startsWith('//')
      );
      if (crossOrigin.length) {
        throw new Error(
          `modifyHTML: build assets must be root-relative for asset-recovery's same-origin ` +
            `test to match, but found ${JSON.stringify(crossOrigin)}. A cross-origin ` +
            'publicPath needs that test widened first, or stale-asset recovery silently ' +
            'stops firing.'
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
