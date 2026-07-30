/**
 * Inline recovery for a stale `index.html` — injected verbatim into `<head>` by
 * `plugin.ts` (production only), ahead of every asset reference in the document.
 *
 * It cannot be a module. The failure it recovers from is "the entry bundle 404s", so
 * anything bundled is by definition unavailable when it is needed. It is also the only
 * place a `console.error` survives: `jsMinifierOptions.compress.drop_console` strips
 * `console.*` from bundled code, and this string never reaches the JS minifier.
 *
 * Deliberately ES5-only DOM code with no dependency. Same-origin is tested against the
 * element's `.src` / `.href` *property*, which the DOM has already resolved to an
 * absolute URL — so this needs no awareness of `base` or `publicPath`.
 *
 * `window.__assetRecovery__` is the seam the bundled app uses:
 *   - `recover(detail)` — `ErrorBoundary`'s chunk-error path (the only post-mount trigger);
 *                         honours the one-attempt-per-tab guard
 *   - `reload()`        — the error page's Reload button; unconditional, still cache-busted
 *   - `disarm()`        — called once the app mounts; closes the pre-mount window and
 *                         cleans `?_r=` out of the address bar
 *
 * All three go through one URL builder on purpose. The guard and the cache-bust must not
 * exist in two places — two counters drift, and a second URL builder is how `_r` quietly
 * stops being appended on one of the paths.
 */
export const ASSET_RECOVERY_SCRIPT = `<script>
(function () {
  var KEY = 'gpustack.asset-recovery';
  var loc = window.location;

  // One automatic attempt per tab, and the marker is never cleared while the tab lives —
  // that is what makes a reload loop structurally impossible rather than merely unlikely.
  // With no storage at all (private mode, blocked cookies) there is no guard, so we
  // decline to reload and let the error UI take over instead of reloading unguarded.
  function claimAttempt() {
    try {
      if (sessionStorage.getItem(KEY)) return false;
      sessionStorage.setItem(KEY, '1');
      return true;
    } catch (err) {
      return false;
    }
  }

  // _r is always appended last, so a trailing match strips exactly it and leaves every
  // other param in place.
  function withoutBust(search) {
    return search.replace(/[?&]_r=[^&]*$/, '');
  }

  // Vary the URL. A bare reload can be answered by an intermediary cache (a CDN keyed on
  // the full URL) with the very document that named the missing files; a busted URL misses
  // that cache by construction. The hash route carries over so the user lands where they
  // were, and existing document params are kept — the backend's SSO callback redirects to
  // /?error=<code>, which the login page reads off window.location.search, and dropping it
  // would swallow the failure message the user is owed.
  function bustedUrl() {
    var query = withoutBust(loc.search);
    return loc.pathname + (query ? query + '&' : '?') + '_r=' + Date.now() + loc.hash;
  }

  function recover(detail) {
    // Logged before the guard is consulted: this is the only trace of a destructive
    // action, and the sole diagnostic left once the attempt is spent.
    console.error('[asset-recovery] ' + detail + ' — stale assets, reloading once');
    if (!claimAttempt()) return false;
    loc.replace(bustedUrl()); // replace(), so recovery adds no history entry
    return true;
  }

  function onError(e) {
    var el = e.target;
    if (!el || !el.tagName) return;
    var isStylesheet = el.tagName === 'LINK' && el.rel === 'stylesheet';
    if (el.tagName !== 'SCRIPT' && !isStylesheet) return;
    var url = el.src || el.href;
    // The trailing slash matters: it stops "https://evil.example" from passing as
    // same-origin for an origin that is a prefix of it.
    if (!url || url.indexOf(loc.origin + '/') !== 0) return;
    recover(url);
  }

  window.addEventListener('error', onError, true);

  window.__assetRecovery__ = {
    recover: recover,
    // The user pressed Reload on the error page, which only appears once the automatic
    // attempt is spent. Unconditional by design: F4's guard exists to stop *automatic*
    // loops, and a person pressing a button is not a loop. Still cache-busted — a bare
    // reload would hand them the same stale document they just failed on.
    reload: function () {
      loc.replace(bustedUrl());
    },
    disarm: function () {
      // After mount, a failed injected <script> is indistinguishable from a route
      // prefetch fired by a hover, and reloading on a hover is indefensible — so this
      // window closes and ErrorBoundary becomes the only trigger. Reaching mount is also
      // the "booted fine" signal, so drop ?_r= before anyone copies or bookmarks it.
      // Idempotent: removing an absent listener is a no-op, and the search test is false
      // on every call after the first.
      window.removeEventListener('error', onError, true);
      if (loc.search.indexOf('_r=') > -1) {
        history.replaceState(
          null,
          '',
          loc.pathname + withoutBust(loc.search) + loc.hash
        );
      }
    }
  };
})();
</script>`;
