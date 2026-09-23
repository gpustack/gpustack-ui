import { useIntl } from '@umijs/max';
import { useRef, useState } from 'react';
import { previewClusterTopology } from '../../../apis';
import { ClusterTopology, TopologyView } from '../../../config/types';

/** How long to sit on a change before asking the server to redraw. */
const PREVIEW_DEBOUNCE_MS = 400;

export interface UsePreview {
  /** The view under the unsaved mapping, while a preview session is active. */
  preview: TopologyView | null;
  active: boolean;
  loading: boolean;
  /** The server refusing the mapping (a duplicate custom name, a fork). */
  error: string | null;
  /** Debounced. Starts the session on first call. */
  run: (topology: ClusterTopology) => void;
  /** Re-post the last mapping: a location write changed the workers underneath. */
  rerun: () => void;
  /** End the session; the drawer goes back to the saved mapping. */
  reset: () => void;
}

/**
 * The Advanced sub-drawer's preview session.
 *
 * Its result is an overlay on what the main drawer shows — never written into
 * the saved-state hook — so closing the sub-drawer without saving is a
 * `reset()` and nothing else. A failed preview keeps the last good one on
 * screen: the operator is mid-edit, and a blank table says less than the
 * previous answer plus the reason.
 */
const usePreview = ({
  clusterId
}: {
  clusterId?: number | null;
}): UsePreview => {
  const intl = useIntl();
  const [preview, setPreview] = useState<TopologyView | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Bumped per request so a slow answer cannot paint over a fresher one. */
  const sessionRef = useRef(0);
  const timerRef = useRef<any>(null);
  const lastRef = useRef<ClusterTopology | null>(null);

  const post = async (topology: ClusterTopology) => {
    if (!clusterId) {
      return;
    }
    const session = ++sessionRef.current;
    setLoading(true);
    try {
      const view = await previewClusterTopology({ id: clusterId, topology });
      if (sessionRef.current !== session) {
        return;
      }
      setPreview(view);
      setError(null);
    } catch (e: any) {
      if (sessionRef.current !== session) {
        return;
      }
      setError(
        e?.response?.data?.message ||
          e?.message ||
          intl.formatMessage({ id: 'clusters.topology.preview.failed' })
      );
    } finally {
      if (sessionRef.current === session) {
        setLoading(false);
      }
    }
  };

  const run = (topology: ClusterTopology) => {
    lastRef.current = topology;
    setActive(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => post(topology), PREVIEW_DEBOUNCE_MS);
  };

  const rerun = () => {
    if (lastRef.current) {
      post(lastRef.current);
    }
  };

  const reset = () => {
    sessionRef.current += 1;
    clearTimeout(timerRef.current);
    lastRef.current = null;
    setPreview(null);
    setActive(false);
    setLoading(false);
    setError(null);
  };

  return { preview, active, loading, error, run, rerun, reset };
};

export default usePreview;
