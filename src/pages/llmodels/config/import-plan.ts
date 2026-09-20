import { useIntl } from '@umijs/max';
import { DeploymentAction, DeploymentPlanEntry } from './types';

type Intl = ReturnType<typeof useIntl>;

// What each planned action looks like in the plan's navigation list, where a
// dot beside the name is the only place the action is drawn. CSS variables
// rather than a fixed palette: the drawer follows the active theme, as does
// the diff beside it.
export const ACTION_COLORS: Record<DeploymentAction, string> = {
  create: 'var(--ant-color-success)',
  update: 'var(--ant-color-warning)',
  unchanged: 'var(--ant-color-border)'
};

// How an entry is named where it is pointed at — the list and the breadcrumb
// above the diff. An entry that did not parse far enough to have a name is
// identified by where it sits in the document.
export const entryName = (intl: Intl, entry: DeploymentPlanEntry): string =>
  entry.name ||
  intl.formatMessage({ id: 'models.import.entry' }, { index: entry.index + 1 });

// What the entry would do, and how much of it. A problem outranks the action
// that is no longer going to happen.
export const entryCaption = (
  intl: Intl,
  entry: DeploymentPlanEntry
): string => {
  if (entry.errors.length) {
    return intl.formatMessage({ id: 'models.import.nav.invalid' });
  }
  if (!entry.action) {
    return '';
  }
  const action = intl.formatMessage({
    id: `models.import.action.${entry.action}`
  });
  if (!entry.changes.length) {
    return action;
  }
  const changes = intl.formatMessage(
    { id: 'models.import.changes' },
    { count: entry.changes.length }
  );
  return `${action} · ${changes}`;
};

export const entryColor = (entry: DeploymentPlanEntry): string =>
  entry.errors.length
    ? 'var(--ant-color-error)'
    : ACTION_COLORS[entry.action!] || 'var(--ant-color-border)';
