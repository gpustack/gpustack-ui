/**
 * Recovery from a chunk that 404s after a release.
 *
 * The case this exists for is a tab that has been open across a deploy. Its document is
 * already in memory, so the chunk names it will go on to request are fixed at that
 * build's hashes — the ones the release just deleted. No HTTP cache header can reach
 * that: the browser never re-asks for `index.html`. A stale *document* is the opposite
 * problem and belongs to the backend (`Cache-Control: no-cache` on `index.html`), which
 * is why none of this runs before mount any more.
 *
 * `ErrorBoundary` is the only trigger. It fires from a real render, i.e. a navigation the
 * user chose — whereas `routePrefetch: 'intent'` can fetch a chunk because a mouse passed
 * over a menu item, and reloading the page because of a hover is indefensible.
 */

const KEY = 'gpustack.asset-recovery';

/**
 * The backstop under the version test in `claimAttempt`: never more than this many
 * automatic reloads inside this window, whatever the versions say.
 */
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 60_000;

interface Attempt {
  /** The document version that failed. */
  version: string;
  at: number;
  /** `drop_console` strips every `console.*` from the production bundle, so this is the
   * only diagnostic a spent attempt leaves behind. */
  detail: string;
}

/**
 * The build the running document came from, stamped onto `<html>` by `plugin.ts`.
 */
function currentVersion(): string {
  return document.documentElement.dataset.version || 'unknown';
}

/**
 * Tolerant on purpose: a corrupted or previous-format value must read as "no attempts
 * yet", not poison the guard into declining forever.
 */
function parseAttempts(raw: string | null): Attempt[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item && typeof item.at === 'number' && typeof item.version === 'string'
    );
  } catch (err) {
    return [];
  }
}

/**
 * One automatic attempt per document version, not per tab.
 *
 * The record has to outlive the reload it guards — the module is re-initialized by the
 * very navigation it triggers, so an in-memory flag would read "unused" again on the other
 * side and loop forever. But a record that is *never* released is equally wrong: the tab
 * would spend its single attempt and every later release would leave it on the error page.
 * Scoping it to the version resolves both, because the two cases differ in exactly this
 * respect:
 *
 *   - stale document — the reload lands on a *new* version, nothing matches, and the tab
 *     is armed again for the release after that;
 *   - genuinely broken deploy — the reload lands on the *same* version, which means the
 *     assets are gone rather than merely renamed, so the retry is declined in favour of
 *     the error UI.
 *
 * The count and the window are the backstop the version test cannot provide on its own: a
 * mixed-version fleet mid-rollout can answer one request with a V1 document and the next
 * with V2 chunks, flipping the version on every reload so that no two consecutive attempts
 * ever match. Only a hard cap stops that. Genuine releases are minutes apart and never
 * come near it.
 */
function claimAttempt(detail: string): boolean {
  try {
    const version = currentVersion();
    const now = Date.now();
    const recent = parseAttempts(sessionStorage.getItem(KEY)).filter(
      (attempt) => attempt.at > now - WINDOW_MS
    );

    if (recent.some((attempt) => attempt.version === version)) return false;
    if (recent.length >= MAX_ATTEMPTS) return false;

    sessionStorage.setItem(
      KEY,
      JSON.stringify([...recent, { version, at: now, detail }])
    );
    return true;
  } catch (err) {
    // No storage at all (private mode, blocked cookies) means no guard, so decline to
    // reload rather than reload unguarded.
    return false;
  }
}

/**
 * `_r` is always appended last, so a trailing match strips exactly it and leaves every
 * other param in place.
 */
function withoutBust(search: string): string {
  return search.replace(/[?&]_r=[^&]*$/, '');
}

/**
 * Vary the URL rather than calling `location.reload()`: an intermediary cache keyed on the
 * full URL can answer a bare reload with the very document that named the missing chunk,
 * and a busted URL misses that cache by construction. The hash route carries over so the
 * user lands where they were, and existing document params are kept — the backend's SSO
 * callback redirects to `/?error=<code>`, which the login page reads off
 * `window.location.search`, and dropping it would swallow the failure message.
 */
function bustedUrl(): string {
  const { pathname, search, hash } = window.location;
  const query = withoutBust(search);
  return `${pathname}${query ? `${query}&` : '?'}_r=${Date.now()}${hash}`;
}

/**
 * Recover from a chunk load failure with one cache-busting reload. Returns whether one was
 * started — `false` means the attempt for this build is spent and the caller owns the
 * error UI.
 */
export function recoverStaleAssets(detail: string): boolean {
  if (!claimAttempt(detail)) return false;
  window.location.replace(bustedUrl()); // replace(), so recovery adds no history entry
  return true;
}

/**
 * The error page's Reload button. Unconditional by design: the guard exists to stop
 * *automatic* loops, and a person pressing a button is not a loop. Still cache-busted — a
 * bare reload would hand them the same stale document they just failed on.
 */
export function reloadWithBust(): void {
  window.location.replace(bustedUrl());
}

/**
 * Drop `?_r=` once the app has mounted, before anyone copies or bookmarks it. Reaching
 * mount is the "booted fine" signal, so the breadcrumb has served its purpose. Idempotent:
 * the search test is false on every call after the first.
 */
export function cleanupBustParam(): void {
  const { pathname, search, hash } = window.location;
  if (search.indexOf('_r=') > -1) {
    history.replaceState(null, '', pathname + withoutBust(search) + hash);
  }
}
