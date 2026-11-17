import { useState, type SetStateAction } from 'react';
import type { ModelMetric } from '../config/types';
import {
  defaultMonitoringSections,
  type MonitoringPage
} from '../utils/monitoring-sections';

interface Options {
  identity: string | number;
  mode: MonitoringPage;
  pd?: boolean;
  metrics?: Record<string, ModelMetric>;
}

export const useMonitoringExpansion = ({
  identity,
  mode,
  pd,
  metrics
}: Options) => {
  const key = JSON.stringify([mode, identity]);
  const ready = mode === 'benchmark' ? pd !== undefined : metrics !== undefined;
  const initial = () => ({
    key,
    pd: pd ?? false,
    initialized: ready,
    expanded: defaultMonitoringSections(mode, pd ?? false, metrics),
    details: [] as string[]
  });
  const [state, setState] = useState(initial);
  let current = state;
  // Resolve only the first response for this record, before rendering children.
  // Later scope changes and refreshes cannot override the user's visibility.
  if (state.key !== key || (!state.initialized && ready)) {
    current = initial();
    setState(current);
  } else if (pd !== undefined && pd !== state.pd) {
    const previousCore = state.pd ? 'pools' : 'llm';
    current = {
      ...state,
      pd,
      expanded: state.expanded.map((section) =>
        section === previousCore ? (pd ? 'pools' : 'llm') : section
      )
    };
    setState(current);
  }
  const update = (
    field: 'expanded' | 'details',
    next: SetStateAction<string[]>
  ) =>
    setState((previous) => {
      if (previous.key !== key || (pd !== undefined && previous.pd !== pd))
        return previous;
      return {
        ...previous,
        initialized: true,
        [field]: typeof next === 'function' ? next(previous[field]) : next
      };
    });
  return {
    pd: current.pd,
    expanded: current.expanded,
    setExpanded: (next: SetStateAction<string[]>) => update('expanded', next),
    details: current.details,
    setDetails: (next: SetStateAction<string[]>) => update('details', next)
  };
};
