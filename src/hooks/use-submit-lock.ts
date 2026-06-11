import { useMemoizedFn } from 'ahooks';
import { useRef, useState } from 'react';

/**
 * Centralizes the anti-double-submit + anti-deadlock logic shared by the
 * "add/edit" modals.
 *
 * The lock has to straddle antd's async field validation, whose result comes
 * back through two separate callbacks (`onFinish` / `onFinishFailed`). So the
 * three wiring points below are intentional and map 1:1 to those anchors:
 *
 * - `guard`   wrap the submit trigger (button / ModalFooter onOk). Blocks
 *             re-entry while a submit is already in flight, then fires submit.
 * - `run`     wrap the `onFinish` handler. Holds the lock + loading until the
 *             `onOk` request settles (success or error).
 * - `release` pass as the form's `onFinishFailed`. Releases the lock when
 *             validation fails, otherwise the button would dead-lock.
 */
export default function useSubmitLock() {
  const [loading, setLoading] = useState<boolean>(false);
  const lockRef = useRef<boolean>(false);

  const release = useMemoizedFn(() => {
    setLoading(false);
    lockRef.current = false;
  });

  const guard = useMemoizedFn((submit: () => void) => {
    if (lockRef.current) {
      return;
    }
    lockRef.current = true;
    submit();
  });

  const run = useMemoizedFn(async (task: () => void | Promise<void>) => {
    setLoading(true);
    try {
      await task();
    } finally {
      release();
    }
  });

  return { loading, guard, run, release };
}
