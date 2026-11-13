export interface ResourceSnapshot<T> {
  key: string;
  data: T | null;
  loading: boolean;
  stale: boolean;
  error: unknown;
}

// A response may only update the scope that initiated it. Retention is local
// to that same scope; authorization errors never retain revoked observations.
export class ScopedResource<T> {
  snapshot: ResourceSnapshot<T> = {
    key: '',
    data: null,
    loading: false,
    stale: false,
    error: null
  };
  private generation = 0;
  private abort?: AbortController;
  private listeners = new Set<() => void>();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(value: ResourceSnapshot<T>) {
    this.snapshot = value;
    this.listeners.forEach((listener) => listener());
  }
  reset = () => {
    this.generation += 1;
    this.abort?.abort();
    this.publish({
      key: '',
      data: null,
      loading: false,
      stale: false,
      error: null
    });
  };
  async load(
    key: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
    isCurrent: () => boolean = () => true
  ) {
    const generation = ++this.generation;
    this.abort?.abort();
    const controller = new AbortController();
    this.abort = controller;
    const previous = this.snapshot.key === key ? this.snapshot.data : null;
    this.publish({
      key,
      data: previous,
      loading: true,
      stale: this.snapshot.key === key && this.snapshot.stale,
      error: null
    });
    try {
      const data = await fetcher(controller.signal);
      if (generation !== this.generation) return;
      if (!isCurrent()) {
        this.reset();
        return;
      }
      this.publish({ key, data, loading: false, stale: false, error: null });
    } catch (error: any) {
      if (generation !== this.generation) return;
      if (!isCurrent()) {
        this.reset();
        return;
      }
      const revoked = [401, 403, 404].includes(error?.response?.status);
      this.publish({
        key,
        data: revoked ? null : previous,
        loading: false,
        stale: !revoked && previous !== null,
        error
      });
    }
  }
}
