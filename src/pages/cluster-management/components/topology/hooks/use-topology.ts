import { useIntl } from '@umijs/max';
import { Button, message } from 'antd';
import { createElement, useEffect, useRef, useState } from 'react';
import { queryClusterTopology, setTopologyLocations } from '../../../apis';
import {
  LocationAssignment,
  LocationsResponse,
  TopologyView
} from '../../../config/types';

/** How long the undo stays offered. The stack holds one entry and dies with it. */
const UNDO_TOAST_SECONDS = 5;
const UNDO_TOAST_KEY = 'topology-undo';

interface UseTopologyOptions {
  clusterId?: number | null;
  open: boolean;
  /** Fires with every write response, so a live preview can recompute. */
  onWrite?: (view: TopologyView) => void;
}

export interface UseTopology {
  topology: TopologyView | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /**
   * Fill values and offer an undo. `summary` is the toast's sentence ("node-9's
   * rack is now R3"). Rejects with the server's message so the caller can show
   * it where the edit happened.
   */
  assign: (
    assignments: LocationAssignment[],
    summary: string
  ) => Promise<TopologyView>;
  /**
   * Bracket a cell's editing or saving. A refresh that lands inside the
   * bracket is held and applied when the last bracket closes — a poll must not
   * yank a half-typed value out from under the cursor.
   */
  beginBusy: () => void;
  endBusy: () => void;
}

/**
 * One cluster's topology, as the saved mapping sees it.
 *
 * No polling. Locations change slowly, and a poll competes with the operator
 * for the cell being edited. The data is refreshed at exactly three moments:
 * on open, with every write response (which already carries the new view, so
 * no second request), and when the window regains focus — the moment someone
 * comes back from filling values elsewhere.
 */
const useTopology = ({
  clusterId,
  open,
  onWrite
}: UseTopologyOptions): UseTopology => {
  const intl = useIntl();
  const [topology, setTopology] = useState<TopologyView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Rotated on open and close so a stale response cannot paint a new session. */
  const sessionRef = useRef(0);
  const busyRef = useRef(0);
  const pendingRef = useRef<TopologyView | null>(null);
  /** The inverse of the most recent successful write, while its toast lives. */
  const undoRef = useRef<LocationAssignment[] | null>(null);
  const undoTimerRef = useRef<any>(null);
  const onWriteRef = useRef(onWrite);
  onWriteRef.current = onWrite;

  const apply = (view: TopologyView) => {
    if (busyRef.current > 0) {
      pendingRef.current = view;
      return;
    }
    pendingRef.current = null;
    setTopology(view);
  };

  const refresh = async () => {
    if (!clusterId) {
      return;
    }
    const session = sessionRef.current;
    setLoading(true);
    try {
      const view = await queryClusterTopology(
        { id: clusterId },
        { skipErrorHandler: true }
      );
      if (sessionRef.current !== session) {
        return;
      }
      setError(null);
      apply(view);
    } catch (e: any) {
      if (sessionRef.current !== session) {
        return;
      }
      setError(
        e?.response?.data?.message ||
          intl.formatMessage({ id: 'clusters.topology.load.failed' })
      );
    } finally {
      if (sessionRef.current === session) {
        setLoading(false);
      }
    }
  };

  const clearUndo = () => {
    undoRef.current = null;
    clearTimeout(undoTimerRef.current);
  };

  const undo = async () => {
    const previous = undoRef.current;
    if (!previous || !clusterId) {
      return;
    }
    clearUndo();
    try {
      const result = await setTopologyLocations({
        id: clusterId,
        assignments: previous
      });
      // Not pushed onto the stack: undoing an undo is just editing again.
      setTopology(result.topology);
      onWriteRef.current?.(result.topology);
      message.open({
        key: UNDO_TOAST_KEY,
        type: 'success',
        content: intl.formatMessage({ id: 'clusters.topology.undo.done' })
      });
    } catch (e: any) {
      // The table keeps whatever the server says now; only the shortcut is lost.
      message.open({
        key: UNDO_TOAST_KEY,
        type: 'error',
        content: intl.formatMessage(
          { id: 'clusters.topology.undo.failed' },
          { reason: e?.response?.data?.message || e?.message || '' }
        )
      });
    }
  };

  const offerUndo = (previous: LocationAssignment[], summary: string) => {
    clearUndo();
    undoRef.current = previous;
    undoTimerRef.current = setTimeout(clearUndo, UNDO_TOAST_SECONDS * 1000);
    message.open({
      key: UNDO_TOAST_KEY,
      type: 'success',
      duration: UNDO_TOAST_SECONDS,
      content: createElement(
        'span',
        null,
        summary,
        ' · ',
        createElement(
          Button,
          {
            type: 'link',
            size: 'small',
            style: { padding: 0, height: 'auto' },
            // Reachable: Alt+Z below is the keyboard path, this is the mouse one.
            onClick: undo
          },
          intl.formatMessage({ id: 'clusters.topology.undo' })
        )
      )
    });
  };

  const assign = async (assignments: LocationAssignment[], summary: string) => {
    if (!clusterId) {
      throw new Error('no cluster');
    }
    let result: LocationsResponse;
    try {
      result = await setTopologyLocations({ id: clusterId, assignments });
    } catch (e: any) {
      throw new Error(
        e?.response?.data?.message ||
          e?.message ||
          intl.formatMessage({ id: 'clusters.topology.save.failed' })
      );
    }
    // A write response replaces state outright, busy or not: the cell that
    // asked for it is the one waiting, and everything else only re-reads
    // props. Holding it would show a stale value next to a success toast.
    pendingRef.current = null;
    setTopology(result.topology);
    onWriteRef.current?.(result.topology);
    offerUndo(result.previous, summary);
    return result.topology;
  };

  const beginBusy = () => {
    busyRef.current += 1;
  };

  const endBusy = () => {
    busyRef.current = Math.max(0, busyRef.current - 1);
    if (busyRef.current === 0 && pendingRef.current) {
      const view = pendingRef.current;
      pendingRef.current = null;
      setTopology(view);
    }
  };

  useEffect(() => {
    sessionRef.current += 1;
    if (!open || !clusterId) {
      setTopology(null);
      setError(null);
      busyRef.current = 0;
      pendingRef.current = null;
      clearUndo();
      message.destroy(UNDO_TOAST_KEY);
      return;
    }
    refresh();

    const onFocus = () => {
      refresh();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'z' || e.key === 'Z') && undoRef.current) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('keydown', onKeyDown);
    };
    // Keyed on open and the cluster only: the drawer's other props change
    // without anything on the server having changed.
  }, [open, clusterId]);

  return { topology, loading, error, refresh, assign, beginBusy, endBusy };
};

export default useTopology;
