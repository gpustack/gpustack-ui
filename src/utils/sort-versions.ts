import semverCoerce from 'semver/functions/coerce';
import semverGt from 'semver/functions/gt';

/**
 * Ascending comparator over release strings, coercing each to semver first so
 * "0.3.9" sorts under "0.3.10" where a lexical or numeric-collation compare
 * would not. A value semver cannot read at all — "nightly", "latest" — sorts
 * before every one it can, which keeps it out of the way of a caller taking
 * the last element as the newest.
 *
 * Coercion drops what it cannot parse, so a version and its suffixed sibling
 * ("1.0.0" and "1.0.0-rc1") coerce equal and keep whatever order they arrived
 * in. The published catalogs avoid carrying both.
 */
const sortVersions = (v2: string, v1: string) => {
  const sv1 = semverCoerce(v1);
  const sv2 = semverCoerce(v2);

  if (!sv1 && !sv2) return 0;
  if (!sv1) return 1;
  if (!sv2) return -1;

  if (semverGt(sv1, sv2)) return -1;
  return 1;
};

export default sortVersions;
