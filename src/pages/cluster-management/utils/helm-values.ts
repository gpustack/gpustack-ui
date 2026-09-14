import jsYaml from 'js-yaml';
import _ from 'lodash';

type Offender = { path: string; reason: 'type' | 'unsafeInteger' };

/**
 * The first value YAML produced that JSON cannot carry unchanged, or `null`
 * when the whole tree survives the trip.
 *
 * Everything here reaches the request body through `JSON.stringify`, which
 * turns a YAML timestamp into `"2026-01-01T00:00:00.000Z"` and a `!!binary`
 * into `{"0":104,"1":105}`. Both are silent corruption of a field whose whole
 * contract is to pass the chart's keys through untouched, so they are refused
 * with the path that caused it.
 */
const findNonJsonValue = (value: unknown, path = ''): Offender | null => {
  if (value === null) return null;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const found = findNonJsonValue(value[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }

  if (_.isPlainObject(value)) {
    for (const [key, child] of Object.entries(value as object)) {
      const found = findNonJsonValue(child, path ? `${path}.${key}` : key);
      if (found) return found;
    }
    return null;
  }

  const at = path || '(root)';
  const type = typeof value;
  if (type === 'string' || type === 'boolean') return null;

  if (type === 'number') {
    if (!Number.isFinite(value)) return { path: at, reason: 'type' };
    // A whole number past 2^53-1 lost digits in the parse already — js-yaml
    // hands back the nearest double, so `9007199254740993` arrives as
    // `...992` and that is what would be sent. Helm reads it as an int64 and
    // would have kept it, so this is a difference the UI introduces.
    //
    // Non-integers are deliberately not checked: Helm parses floats into a
    // float64 too, so their precision is the same on both routes.
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      return { path: at, reason: 'unsafeInteger' };
    }
    return null;
  }

  // A Date (YAML timestamp), a Uint8Array (`!!binary`), a Map/Set — or
  // anything else a future tag resolves to.
  return { path: at, reason: 'type' };
};

/**
 * Parse the Chart Values editor's text into the object `k8sOptions.helmValues`
 * expects.
 *
 * Deliberately not `yaml2Json` from the backends config: that helper reports a
 * parse failure as `{}`, which here would silently send an empty override
 * instead of telling the user their YAML is broken.
 *
 * Returns the parsed mapping, or `null` for empty / comment-only input — the
 * field must be omitted rather than sent as `{}`, which the backend persists
 * as an empty object.
 */
export const parseHelmValues = (
  text: string | undefined,
  messages: {
    invalidYaml: (reason: string) => string;
    notMapping: string;
    notJson: (path: string) => string;
    unsafeInteger: (path: string) => string;
  }
): Record<string, any> | null => {
  const source = text || '';
  // Only to decide "is there anything here" — the parse gets `source`. A
  // `.trim()`ed document loses the indent of its *first* line alone, which
  // turns a block pasted out of a values.yaml into `bad indentation of a
  // mapping entry`: valid YAML reported as invalid.
  if (!source.trim()) return null;

  let parsed: unknown;
  try {
    // The default schema, on purpose — not JSON/CORE. Those drop the timestamp
    // and binary tags that produce non-JSON values, but they also stop
    // resolving merge keys, turning a `<<:` into a literal `<<` key: one silent
    // corruption traded for another. Keep anchors and merge keys working, and
    // refuse the non-JSON scalars explicitly below.
    parsed = jsYaml.load(source);
  } catch (e) {
    throw new Error(messages.invalidYaml((e as Error).message));
  }

  // A comment-only document (the placeholder, untouched) parses to undefined.
  if (_.isNil(parsed)) return null;

  // The chart merges by key, so the document has to be a mapping. A scalar or
  // a list has nothing to merge onto and would be rejected downstream.
  if (!_.isPlainObject(parsed)) {
    throw new Error(messages.notMapping);
  }

  const offender = findNonJsonValue(parsed);
  if (offender) {
    throw new Error(
      offender.reason === 'unsafeInteger'
        ? messages.unsafeInteger(offender.path)
        : messages.notJson(offender.path)
    );
  }

  const values = parsed as Record<string, any>;
  return Object.keys(values).length > 0 ? values : null;
};

/**
 * The backend rejects the paths that decide whether a release matches the
 * cluster it was issued for. That check runs in request-body validation, so
 * the 422 arrives aggregated: an `N validation errors:` prefix plus pydantic's
 * `msg`, itself prefixed with `Value error, `. Show what follows that prefix;
 * fall back to the whole message when the shape is not what we expect.
 *
 * The rejected paths are not mirrored here on purpose — they track the chart,
 * so the server's own message is the only list that stays correct.
 */
export const extractHelmValuesError = (error: any): string => {
  const message: string =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    '';
  if (!message) return '';

  const marker = 'Value error, ';
  const at = message.indexOf(marker);
  return at >= 0 ? message.slice(at + marker.length).trim() : message;
};

/**
 * Whether a failed create/update actually blames this field, so a 422 about
 * something else is not parked under the Chart Values editor.
 */
export const isHelmValuesError = (error: any): boolean => {
  const message: string =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    '';
  return (
    error?.response?.status === 422 &&
    /helmValues|helm_values|cannot be set here/i.test(message)
  );
};
