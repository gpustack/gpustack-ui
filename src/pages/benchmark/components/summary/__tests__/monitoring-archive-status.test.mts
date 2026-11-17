import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import messages from '../../../../../locales/en-US/benchmark';

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
});
after(() => dom.window.close());
const translations = (messages as any).default ?? messages;
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: Record<string, unknown> = {}) =>
        String(translations[id] || id).replace(
          /\{(\w+)\}/g,
          (placeholder, key) => String(values[key] ?? placeholder)
        )
    })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    StatusDot: ({ statusValue }: any) =>
      createElement(
        'span',
        { 'data-status': statusValue.status },
        statusValue.text
      )
  }
});
const element = ({ children }: any) => createElement('span', null, children);
let tooltipTitle: any;
const tooltipText = (value: any): string =>
  Array.isArray(value)
    ? value.map(tooltipText).join(' ')
    : typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : tooltipText(value?.props?.children || []);
mock.module('antd', {
  namedExports: {
    Flex: element,
    Tooltip: ({ children, title }: any) => {
      tooltipTitle = title;
      return element({ children });
    },
    Typography: { Text: element },
    Button: ({ children, onClick, loading, disabled }: any) =>
      createElement(
        'button',
        {
          onClick,
          disabled: loading || disabled
        },
        children
      )
  }
});
let calls = 0;
let failure = 0;
let complete!: (value: any) => void;
const statusCalls: { run: string; signal: AbortSignal }[] = [];
let statusResponse: (run: string) => Promise<any> = async (run) => ({
  run_id: run,
  state: 'ready',
  retryable: false,
  content_version: 'saved-3'
});
mock.module(new URL('../../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryBenchmarkMonitoringArchive: async (
      _id: number,
      params: any,
      signal: AbortSignal
    ) => {
      statusCalls.push({ run: params.run_id, signal });
      return statusResponse(params.run_id);
    },
    retryBenchmarkMonitoringArchive: async (id: number, run: string) => {
      assert.equal(id, 9);
      assert.equal(run, 'saved-run');
      calls++;
      if (failure) throw { response: { status: failure } };
      return new Promise((resolve) => {
        complete = resolve;
      });
    }
  }
});
const { default: MonitoringArchiveStatus } =
  await import('../monitoring-archive-status');
const context = {
  observation_storage: {
    source: 'live',
    run_id: 'saved-run',
    archive_state: 'failed',
    retryable: true,
    capture_complete: false
  }
} as any;
const text = () => document.body.textContent || '';

test('capacity exhaustion keeps saved monitoring and polls light status until automatic recovery', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  statusCalls.length = 0;
  statusResponse = async (run) => ({
    run_id: run,
    state: 'failed',
    content_version: 'saved-2',
    last_error: 'storage_capacity_exceeded'
  });
  let refreshes = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: {
            ...context.observation_storage,
            source: 'archive',
            content_version: 'saved-2',
            last_error: 'storage_capacity_exceeded'
          }
        } as any,
        onRefresh: async () => {
          refreshes++;
        }
      })
    )
  );
  assert.match(text(), /storage capacity reached/);
  assert.equal(document.querySelector('button'), null);
  await act(async () => t.mock.timers.tick(14999));
  assert.equal(statusCalls.length, 0);
  await act(async () => t.mock.timers.tick(1));
  assert.equal(statusCalls.length, 1);
  assert.equal(refreshes, 0, 'unchanged capacity wait never reloads curves');
  statusResponse = async (run) => ({
    run_id: run,
    state: 'ready',
    retryable: false,
    content_version: 'saved-3',
    last_error: null
  });
  await act(async () => t.mock.timers.tick(15000));
  assert.equal(refreshes, 1);
  assert.equal(text(), 'Saved monitoring');
  await act(async () => t.mock.timers.tick(60000));
  assert.equal(statusCalls.length, 2);
  await act(async () => root.unmount());
});

test('pending archive completion refreshes once without a Benchmark watch event and stops light polling', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  statusCalls.length = 0;
  let refreshes = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: {
            ...context.observation_storage,
            source: 'archive',
            archive_state: 'capturing',
            content_version: 'saved-2'
          }
        } as any,
        onRefresh: async () => {
          refreshes++;
        }
      })
    )
  );
  assert.equal(text(), 'Archiving');
  await act(async () => t.mock.timers.tick(3000));
  assert.equal(statusCalls.length, 1);
  assert.equal(refreshes, 1);
  assert.equal(text(), 'Saved monitoring');
  await act(async () => t.mock.timers.tick(12000));
  assert.equal(statusCalls.length, 1, 'terminal archive state stops polling');
  await act(async () => root.unmount());
});

test('a pending status response from an old run is aborted and ignored on run switch', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  statusCalls.length = 0;
  let resolve!: (value: any) => void;
  statusResponse = () =>
    new Promise((done) => {
      resolve = done;
    });
  let refreshes = 0;
  const root = createRoot(document.getElementById('root')!);
  const render = (run: string) =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: {
            ...context.observation_storage,
            run_id: run,
            archive_state: 'capturing',
            content_version: 'saved-2'
          }
        } as any,
        onRefresh: async () => {
          refreshes++;
        }
      })
    );
  await act(async () => render('old-run'));
  await act(async () => t.mock.timers.tick(3000));
  await act(async () => render('new-run'));
  assert.equal(statusCalls[0].signal.aborted, true);
  await act(async () =>
    resolve({ run_id: 'old-run', state: 'ready', content_version: 'saved-3' })
  );
  assert.equal(refreshes, 0);
  assert.equal(text(), 'Archiving');
  await act(async () => root.unmount());
  statusResponse = async (run) => ({
    run_id: run,
    state: 'ready',
    retryable: false,
    content_version: 'saved-3'
  });
});

test('hidden tabs pause pending status polling and resume without polling curves', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const visibility = Object.getOwnPropertyDescriptor(
    document,
    'visibilityState'
  );
  Object.defineProperty(document, 'visibilityState', {
    value: 'hidden',
    configurable: true
  });
  statusCalls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: {
            ...context.observation_storage,
            archive_state: 'capturing',
            content_version: 'saved-2'
          }
        } as any,
        onRefresh: async () => {}
      })
    )
  );
  await act(async () => t.mock.timers.tick(9000));
  assert.equal(statusCalls.length, 0);
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    configurable: true
  });
  await act(async () =>
    document.dispatchEvent(new dom.window.Event('visibilitychange'))
  );
  await act(async () => t.mock.timers.tick(3000));
  assert.equal(statusCalls.length, 1);
  await act(async () => root.unmount());
  if (visibility)
    Object.defineProperty(document, 'visibilityState', visibility);
  else Reflect.deleteProperty(document, 'visibilityState');
});

for (const status of [401, 403, 404]) {
  test(`pending status HTTP ${status} performs one authoritative context refresh and stops`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    statusCalls.length = 0;
    statusResponse = async () => {
      throw { response: { status } };
    };
    let refreshes = 0;
    const root = createRoot(document.getElementById('root')!);
    await act(async () =>
      root.render(
        createElement(MonitoringArchiveStatus, {
          id: 9,
          context: {
            observation_storage: {
              ...context.observation_storage,
              archive_state: 'capturing',
              content_version: 'saved-2'
            }
          } as any,
          onRefresh: async () => {
            refreshes++;
          }
        })
      )
    );
    await act(async () => t.mock.timers.tick(3000));
    await act(async () => t.mock.timers.tick(15000));
    assert.equal(statusCalls.length, 1);
    assert.equal(refreshes, 1);
    await act(async () => root.unmount());
    statusResponse = async (run) => ({
      run_id: run,
      state: 'ready',
      retryable: false,
      content_version: 'saved-3'
    });
  });
}

test('a temporary status failure retains the current archive and retries only light status', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  statusCalls.length = 0;
  statusResponse = async () => {
    throw { response: { status: 503 } };
  };
  let refreshes = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: {
            ...context.observation_storage,
            archive_state: 'capturing',
            content_version: 'saved-2'
          }
        } as any,
        onRefresh: async () => {
          refreshes++;
        }
      })
    )
  );
  await act(async () => t.mock.timers.tick(3000));
  assert.equal(text(), 'Archiving');
  assert.equal(refreshes, 0);
  statusResponse = async (run) => ({
    run_id: run,
    state: 'ready',
    retryable: false,
    content_version: 'saved-3'
  });
  await act(async () => t.mock.timers.tick(3000));
  assert.equal(statusCalls.length, 2);
  assert.equal(refreshes, 1);
  await act(async () => root.unmount());
});

test('live DTO defaults are not presented as an archived source sampling gap', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: {
            ...context.observation_storage,
            source: 'live',
            archive_state: 'ready',
            retryable: false,
            data_coverage: 'partial'
          }
        } as any,
        onRefresh: async () => {}
      })
    )
  );
  assert.equal(text(), 'Saved monitoring');
  assert.equal(document.querySelector('button'), null);
  await act(async () => root.unmount());
});

test('a complete archive with incomplete original samples names the sampling gap without offering archive retry', async () => {
  const previousCalls = calls;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: {
            ...context.observation_storage,
            source: 'archive',
            archive_state: 'ready',
            retryable: false,
            capture_complete: true,
            data_coverage: 'partial'
          }
        } as any,
        onRefresh: async () => {}
      })
    )
  );
  assert.equal(text(), 'Saved monitoring · some source samples missing');
  assert.equal(
    document.querySelector('[data-status]')?.getAttribute('data-status'),
    'success'
  );
  assert.equal(document.querySelector('button'), null);
  assert.equal(calls, previousCalls);
  assert.match(tooltipText(tooltipTitle), /Archiving is complete/);
  assert.match(tooltipText(tooltipTitle), /not raw scrapes/);
  await act(async () => root.unmount());
});

test('sampling help reports only loaded query-point coverage and known rolling-window limits', async () => {
  const root = createRoot(document.getElementById('root')!);
  const storage = {
    ...context.observation_storage,
    source: 'archive',
    content_version: 'saved-3',
    archive_state: 'ready',
    retryable: false,
    capture_complete: true,
    data_coverage: 'partial'
  };
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: storage,
          stages: [{ id: 'phase', start: 100, end: 130 }]
        } as any,
        samplingData: {
          window: { start: 100, end: 440 },
          runtime: {
            start: 100,
            end: 440,
            observation_storage: storage,
            rate_window_seconds: 75,
            metrics: {
              running: { kind: 'gauge', status: 'available' },
              ttft: { kind: 'histogram', status: 'available' }
            },
            sample_statistics: {
              running: [{ observed_samples: 339, expected_samples: 340 }]
            }
          }
        } as any,
        onRefresh: async () => {}
      })
    )
  );
  assert.match(tooltipText(tooltipTitle), /339\/340 \(99\.7%\)/);
  assert.match(tooltipText(tooltipTitle), /1\/1 recorded phases.*75s/);
  assert.equal(
    document.querySelector('[data-status]')?.getAttribute('data-status'),
    'success'
  );
  assert.equal(document.querySelector('button'), null);
  await act(async () => root.unmount());
});

test('a partial archive retains its archive warning and retry action', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: {
            ...context.observation_storage,
            source: 'archive',
            archive_state: 'partial',
            capture_complete: true,
            data_coverage: 'partial'
          }
        } as any,
        onRefresh: async () => {}
      })
    )
  );
  assert.match(text(), /Partial archive/);
  assert.equal(document.querySelector('button')?.textContent, 'Retry archive');
  await act(async () => root.unmount());
});

test('archive status retry is compact, coalesces clicks and shows pending without losing the current scope', async () => {
  calls = 0;
  let refreshes = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context,
        onRefresh: async () => {
          refreshes++;
        }
      })
    )
  );
  assert.match(text(), /Archive failed/);
  assert.equal(document.querySelector('[role="alert"]'), null);
  await act(async () => {
    const button = document.querySelector('button')!;
    button.click();
    button.click();
  });
  assert.equal(calls, 1);
  await act(async () =>
    complete({ state: 'pending', run_id: 'saved-run', content_version: null })
  );
  assert.match(text(), /Archive pending/);
  assert.equal(refreshes, 1);
  assert.equal(document.querySelector('button'), null);
  await act(async () => root.unmount());
});

test('archive permission failures retain observations and show a distinct failure with an actionable retry', async () => {
  failure = 403;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context,
        onRefresh: async () => {}
      })
    )
  );
  await act(async () => document.querySelector('button')!.click());
  assert.match(text(), /permission/i);
  assert.equal(
    document.querySelector('button'),
    null,
    'a denied action is not offered repeatedly'
  );
  await act(async () => root.unmount());
  failure = 0;
});

test('a saved monitoring read failure retries reading without starting a new archive capture', async () => {
  let reads = 0;
  const previousCalls = calls;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: {
            ...context.observation_storage,
            source: 'archive',
            archive_state: 'ready',
            retryable: false
          }
        } as any,
        errors: { resources: { response: { status: 503 } } },
        onRefresh: async () => {
          reads++;
        }
      })
    )
  );
  assert.match(text(), /Archive unavailable/);
  await act(async () => document.querySelector('button')!.click());
  assert.equal(reads, 1);
  assert.equal(calls, previousCalls);
  await act(async () => root.unmount());
});

test('a retry response from a previous run cannot refresh the replacement run', async () => {
  let refreshes = 0;
  const root = createRoot(document.getElementById('root')!);
  const render = (run: string) =>
    root.render(
      createElement(MonitoringArchiveStatus, {
        id: 9,
        context: {
          observation_storage: { ...context.observation_storage, run_id: run }
        } as any,
        onRefresh: async () => {
          refreshes++;
        }
      })
    );
  await act(async () => render('saved-run'));
  await act(async () => document.querySelector('button')!.click());
  await act(async () => render('new-run'));
  await act(async () =>
    complete({
      state: 'capturing',
      run_id: 'saved-run',
      content_version: 'saved-2'
    })
  );
  assert.equal(refreshes, 0);
  assert.match(text(), /Archive failed/);
  await act(async () => root.unmount());
});
test('archive tooltip shows authorized compressed size and omits restricted or missing sizes', async () => {
  const root = createRoot(document.getElementById('root')!);
  const render = (
    source: string,
    archive_state: string,
    compressed_bytes: number | null,
    resource_status?: string
  ) =>
    act(async () =>
      root.render(
        createElement(MonitoringArchiveStatus, {
          id: 9,
          context: {
            resource_status,
            observation_storage: {
              ...context.observation_storage,
              source,
              archive_state,
              compressed_bytes,
              retryable: false
            }
          } as any,
          onRefresh: async () => {}
        })
      )
    );
  await render('archive', 'ready', 146124);
  assert.match(tooltipText(tooltipTitle), /Monitoring archive size: 142.7 KiB/);
  await render('archive', 'ready', 146124, 'restricted');
  assert.doesNotMatch(tooltipText(tooltipTitle), /142.7 KiB/);
  await render('live', 'capturing', 1024);
  assert.match(tooltipText(tooltipTitle), /Saved so far: 1 KiB/);
  await render('live', 'not_archived', null);
  assert.doesNotMatch(
    tooltipText(tooltipTitle),
    /Monitoring archive size|Saved so far/
  );
  assert.equal(document.querySelector('button'), null);
  await act(async () => root.unmount());
});

test('live checkpoints update size from light status without reloading curves', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const priorResponse = statusResponse;
  statusResponse = async (run) => ({
    run_id: run,
    state: 'capturing',
    content_version: '2',
    compressed_bytes: 2048
  });
  let refreshes = 0;
  const root = createRoot(document.getElementById('root')!);
  const render = (bytes: number) =>
    act(async () =>
      root.render(
        createElement(MonitoringArchiveStatus, {
          id: 9,
          context: {
            observation_storage: {
              ...context.observation_storage,
              archive_state: 'capturing',
              compressed_bytes: bytes
            }
          } as any,
          onRefresh: async () => {
            refreshes++;
          }
        })
      )
    );
  try {
    await render(1024);
    assert.match(tooltipText(tooltipTitle), /Saved so far: 1 KiB/);
    await act(async () => t.mock.timers.tick(3000));
    assert.match(tooltipText(tooltipTitle), /Saved so far: 2 KiB/);
    assert.equal(refreshes, 0);
    await render(3072);
    assert.match(tooltipText(tooltipTitle), /Saved so far: 3 KiB/);
  } finally {
    statusResponse = priorResponse;
    await act(async () => root.unmount());
  }
});

for (const timing of [
  'on mount',
  'before the first live poll',
  'after a completed live poll',
  'while a live poll is pending'
] as const) {
  test(`a capturing archive refreshes when its content changes (${timing})`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    statusCalls.length = 0;
    const priorResponse = statusResponse;
    let version = 'saved-1';
    const capturingStatus = async (run: string) => ({
      run_id: run,
      state: 'capturing',
      content_version: version
    });
    statusResponse = capturingStatus;
    let refreshes = 0;
    const root = createRoot(document.getElementById('root')!);
    const render = (source: 'live' | 'archive', contentVersion?: string) =>
      act(async () =>
        root.render(
          createElement(MonitoringArchiveStatus, {
            id: 9,
            context: {
              observation_storage: {
                ...context.observation_storage,
                source,
                archive_state: 'capturing',
                content_version: contentVersion
              }
            } as any,
            onRefresh: async () => {
              refreshes++;
            }
          })
        )
      );
    try {
      if (timing !== 'on mount') await render('live');
      if (timing === 'after a completed live poll') {
        await act(async () => t.mock.timers.tick(3000));
        assert.equal(statusCalls.length, 1);
        assert.equal(refreshes, 0);
      }
      if (timing === 'while a live poll is pending') {
        let resolveLivePoll!: (value: {
          run_id: string;
          state: string;
          content_version: string;
        }) => void;
        statusResponse = () =>
          new Promise((resolve) => (resolveLivePoll = resolve));
        await act(async () => t.mock.timers.tick(3000));
        assert.equal(statusCalls.length, 1);
        await render('archive', 'saved-2');
        const livePollAborted = statusCalls[0].signal.aborted;
        await act(async () =>
          resolveLivePoll({
            run_id: 'saved-run',
            state: 'ready',
            content_version: 'saved-1'
          })
        );
        assert.equal(livePollAborted, true);
        assert.equal(refreshes, 0);
        assert.equal(text(), 'Archiving');
        statusResponse = capturingStatus;
      } else {
        await render('archive', 'saved-2');
      }
      version = 'saved-2';
      await act(async () => t.mock.timers.tick(3000));
      assert.equal(
        refreshes,
        0,
        'the loaded version is the comparison baseline'
      );
      version = 'saved-3';
      await act(async () => t.mock.timers.tick(3000));
      assert.equal(refreshes, 1, 'a newer saved version refreshes curves');
      await act(async () => t.mock.timers.tick(3000));
      assert.equal(
        refreshes,
        1,
        'repeated status for one version refreshes once'
      );
    } finally {
      statusResponse = priorResponse;
      await act(async () => root.unmount());
    }
  });
}
