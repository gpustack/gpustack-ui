export function createVideoPollingController() {
  let active = true;
  const listeners = new Set<() => void>();

  const wait = (signal: AbortSignal, interval: number) => {
    signal.throwIfAborted();
    return new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const cleanup = () => {
        clearTimeout(timer);
        listeners.delete(handleActivity);
        signal.removeEventListener('abort', handleAbort);
      };
      const finish = () => {
        cleanup();
        resolve();
      };
      const handleAbort = () => {
        cleanup();
        reject(signal.reason);
      };
      const handleActivity = () => {
        if (active) finish();
        else clearTimeout(timer);
      };

      listeners.add(handleActivity);
      signal.addEventListener('abort', handleAbort, { once: true });
      if (active) timer = setTimeout(finish, interval);
    });
  };

  return {
    setActive(value: boolean) {
      if (active === value) return;
      active = value;
      for (const listener of listeners) listener();
    },
    waitForPoll: (signal: AbortSignal) => wait(signal, 5000),
    waitUntilActive(signal: AbortSignal) {
      signal.throwIfAborted();
      return active ? Promise.resolve() : wait(signal, 0);
    }
  };
}
