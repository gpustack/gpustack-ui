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
      // Umi writes the entry asset URLs root-absolute (`/js/umi.x.js`) whatever
      // `publicPath` is set to, and a root-absolute URL resolves against the
      // origin — which is the customer's own app when GPUStack is mounted under a
      // subpath. Drop the leading slash so they resolve against the document
      // instead, always the mount root because the router is `hash`.
      //
      // Only these first two assets need it: everything loaded later (async
      // chunks, the Monaco and embedding workers) goes through the webpack
      // runtime, which `publicPath: 'auto'` points at the entry script's own URL.
      //
      // Protocol-relative URLs (`//cdn.example.com/x.js`) also start with a
      // slash and are left alone — stripping theirs would turn a host into a path.
      const rootAbsolute = $('script[src], link[href]').filter((_index, el) => {
        const url = $(el).attr('src') ?? $(el).attr('href') ?? '';
        return url.startsWith('/') && !url.startsWith('//');
      });
      if (rootAbsolute.length === 0) {
        throw new Error(
          'modifyHTML: no root-absolute asset URL found to make relative. Umi ' +
            'emits at least the entry script and stylesheet that way, so an ' +
            'empty match means the markup changed shape — and a subpath ' +
            'deployment would then silently fetch assets from the origin root.'
        );
      }
      rootAbsolute.each((_index, el) => {
        const $el = $(el);
        const attr = $el.attr('src') != null ? 'src' : 'href';
        $el.attr(attr, $el.attr(attr)!.slice(1));
      });

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
