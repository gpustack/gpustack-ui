import { useSubmitLock } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useRef, useState } from 'react';
import type { ListItem } from '../../../../config/types';
import type { HistoryState } from '../config/types';
import {
  deleteRevision,
  getRevision,
  getRevisionModel,
  getRevisions,
  previewRollback,
  restartModel,
  rollbackRevision
} from '../services';

const initialState: HistoryState = {
  restartError: null,
  model: null,
  items: [],
  page: 1,
  total: 0,
  latest: null,
  selected: null,
  comparison: null,
  rollback: null,
  loading: false,
  comparisonLoading: false,
  error: null
};

export default function useModelRevisions(
  onUpdated: () => void,
  onClosed?: () => void
) {
  const [state, setState] = useState<HistoryState>(initialState);
  const requestId = useRef(0);
  const { loading: saving, guard, run } = useSubmitLock();
  const intl = useIntl();
  const errorText = (error: any) =>
    error?.response?.data?.message ||
    intl.formatMessage({ id: 'models.revisions.failed' });

  async function select(model: ListItem, revision: number) {
    const ticket = ++requestId.current;
    setState((previous) => ({
      ...previous,
      selected: revision,
      comparison: null,
      rollback: null,
      comparisonLoading: true,
      error: null
    }));
    try {
      // Only the immediate predecessor describes this revision's own change.
      // A missing predecessor must not fall back to an older retained revision.
      const [target, previous] = await Promise.all([
        getRevision(model.id, revision),
        revision > 1
          ? getRevision(model.id, revision - 1).catch((error) => {
              if (error?.response?.status === 404) return null;
              throw error;
            })
          : Promise.resolve(null)
      ]);
      if (ticket === requestId.current) {
        setState((current) => ({
          ...current,
          comparison: { target, previous },
          comparisonLoading: false
        }));
      }
    } catch (error) {
      if (ticket === requestId.current) {
        setState((previous) => ({
          ...previous,
          comparisonLoading: false,
          error: errorText(error)
        }));
      }
    }
  }

  async function load(model: ListItem, page = 1) {
    const ticket = ++requestId.current;
    setState((previous) => ({
      ...previous,
      model,
      page,
      items: [],
      loading: true,
      comparison: null,
      rollback: null,
      selected: null,
      comparisonLoading: false,
      error: null
    }));
    try {
      const [result, current] = await Promise.all([
        getRevisions(model.id, page),
        getRevisionModel(model.id)
      ]);
      if (ticket !== requestId.current) return;
      setState((previous) => ({
        ...previous,
        model: current,
        items: result.items,
        total: result.pagination.total,
        latest:
          page === 1 ? (result.items[0]?.revision ?? null) : previous.latest,
        loading: false
      }));
      if (result.items[0]) await select(current, result.items[0].revision);
    } catch (error) {
      if (ticket === requestId.current) {
        setState((previous) => ({
          ...previous,
          loading: false,
          error: errorText(error)
        }));
      }
    }
  }

  function open(model: ListItem) {
    setState({ ...initialState, model });
    void load(model);
  }

  function dismiss() {
    ++requestId.current;
    setState(initialState);
    onClosed?.();
  }

  function close() {
    if (saving) return;
    dismiss();
  }

  async function reviewRollback(revision: number) {
    const model = state.model;
    if (
      !model ||
      revision === state.latest ||
      !state.comparison ||
      saving ||
      state.loading ||
      state.comparisonLoading
    )
      return;
    const ticket = ++requestId.current;
    setState((previous) => ({
      ...previous,
      rollback: {
        revision,
        preview: null,
        loading: true,
        error: null,
        restartOnRollback: true
      }
    }));
    try {
      const preview = await previewRollback(model.id, revision);
      if (ticket === requestId.current) {
        setState((previous) => ({
          ...previous,
          rollback: {
            revision,
            preview,
            loading: false,
            error: null,
            restartOnRollback: true
          }
        }));
      }
    } catch (error) {
      if (ticket === requestId.current) {
        setState((previous) => ({
          ...previous,
          rollback: {
            revision,
            restartOnRollback: true,
            preview: null,
            loading: false,
            error: errorText(error)
          }
        }));
      }
    }
  }

  function cancelRollback() {
    if (saving) return;
    ++requestId.current;
    setState((previous) => ({ ...previous, rollback: null }));
  }

  function setRestartOnRollback(restartOnRollback: boolean) {
    if (saving || state.rollback?.loading) return;
    setState((previous) => ({
      ...previous,
      rollback: previous.rollback
        ? { ...previous.rollback, restartOnRollback }
        : null
    }));
  }

  async function restart(id: number): Promise<string | null> {
    try {
      await restartModel(id);
      return null;
    } catch (error: any) {
      return (
        error?.response?.data?.message ||
        intl.formatMessage({ id: 'models.restart.failed' })
      );
    }
  }

  function retryRestart() {
    const model = state.model;
    if (!model || !state.restartError) return;
    let task: Promise<void> | undefined;
    guard(() => {
      task = run(async () => {
        const restartError = await restart(model.id);
        if (restartError)
          setState((previous) => ({ ...previous, restartError }));
        else dismiss();
        onUpdated();
      });
    });
    return task;
  }

  function mutate(
    action: 'rollback' | 'delete',
    revision: number,
    restartOnRollback = false
  ) {
    const model = state.model;
    if (!model) return;
    let task: Promise<void> | undefined;
    guard(() => {
      task = run(async () => {
        ++requestId.current;
        setState((previous) => ({
          ...previous,
          error: null,
          comparisonLoading: false,
          rollback: previous.rollback
            ? { ...previous.rollback, error: null }
            : null
        }));
        try {
          let restartError: string | null = null;
          if (action === 'rollback') {
            await rollbackRevision(model.id, revision);
            // Configuration is already saved; a failed restart must not repeat rollback.
            restartError = restartOnRollback ? await restart(model.id) : null;
            setState((previous) => ({ ...previous, restartError }));
          } else await deleteRevision(model.id, revision);
          onUpdated();
          if (action === 'rollback' && !restartError) dismiss();
          else await load(model);
        } catch (error: any) {
          // A history entry may be pruned while its preview is open.
          if (
            error?.response?.status === 404 ||
            error?.response?.status === 409
          ) {
            await load(model);
          }
          setState((previous) =>
            action === 'rollback' && previous.rollback
              ? {
                  ...previous,
                  rollback: { ...previous.rollback, error: errorText(error) }
                }
              : { ...previous, error: errorText(error) }
          );
          throw error;
        }
      });
    });
    return task;
  }

  function confirmRollback() {
    const review = state.rollback;
    if (!review || review.loading || review.error || !review.preview?.changed)
      return;
    return mutate('rollback', review.revision, review.restartOnRollback);
  }

  return {
    state,
    saving,
    open,
    close,
    mutate,
    reviewRollback,
    cancelRollback,
    confirmRollback,
    setRestartOnRollback,
    retryRestart,
    changePage: (page: number) => state.model && void load(state.model, page),
    select: (revision: number) =>
      state.model && void select(state.model, revision)
  };
}

export type ModelRevisionsController = ReturnType<typeof useModelRevisions>;
