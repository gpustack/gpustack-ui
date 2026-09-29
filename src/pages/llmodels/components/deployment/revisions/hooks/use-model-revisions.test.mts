import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

const calls = {
  getRevisions: mock.fn<(...args: any[]) => Promise<any>>(),
  getRevision: mock.fn<(...args: any[]) => Promise<any>>(),
  getRevisionModel: mock.fn<(...args: any[]) => Promise<any>>(),
  previewRollback: mock.fn<(...args: any[]) => Promise<any>>(),
  rollbackRevision: mock.fn<(...args: any[]) => Promise<any>>(),
  restartModel: mock.fn<(...args: any[]) => Promise<any>>(),
  deleteRevision: mock.fn<(...args: any[]) => Promise<any>>()
};
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    useSubmitLock: () => ({
      loading: false,
      guard: (callback: () => void) => callback(),
      run: (callback: () => Promise<void>) => callback()
    })
  }
});
mock.module(new URL('../services/index.ts', import.meta.url).href, {
  namedExports: calls
});
const { default: useModelRevisions } = await import('./use-model-revisions.ts');

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: any) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const page = (revision: number) => ({
  items: [{ revision }],
  pagination: { total: 21, page: 1, perPage: 10, totalPage: 3 }
});
const model = { id: 42, name: 'model', revision_history_limit: 10 };

const revisionDetail = (revision: number) => ({
  revision,
  spec: { env: { CONFIG: String(revision) } }
});

async function harness() {
  for (const call of Object.values(calls)) call.mock.resetCalls();
  calls.getRevision.mock.mockImplementation(async (_, revision) =>
    revisionDetail(revision)
  );
  const dom = new JSDOM('<div id="root"></div>');
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
  });
  calls.getRevisions.mock.mockImplementation(async () => page(21));
  calls.getRevisionModel.mock.mockImplementation(async () => model);
  calls.previewRollback.mock.mockImplementation(async (_, revision) => ({
    target_revision: revision,
    changed: true
  }));
  calls.deleteRevision.mock.mockImplementation(async () => undefined);
  calls.rollbackRevision.mock.mockImplementation(async () => undefined);
  calls.restartModel.mock.mockImplementation(async () => ({ restarted: true }));
  const updated = mock.fn();
  const closed = mock.fn();
  let controller!: ReturnType<typeof useModelRevisions>;
  const root = createRoot(dom.window.document.getElementById('root')!);
  function Harness() {
    controller = useModelRevisions(updated, closed);
    return null;
  }
  await act(async () => root.render(createElement(Harness)));
  return {
    get controller() {
      return controller;
    },
    updated,
    closed,
    async dispose() {
      await act(async () => root.unmount());
      dom.window.close();
    }
  };
}

test('history requests and mutations', async (t) => {
  await t.test(
    'closing history discards an in-flight list response',
    async () => {
      const h = await harness();
      try {
        const pending = deferred<any>();
        calls.getRevisions.mock.mockImplementation(() => pending.promise);
        await act(async () => h.controller.open(model as any));
        await act(async () => h.controller.close());
        await act(async () => pending.resolve(page(21)));
        assert.equal(h.controller.state.model, null);
        assert.deepEqual(h.controller.state.items, []);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'a slower history response cannot replace the selected revision',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        const slow = deferred<any>();
        calls.getRevision.mock.mockImplementation(async (_, revision) =>
          revision === 20 ? slow.promise : revisionDetail(revision)
        );
        await act(async () => h.controller.select(20));
        await act(async () => h.controller.select(19));
        await act(async () => slow.resolve(revisionDetail(20)));
        assert.equal(h.controller.state.selected, 19);
        assert.equal(h.controller.state.comparison?.target.revision, 19);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'paging preserves the latest revision from page one',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        calls.getRevisions.mock.mockImplementation(async () => page(11));
        await act(async () => h.controller.changePage(2));
        assert.equal(h.controller.state.latest, 21);
        assert.equal(h.controller.state.items[0].revision, 11);
        assert.equal(h.controller.state.page, 2);
      } finally {
        await h.dispose();
      }
    }
  );
  for (const failedRequest of ['getRevisions', 'getRevisionModel'] as const) {
    await t.test(
      `failed paging (${failedRequest}) clears stale revisions and allows retry`,
      async () => {
        const h = await harness();
        try {
          await act(async () => h.controller.open(model as any));
          const pending = deferred<any>();
          calls[failedRequest].mock.mockImplementation(() => pending.promise);
          await act(async () => h.controller.changePage(2));
          assert.equal(h.controller.state.page, 2);
          assert.deepEqual(h.controller.state.items, []);
          assert.equal(h.controller.state.comparison, null);
          assert.equal(h.controller.state.loading, true);
          await act(async () =>
            pending.reject({
              response: { data: { message: 'Page unavailable' } }
            })
          );
          assert.equal(h.controller.state.loading, false);
          assert.equal(h.controller.state.error, 'Page unavailable');
          assert.deepEqual(h.controller.state.items, []);
          assert.equal(h.controller.state.selected, null);
          assert.equal(h.controller.state.latest, 21);
          calls.getRevisions.mock.mockImplementation(async () => page(11));
          calls.getRevisionModel.mock.mockImplementation(async () => model);
          await act(async () => h.controller.changePage(2));
          assert.equal(h.controller.state.error, null);
          assert.equal(h.controller.state.items[0].revision, 11);
          assert.equal(h.controller.state.comparison?.target.revision, 11);
        } finally {
          await h.dispose();
        }
      }
    );
  }
  await t.test(
    'delete confirmation waits for the mutation and reports failure',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        const pending = deferred<any>();
        calls.deleteRevision.mock.mockImplementation(() => pending.promise);
        let task: Promise<void> | undefined;
        await act(async () => {
          task = h.controller.mutate('delete', 20);
        });
        assert.ok(task instanceof Promise);
        assert.equal(h.updated.mock.callCount(), 0);
        const error = {
          response: { status: 400, data: { message: 'Deletion failed' } }
        };
        await act(async () => {
          const rejected = assert.rejects(task!, (actual) => actual === error);
          pending.reject(error);
          await rejected;
        });
        assert.equal(h.controller.state.error, 'Deletion failed');
        assert.equal(h.updated.mock.callCount(), 0);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'successful rollback closes history and refreshes the deployment list',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        calls.getRevisions.mock.mockImplementation(async () => page(22));
        await act(async () => {
          await h.controller.mutate('rollback', 19);
        });
        assert.equal(h.updated.mock.callCount(), 1);
        assert.equal(h.controller.state.model, null);
        assert.equal(h.controller.state.comparison, null);
        assert.equal(h.closed.mock.callCount(), 1);
        assert.equal(calls.getRevisions.mock.callCount(), 1);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'a pruned target refreshes history and leaves the server error visible',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        const error = {
          response: { status: 404, data: { message: 'Revision not found' } }
        };
        calls.rollbackRevision.mock.mockImplementation(async () => {
          throw error;
        });
        calls.getRevisions.mock.mockImplementation(async () => page(23));
        await act(async () => {
          await assert.rejects(
            h.controller.mutate('rollback', 19)!,
            (actual) => actual === error
          );
        });
        assert.equal(h.controller.state.latest, 23);
        assert.equal(h.controller.state.error, 'Revision not found');
        assert.equal(h.updated.mock.callCount(), 0);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'selection compares the exact predecessor without requesting a rollback preview',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        assert.equal(h.controller.state.comparison?.target.revision, 21);
        assert.equal(h.controller.state.comparison?.previous?.revision, 20);
        assert.deepEqual(
          calls.getRevision.mock.calls.map((call) => call.arguments),
          [
            [42, 21],
            [42, 20]
          ]
        );
        assert.equal(calls.previewRollback.mock.callCount(), 0);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'the initial revision is a snapshot without a predecessor request',
    async () => {
      const h = await harness();
      try {
        calls.getRevisions.mock.mockImplementation(async () => page(1));
        await act(async () => h.controller.open(model as any));
        assert.equal(h.controller.state.comparison?.previous, null);
        assert.equal(h.controller.state.comparison?.target.revision, 1);
        assert.deepEqual(
          calls.getRevision.mock.calls.map((call) => call.arguments),
          [[42, 1]]
        );
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'a missing predecessor keeps the target snapshot without substituting an older version',
    async () => {
      const h = await harness();
      try {
        calls.getRevision.mock.mockImplementation(async (_, revision) => {
          if (revision === 20) throw { response: { status: 404 } };
          return revisionDetail(revision);
        });
        await act(async () => h.controller.open(model as any));
        assert.equal(h.controller.state.comparison?.target.revision, 21);
        assert.equal(h.controller.state.comparison?.previous, null);
        assert.equal(h.controller.state.error, null);
        assert.deepEqual(
          calls.getRevision.mock.calls.map((call) => call.arguments[1]),
          [21, 20]
        );
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'a predecessor server failure is not reported as a missing revision',
    async () => {
      const h = await harness();
      try {
        calls.getRevision.mock.mockImplementation(async (_, revision) => {
          if (revision === 20)
            throw {
              response: {
                status: 500,
                data: { message: 'Cannot read history' }
              }
            };
          return revisionDetail(revision);
        });
        await act(async () => h.controller.open(model as any));
        assert.equal(h.controller.state.comparison, null);
        assert.equal(h.controller.state.error, 'Cannot read history');
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'a missing target is an error instead of a snapshot',
    async () => {
      const h = await harness();
      try {
        calls.getRevision.mock.mockImplementation(async (_, revision) => {
          if (revision === 21)
            throw {
              response: { status: 404, data: { message: 'Target not found' } }
            };
          return revisionDetail(revision);
        });
        await act(async () => h.controller.open(model as any));
        assert.equal(h.controller.state.comparison, null);
        assert.equal(h.controller.state.error, 'Target not found');
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'rollback review reads live configuration separately and waits for confirmation',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        await act(async () => h.controller.select(19));
        calls.previewRollback.mock.mockImplementation(async (_, revision) => ({
          target_revision: revision,
          current: { env: { CONFIG: 'live' } },
          desired: revisionDetail(revision).spec,
          changed: true
        }));
        await act(async () => {
          await h.controller.reviewRollback(19);
        });
        assert.equal(h.controller.state.comparison?.previous?.revision, 18);
        assert.deepEqual(h.controller.state.rollback?.preview?.current, {
          env: { CONFIG: 'live' }
        });
        assert.equal(h.controller.state.rollback?.revision, 19);
        assert.equal(calls.rollbackRevision.mock.callCount(), 0);
        await act(async () => {
          await h.controller.confirmRollback();
        });
        assert.deepEqual(
          calls.rollbackRevision.mock.calls[0].arguments,
          [42, 19]
        );
        assert.equal(h.controller.state.rollback, null);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test('an unchanged rollback cannot be submitted', async () => {
    const h = await harness();
    try {
      await act(async () => h.controller.open(model as any));
      calls.previewRollback.mock.mockImplementation(async (_, revision) => ({
        target_revision: revision,
        changed: false
      }));
      await act(async () => {
        await h.controller.reviewRollback(20);
      });
      await act(async () => {
        await h.controller.confirmRollback();
      });
      assert.equal(calls.rollbackRevision.mock.callCount(), 0);
    } finally {
      await h.dispose();
    }
  });
  await t.test(
    'cancelling a pending rollback preview ignores its eventual response',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        const pending = deferred<any>();
        calls.previewRollback.mock.mockImplementation(() => pending.promise);
        await act(async () => {
          void h.controller.reviewRollback(20);
        });
        await act(async () => {
          await h.controller.confirmRollback();
        });
        assert.equal(calls.rollbackRevision.mock.callCount(), 0);
        await act(async () => h.controller.cancelRollback());
        await act(async () =>
          pending.resolve({ target_revision: 20, changed: true })
        );
        assert.equal(h.controller.state.rollback, null);
        assert.equal(h.controller.state.comparison?.target.revision, 21);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'failed rollback preview cannot enable confirmation',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        calls.previewRollback.mock.mockImplementation(async () => {
          throw { response: { data: { message: 'Preview failed' } } };
        });
        await act(async () => {
          await h.controller.reviewRollback(20);
        });
        assert.equal(h.controller.state.rollback?.error, 'Preview failed');
        await act(async () => {
          await h.controller.confirmRollback();
        });
        assert.equal(calls.rollbackRevision.mock.callCount(), 0);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'rollback validation errors remain in the inline preview',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        await act(async () => {
          await h.controller.reviewRollback(20);
        });
        calls.rollbackRevision.mock.mockImplementation(async () => {
          throw {
            response: { status: 400, data: { message: 'Invalid backend' } }
          };
        });
        await act(async () => {
          await assert.rejects(h.controller.confirmRollback()!);
        });
        assert.equal(h.controller.state.rollback?.error, 'Invalid backend');
        assert.equal(h.controller.state.error, null);
        assert.equal(h.updated.mock.callCount(), 0);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test('latest revision has no rollback preview action', async () => {
    const h = await harness();
    try {
      await act(async () => h.controller.open(model as any));
      await act(async () => {
        await h.controller.reviewRollback(21);
      });
      assert.equal(h.controller.state.rollback, null);
      assert.equal(calls.previewRollback.mock.callCount(), 0);
      assert.equal(calls.rollbackRevision.mock.callCount(), 0);
    } finally {
      await h.dispose();
    }
  });
  await t.test(
    'a row action previews that row and back restores the browsing selection and page',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        calls.getRevisions.mock.mockImplementation(async () => page(11));
        await act(async () => h.controller.changePage(2));
        const comparison = h.controller.state.comparison;
        const reads = calls.getRevision.mock.callCount();
        await act(async () => {
          await h.controller.reviewRollback(10);
        });
        assert.equal(h.controller.state.rollback?.revision, 10);
        assert.deepEqual(
          calls.previewRollback.mock.calls[0].arguments,
          [42, 10]
        );
        await act(async () => h.controller.cancelRollback());
        assert.equal(h.controller.state.rollback, null);
        assert.equal(h.controller.state.selected, 11);
        assert.equal(h.controller.state.page, 2);
        assert.equal(h.controller.state.comparison, comparison);
        assert.equal(calls.getRevision.mock.callCount(), reads);
        assert.equal(calls.rollbackRevision.mock.callCount(), 0);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'closing the drawer discards a pending inline rollback preview',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        const pending = deferred<any>();
        calls.previewRollback.mock.mockImplementation(() => pending.promise);
        await act(async () => {
          void h.controller.reviewRollback(20);
        });
        await act(async () => h.controller.close());
        await act(async () =>
          pending.resolve({ target_revision: 20, changed: true })
        );
        assert.equal(h.controller.state.model, null);
        assert.equal(h.controller.state.rollback, null);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'rollback restarts by default only after configuration is saved',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        await act(async () => {
          await h.controller.reviewRollback(20);
        });
        assert.equal(h.controller.state.rollback?.restartOnRollback, true);
        const saved = deferred<any>();
        calls.rollbackRevision.mock.mockImplementation(() => saved.promise);
        let submit: Promise<void> | undefined;
        await act(async () => {
          submit = h.controller.confirmRollback();
        });
        assert.equal(calls.restartModel.mock.callCount(), 0);
        await act(async () => {
          saved.resolve(model);
          await submit;
        });
        assert.deepEqual(calls.restartModel.mock.calls[0].arguments, [42]);
        assert.equal(h.controller.state.rollback, null);
        assert.equal(h.controller.state.restartError, null);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'opting out saves without restart and a new review defaults to restart',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        await act(async () => {
          await h.controller.reviewRollback(20);
        });
        await act(async () => h.controller.setRestartOnRollback(false));
        await act(async () => {
          await h.controller.confirmRollback();
        });
        assert.equal(calls.rollbackRevision.mock.callCount(), 1);
        assert.equal(calls.restartModel.mock.callCount(), 0);
        assert.equal(h.controller.state.model, null);
        assert.equal(h.closed.mock.callCount(), 1);
        await act(async () => h.controller.open(model as any));
        await act(async () => {
          await h.controller.reviewRollback(19);
        });
        assert.equal(h.controller.state.rollback?.restartOnRollback, true);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'a rejected rollback never restarts the deployment',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        await act(async () => {
          await h.controller.reviewRollback(20);
        });
        calls.rollbackRevision.mock.mockImplementation(async () => {
          throw {
            response: {
              status: 400,
              data: { message: 'Invalid configuration' }
            }
          };
        });
        await act(async () => {
          await assert.rejects(h.controller.confirmRollback()!);
        });
        assert.equal(calls.restartModel.mock.callCount(), 0);
        assert.equal(
          h.controller.state.rollback?.error,
          'Invalid configuration'
        );
        assert.equal(h.controller.state.model?.id, model.id);
        assert.equal(h.closed.mock.callCount(), 0);
      } finally {
        await h.dispose();
      }
    }
  );
  for (const status of [500, 409]) {
    await t.test(
      `restart failure (${status}) keeps the saved revision and retries only restart`,
      async () => {
        const h = await harness();
        try {
          await act(async () => h.controller.open(model as any));
          await act(async () => {
            await h.controller.reviewRollback(20);
          });
          calls.getRevisions.mock.mockImplementation(async () => page(22));
          calls.restartModel.mock.mockImplementation(async () => {
            throw {
              response: { status, data: { message: 'Restart unavailable' } }
            };
          });
          await act(async () => {
            await h.controller.confirmRollback();
          });
          assert.equal(h.controller.state.rollback, null);
          assert.equal(h.controller.state.latest, 22);
          assert.equal(h.controller.state.restartError, 'Restart unavailable');
          assert.equal(h.controller.state.model?.id, model.id);
          assert.equal(h.closed.mock.callCount(), 0);
          assert.equal(h.controller.state.error, null);
          assert.equal(h.updated.mock.callCount(), 1);
          await act(async () => {
            await h.controller.retryRestart();
          });
          assert.equal(h.controller.state.restartError, 'Restart unavailable');
          assert.equal(h.controller.state.model?.id, model.id);
          assert.equal(h.closed.mock.callCount(), 0);
          calls.restartModel.mock.mockImplementation(async () => ({
            restarted: true
          }));
          await act(async () => {
            await h.controller.retryRestart();
          });
          assert.equal(h.controller.state.restartError, null);
          assert.equal(h.controller.state.model, null);
          assert.equal(h.closed.mock.callCount(), 1);
          assert.equal(calls.restartModel.mock.callCount(), 3);
          assert.equal(calls.rollbackRevision.mock.callCount(), 1);
        } finally {
          await h.dispose();
        }
      }
    );
  }
  await t.test(
    'a deployment without instances completes rollback without a restart error',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        await act(async () => {
          await h.controller.reviewRollback(20);
        });
        calls.restartModel.mock.mockImplementation(async () => ({
          restarted: false,
          deleted_instances: 0
        }));
        await act(async () => {
          await h.controller.confirmRollback();
        });
        assert.equal(h.controller.state.restartError, null);
        assert.equal(h.controller.state.rollback, null);
        assert.equal(h.controller.state.model, null);
        assert.equal(h.closed.mock.callCount(), 1);
        assert.equal(h.updated.mock.callCount(), 1);
      } finally {
        await h.dispose();
      }
    }
  );
  await t.test(
    'history stays open until the requested restart completes',
    async () => {
      const h = await harness();
      try {
        await act(async () => h.controller.open(model as any));
        await act(async () => {
          await h.controller.reviewRollback(20);
        });
        const restarting = deferred<any>();
        calls.restartModel.mock.mockImplementation(() => restarting.promise);
        let submit: Promise<void> | undefined;
        await act(async () => {
          submit = h.controller.confirmRollback();
        });
        assert.equal(h.controller.state.model?.id, model.id);
        assert.equal(h.closed.mock.callCount(), 0);
        await act(async () => {
          restarting.resolve({ restarted: true });
          await submit;
        });
        assert.equal(h.controller.state.model, null);
        assert.equal(h.closed.mock.callCount(), 1);
        assert.equal(h.updated.mock.callCount(), 1);
        assert.equal(calls.getRevisions.mock.callCount(), 1);
      } finally {
        await h.dispose();
      }
    }
  );
});
