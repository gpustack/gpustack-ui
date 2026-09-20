import jsYaml from 'js-yaml';
import { DeploymentPlanEntry } from '../../config/types';

// `lineWidth: -1` because a folded line is a diff artefact: the same value
// would break differently on the two sides and read as an edit that is not
// there. `noRefs` keeps a repeated block spelled out rather than turning into
// a YAML anchor nobody wrote.
const dump = (value: Record<string, any>): string =>
  Object.keys(value || {}).length
    ? jsYaml.dump(value, { lineWidth: -1, noRefs: true })
    : '';

// The deployment being replaced, which the editor shows read-only beside the
// entry replacing it. Empty for a create — there is nothing to compare to.
export const currentText = (entry: DeploymentPlanEntry): string =>
  dump(entry.current);

// What the editor puts in front of the user for one entry: the normalized
// projection where there is one, so it diffs cleanly against the deployment
// beside it, and the file's own text where validation rejected the entry —
// the entry most in need of editing is the one with no projection to show.
//
// `{}` rather than nothing when neither exists (an item that is not even a
// mapping): an empty document would be dropped on the way back in, silently
// taking the entry with it. A mapping keeps the entry, and its error.
export const entryText = (entry: DeploymentPlanEntry): string =>
  dump(entry.desired) || dump(entry.raw) || '{}\n';

// One document per entry with `---` between them: the shape the import route
// parses, and the shape the file arrived in.
const joinDocuments = (texts: string[]): string =>
  texts.map((text) => `${text.replace(/\n*$/, '')}\n`).join('---\n');

// The whole file as the plan renders it, for editing every entry at once.
export const documentText = (entries: DeploymentPlanEntry[]): string =>
  joinDocuments(entries.map(entryText));

// What the cluster holds today for the same entries, read-only beside the
// document above. A create contributes an empty document, so the entry reads
// as wholly added.
export const currentDocumentText = (entries: DeploymentPlanEntry[]): string =>
  joinDocuments(entries.map(currentText));

// A document boundary is a `---` alone on its own line — what `joinDocuments`
// writes above, and what the parser reads on the way back in. A `---` inside a
// block scalar is indented, so it cannot be mistaken for one.
const BOUNDARY = /^---[ \t]*$/m;

// The document as the entries it holds, numbered the way the plan numbers
// them.
export const splitDocuments = (text: string): string[] => text.split(BOUNDARY);

// The document with the stretch a pane owns replaced by the text it was
// edited to, leaving every other entry byte for byte as it was. `null` when
// the index is past the end: the pane then belongs to a plan the document has
// already outgrown, and writing past the end would splice in blank entries.
//
// A pane opens on one document but does not stay one: a `---` typed into it
// leaves it holding two, and a later edit has to replace both. `count` is how
// many the pane took over — replacing fewer would leave the ones it grew
// standing beside the text that now includes them, duplicating every entry
// after the first on every flush.
//
// Patching rather than re-rendering from the plan is what keeps an edit that
// is still in flight: the plan lags a re-check by a round trip, so rebuilding
// the whole document from it would revert whatever has not come back yet.
export const replaceDocumentsAt = (
  text: string,
  index: number,
  count: number,
  next: string
): string | null => {
  const documents = splitDocuments(text);
  if (index < 0 || index >= documents.length) {
    return null;
  }
  const trimmed = next.replace(/^\n+|\n+$/g, '');
  documents.splice(
    index,
    count,
    index === 0 ? `${trimmed}\n` : `\n${trimmed}\n`
  );
  return documents.join('---');
};
