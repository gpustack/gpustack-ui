import { atom, getDefaultStore } from 'jotai';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ModelInstanceListItem } from '../../../config/types';
const { workloadInfo, workloadInfoEntries, groupWorkloadInfoEntries } =
  await import('../workload-info.ts');

const monitoringConfig = atom({
  showMonitoring: true,
  grafana_url: 'https://configured.invalid'
});
mock.module('jotai', {
  namedExports: { useAtomValue: () => getDefaultStore().get(monitoringConfig) }
});
const monitorButtons: any[] = [];
const monitorMenus: any[] = [];
const copiedDetails: string[] = [];
const infoGroups: any[] = [];
const tooltips: any[] = [];
const opened: Array<[string, string]> = [];
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { open: (url: string, target: string) => opened.push([url, target]) }
});
afterEach(() => {
  monitorButtons.length =
    monitorMenus.length =
    copiedDetails.length =
    opened.length =
      0;
  getDefaultStore().set(monitoringConfig, {
    showMonitoring: true,
    grafana_url: 'https://configured.invalid'
  });
});

const pass = ({ children }: any) => createElement(Fragment, null, children);
const empty = () => null;
const grid = Object.assign(pass, { Cell: pass });
let displayedStatus: any;
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: pass,
    IconFont: empty,
    GrafanaIcon: empty,
    DropdownActions: ({ children, menu }: any) => {
      monitorMenus.push(menu);
      return children;
    },
    TextAttribute: pass,
    StatusDot: ({ statusValue }: any) =>
      createElement(
        'span',
        { 'data-status': statusValue.status },
        statusValue.text
      ),
    ExpandedRowGrid: grid,
    StatusTag: ({ statusValue }: any) => {
      displayedStatus = statusValue;
      return null;
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any = {}) =>
        `${id} ${Object.values(values).join(' ')}`.trim()
    })
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({ styles: { content: 'workload-content' } })
  }
});
mock.module('antd', {
  namedExports: {
    Button: (props: any) => {
      monitorButtons.push(props);
      return createElement(
        'button',
        { title: props.title, 'aria-label': props['aria-label'] },
        props.children
      );
    },
    Flex: ({ children, className }: any) =>
      createElement('div', { className }, children),
    Tooltip: (props: any) => {
      tooltips.push(props);
      return createElement(Fragment, null, props.title, props.children);
    },
    Typography: {
      Text: ({ children, copyable }: any) => {
        if (copyable?.text) copiedDetails.push(copyable.text);
        return createElement(Fragment, null, children);
      }
    }
  }
});
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: { StatusMaps: { warning: 'warning' } }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    CACHE_METRICS_WINDOW: { labelKey: 'window' },
    isPDModel: () => false,
    InstanceDrainingLabel: 'Draining',
    InstanceStatusMap: {
      Running: 'running',
      Error: 'error',
      Starting: 'starting',
      Downloading: 'downloading'
    },
    InstanceStatusMapValue: {
      running: 'Running',
      error: 'Error',
      starting: 'Starting'
    },
    status: { running: 'success', error: 'error', starting: 'transitioning' }
  }
});
const { default: InstanceStatusTag } =
  await import('../instance-status-cell.tsx');

const mockLocal = (relative: string, exports: any) =>
  mock.module(new URL(relative, import.meta.url).href, exports);
mockLocal('../../../style/instance-item.less', { defaultExport: '' });
mockLocal('../../../../../config/settings.ts', {
  namedExports: { tableSorter: () => undefined, GPUSTACK_API_BASE_URL: 'v2' }
});
mockLocal('../../../../../atoms/system.ts', {
  namedExports: { systemConfigAtom: monitoringConfig }
});
mockLocal('../../../../../plugins/list-extra-columns.ts', {
  namedExports: { usePluginListColumns: () => [] }
});
mockLocal('../../../../../utils/index.ts', {
  namedExports: { convertFileSize: () => '0 GiB' }
});
mockLocal('../../../utils/index.ts', {
  namedExports: { calcTotalVram: () => 0 }
});
mockLocal('../../../utils/instance-recreation.ts', {
  namedExports: { configurationChangeMessage: () => '' }
});
mockLocal('../../../hooks/use-gpu-type-display-name.ts', {
  namedExports: { useGPUTypeDisplayName: () => '' }
});
mockLocal('../vgpu-info.ts', {
  namedExports: {
    formatGPUTypeAllocation: () => '',
    getGPUTypeSelector: () => undefined,
    getGPUTypeClusterId: () => undefined
  }
});
mockLocal('../../pd/role-status.ts', { namedExports: { roleLabel: () => '' } });
mockLocal('../../../../_components/grouped-info-tooltip-content.tsx', {
  defaultExport: ({ groups }: any) => {
    infoGroups.push(groups);
    return createElement(
      Fragment,
      null,
      ...groups
        .flat()
        .map(({ value }: any, index: number) =>
          createElement('div', { key: index }, value)
        )
    );
  }
});
for (const filename of [
  'actions-cell',
  'cpu-offloading-cell',
  'distribute-info-cell',
  'downloading-status-cell',
  'kv-cache-degraded-cell'
]) {
  mockLocal(`../${filename}.tsx`, { defaultExport: empty });
}
const { default: InstanceItem } =
  await import('../../instance/instance-item.tsx');
const { default: useInstanceColumns } =
  await import('../../../instance-view/use-instance-columns.tsx');
const { default: useGranfanaLink } =
  await import('../../../../resources/hooks/use-grafana-link.tsx');

const record = (distributed_servers?: any) =>
  ({
    id: 42,
    restart_count: 3,
    worker_id: 1,
    worker_name: 'alpha',
    worker_ip: '10.0.0.1',
    port: 8000,
    distributed_servers
  }) as ModelInstanceListItem;

test('legacy and an empty managed manifest keep distinct API semantics', () => {
  assert.equal(workloadInfo(record()), null);
  assert.equal(workloadInfo(record({ workloads: null })), null);
  assert.deepEqual(workloadInfo(record({ workloads: [] })), []);
});

test('rank details map workers, main APIs and headless placements without port fallback', () => {
  const details = workloadInfo(
    record({
      workloads: [
        {
          name: 'group',
          worker_id: 1,
          state: 'running',
          dp_rank_placements: [
            {
              dp_rank: 0,
              node_rank: 0,
              gpu_indexes: [1, 0],
              api_port: 9000,
              ready: false
            },
            { dp_rank: 1, node_rank: 1, gpu_indexes: [2] }
          ]
        }
      ]
    })
  )!;
  assert.match(details[0], /alpha.*10.0.0.1:9000.*main.*ready=false/);
  assert.match(details[1], /headless/);
  assert.doesNotMatch(details[1], /8000|9000|ready=/);
});

test('peer main APIs use the recorded worker address without a worker list', () => {
  const details = workloadInfo(
    record({
      subordinate_workers: [{ worker_id: 2, worker_ip: '10.0.0.2' }],
      workloads: [
        {
          name: 'peer',
          worker_id: 2,
          state: 'running',
          dp_rank_placements: [
            {
              dp_rank: 1,
              node_rank: 0,
              gpu_indexes: [0],
              api_port: 9001,
              ready: true
            }
          ]
        }
      ]
    })
  )!;
  assert.match(details[0], /Worker 2.*API 10.0.0.2:9001/);
  assert.doesNotMatch(details[0], /10.0.0.1|8000/);
});

for (const [managed, state, expected] of [
  [false, 'error', 'Error'],
  [true, 'error', 'Error'],
  [false, 'starting', 'Starting'],
  [true, 'starting', 'Draining'],
  [false, 'running', 'Draining'],
  [true, 'running', 'Draining']
] as const) {
  test(`${managed ? 'managed' : 'legacy'} ${state} retains its diagnostic state while stopping`, () => {
    const instance = {
      ...record(managed ? { workloads: [] } : undefined),
      state,
      draining_since: '2026-10-28T00:00:00Z',
      state_message: 'engine startup failed'
    };
    renderToStaticMarkup(
      createElement(InstanceStatusTag, { record: instance, onSelect() {} })
    );
    assert.equal(displayedStatus.text, expected);
    if (state === 'error')
      assert.equal(displayedStatus.message, 'engine startup failed');
  });
}

function StandaloneInstance({ instance }: { instance: ModelInstanceListItem }) {
  const columns = useInstanceColumns({
    workerList: [],
    modelList: [],
    clusterList: [],
    handleSelect() {}
  });
  const name = columns.find((column: any) => column.dataIndex === 'name')!;
  const worker = columns.find(
    (column: any) => column.dataIndex === 'worker_id'
  )!;
  return createElement(
    Fragment,
    null,
    (name as any).render(instance.name, instance),
    (worker as any).render(instance.worker_id, instance)
  );
}

for (const view of ['standalone', 'expanded']) {
  test(`${view} wires managed empty manifest to the information bubble without the legacy API`, () => {
    const instance = {
      ...record({ workloads: [] }),
      name: 'managed-instance',
      state: 'starting'
    };
    const element =
      view === 'standalone'
        ? createElement(StandaloneInstance, { instance })
        : createElement(InstanceItem, {
            instanceData: instance,
            workerList: [],
            defaultOpenId: '',
            handleChildSelect() {}
          });
    const html = renderToStaticMarkup(element);
    assert.match(html, /models.instance.workloads.pending/);
    assert.doesNotMatch(html, /10.0.0.1:8000/);
  });
}

test('legacy view wiring retains the expanded bubble and hides it in the standalone name', () => {
  const instance = { ...record(), name: 'legacy-instance', state: 'starting' };
  assert.match(
    renderToStaticMarkup(
      createElement(InstanceItem, {
        instanceData: instance,
        workerList: [],
        defaultOpenId: '',
        handleChildSelect() {}
      })
    ),
    /10.0.0.1:8000/
  );
  assert.doesNotMatch(
    renderToStaticMarkup(createElement(StandaloneInstance, { instance })),
    /10.0.0.1:8000|server-info/
  );
});

const componentInstance = () => ({
  ...record({
    subordinate_workers: [{ worker_id: 2, worker_ip: '10.0.0.2' }],
    workloads: [
      {
        name: 'engine',
        worker_id: 1,
        state: 'running',
        dp_rank_placements: [],
        component: {
          kind: 'sglang_engine',
          api_port: 9000,
          metrics_port: 9002,
          ready: true,
          dp_size: 4,
          attempt: 0,
          stop_requested: false
        }
      },
      {
        name: 'headless-engine',
        worker_id: 2,
        state: 'running',
        dp_rank_placements: [],
        component: {
          kind: 'sglang_engine',
          api_port: null,
          dp_size: 4,
          attempt: 0,
          stop_requested: false
        }
      },
      {
        name: 'smg',
        worker_id: 1,
        state: 'failed',
        dp_rank_placements: [],
        component: {
          kind: 'sglang_smg',
          api_port: 9100,
          metrics_port: 9101,
          ready: false,
          attempt: 2,
          stop_requested: true,
          last_restart_time: '2026-10-28T00:00:00Z'
        }
      }
    ]
  }),
  name: 'component-instance',
  state: 'starting'
});

test('component manifests retain shared Engine and CPU SMG information without rank APIs', () => {
  const details = workloadInfo(componentInstance())!;
  assert.equal(details.length, 3);
  assert.match(
    details[0],
    /sglang_engine.*shared API 10.0.0.1:9000.*logical DP 4/
  );
  assert.match(details[0], /metrics 10.0.0.1:9002.*ready=true.*running/);
  assert.match(details[1], /sglang_engine.*headless.*API -.*logical DP 4/);
  assert.doesNotMatch(details[1], /8000|9000|undefined/);
  assert.match(
    details[2],
    /sglang_smg.*CPU.*aggregate API 10.0.0.1:9100.*metrics 10.0.0.1:9101/
  );
  assert.match(
    details[2],
    /attempt=2.*ready=false.*stop_requested=true.*2026-10-28T00:00:00Z.*failed/
  );
  assert.doesNotMatch(details.join('\n'), /GPU \[|DP \d+ \/ node/);
});

for (const view of ['standalone', 'expanded']) {
  test(`${view} component bubble renders Engine and SMG contracts with empty placements`, () => {
    const instance = componentInstance();
    const element =
      view === 'standalone'
        ? createElement(StandaloneInstance, { instance })
        : createElement(InstanceItem, {
            instanceData: instance,
            workerList: [],
            defaultOpenId: '',
            handleChildSelect() {}
          });
    const html = renderToStaticMarkup(element);
    assert.match(html, /shared API 10.0.0.1:9000/);
    assert.match(html, /aggregate API 10.0.0.1:9100/);
    assert.match(html, /models.instance.workloads.logicalDPSize 4/);
    assert.doesNotMatch(
      html,
      /models.instance.workloads.pending|10.0.0.1:8000/
    );
  });
}

const rankInstance = () => ({
  ...record({
    workloads: [
      {
        name: 'DP 999 | https://display.invalid',
        worker_id: 1,
        state: 'failed',
        dp_rank_placements: [
          {
            dp_rank: 0,
            node_rank: 0,
            api_port: 9000,
            gpu_indexes: [0],
            ready: false
          },
          { dp_rank: 1, node_rank: 1, api_port: 9999, gpu_indexes: [1] },
          { dp_rank: 3, node_rank: 0, api_port: null, gpu_indexes: [2] }
        ]
      },
      {
        name: 'peer',
        worker_id: 9,
        state: 'pending',
        dp_rank_placements: [
          {
            dp_rank: 2,
            node_rank: 0,
            api_port: 9002,
            gpu_indexes: [0],
            ready: false
          }
        ]
      }
    ]
  }),
  name: 'managed-ranks',
  state: 'starting'
});

function renderView(view: string, instance: any) {
  return renderToStaticMarkup(
    view === 'standalone'
      ? createElement(StandaloneInstance, { instance })
      : createElement(InstanceItem, {
          instanceData: instance,
          workerList: [],
          defaultOpenId: '',
          handleChildSelect() {}
        })
  );
}
function targetAt(index: number) {
  const [value, target] = opened[index];
  assert.equal(target, '_blank');
  assert.match(value, /^\/v2\/model-instances\/42\/dashboard\?/);
  const url = new URL(value, 'http://local.invalid');
  return Object.fromEntries(url.searchParams);
}

test('monitor entries keep raw rank identity and the actual API owner without using display text or readiness', () => {
  const entries = workloadInfoEntries(rankInstance())!;
  assert.deepEqual(entries[0].monitor, {
    restart_count: 3,
    dp_rank: 0,
    worker_id: 1
  });
  assert.equal(entries[1].monitor, undefined);
  assert.equal(entries[2].monitor, undefined);
  assert.deepEqual(entries[3].monitor, {
    restart_count: 3,
    dp_rank: 2,
    worker_id: 9
  });
  assert.deepEqual(
    workloadInfo(rankInstance()),
    entries.map((entry: any) => entry.detail)
  );
  assert.equal(workloadInfoEntries(record()), null);
  assert.deepEqual(workloadInfoEntries(record({ workloads: [] })), []);
  const noEpoch = { ...rankInstance(), restart_count: null };
  assert.ok(
    workloadInfoEntries(noEpoch)!.every((entry: any) => !entry.monitor)
  );
});

for (const view of ['standalone', 'expanded']) {
  test(`${view} rank monitoring clicks use only main owners and the frozen backend URL`, () => {
    renderView(view, rankInstance());
    const buttons = monitorButtons.filter((props) =>
      String(props['aria-label']).startsWith('models.instance.monitor.rank')
    );
    assert.equal(buttons.length, 2);
    buttons.forEach(({ onClick, type, icon }) => {
      assert.equal(type, 'text');
      assert.ok(icon);
      onClick();
    });
    assert.deepEqual(targetAt(0), {
      restart_count: '3',
      worker_id: '1',
      dp_rank: '0'
    });
    assert.deepEqual(targetAt(1), {
      restart_count: '3',
      worker_id: '9',
      dp_rank: '2'
    });
    assert.ok(
      copiedDetails.some((text) =>
        text.includes('DP 999 | https://display.invalid')
      )
    );
    assert.ok(
      opened.every(
        ([url]) =>
          !url.includes('display.invalid') &&
          !url.includes('configured.invalid')
      )
    );
  });

  test(`${view} shared Engine and SMG links bind component/owner/attempt, with bounded logical DP choices`, () => {
    const instance = componentInstance();
    instance.distributed_servers!.workloads![0].worker_id = 9;
    const html = renderView(view, instance);
    const engine = monitorButtons.find(
      (props) => props['aria-label'] === 'models.instance.monitor.engine'
    );
    const smg = monitorButtons.find((props) =>
      String(props['aria-label']).startsWith('models.instance.monitor.smg')
    );
    assert.ok(engine);
    assert.ok(smg);
    engine.onClick();
    smg.onClick();
    assert.deepEqual(targetAt(0), {
      restart_count: '3',
      worker_id: '9',
      component: 'sglang_engine'
    });
    assert.deepEqual(targetAt(1), {
      restart_count: '3',
      worker_id: '1',
      component: 'sglang_smg',
      attempt: '2'
    });
    assert.equal(monitorMenus.length, 1);
    const menu = monitorMenus[0];
    assert.deepEqual(
      menu.items.map((item: any) => item.key),
      ['0', '1', '2', '3']
    );
    assert.ok(menu.style.maxHeight > 0);
    assert.equal(menu.style.overflowY, 'auto');
    menu.onClick({ key: '2' });
    assert.deepEqual(targetAt(2), {
      restart_count: '3',
      worker_id: '9',
      component: 'sglang_engine',
      dp_rank: '2'
    });
    menu.onClick({ key: '-1' });
    menu.onClick({ key: '4' });
    assert.equal(opened.length, 3);
    assert.match(html, /headless.*API -/);
    assert.match(html, /models.instance.monitor.logicalHint/);
    assert.equal(workloadInfoEntries(instance)!.length, 3);
  });

  test(`${view} legacy and empty manifests never invent monitoring targets`, () => {
    for (const distributed of [
      undefined,
      { workloads: null },
      { workloads: [] }
    ]) {
      renderView(view, {
        ...record(distributed),
        name: 'no-source',
        state: 'starting'
      });
    }
    assert.equal(monitorButtons.length, 0);
    assert.equal(monitorMenus.length, 0);
  });
}

test('monitor visibility follows the existing system setting without changing the raw source mapping', () => {
  getDefaultStore().set(monitoringConfig, {
    showMonitoring: false,
    grafana_url: 'https://configured.invalid'
  });
  renderView('expanded', rankInstance());
  assert.equal(monitorButtons.length, 0);
  assert.ok(workloadInfoEntries(rankInstance())![0].monitor);
});

test('shared Engine with unknown DP size has no invented logical ranks; epoch and attempt zero are retained', () => {
  const instance = componentInstance();
  instance.restart_count = 0;
  instance.distributed_servers!.workloads![0].component!.dp_size = null;
  instance.distributed_servers!.workloads![2].component!.attempt = 0;
  const entries = workloadInfoEntries(instance)!;
  assert.equal(entries[0].logicalDPSize, undefined);
  assert.equal(entries[2].monitor!.attempt, 0);
  renderView('expanded', instance);
  monitorButtons
    .find((props) =>
      String(props['aria-label']).startsWith('models.instance.monitor.smg')
    )
    .onClick();
  assert.equal(targetAt(0).attempt, '0');
  assert.equal(targetAt(0).restart_count, '0');
});

function LinkHarness({ type, target, row = { id: 42 } }: any) {
  const { goToGrafana } = useGranfanaLink({ type });
  monitorButtons.push({ onClick: () => goToGrafana(row, target) });
  return null;
}

test('a rendered SMG action retains its epoch and attempt if the manifest is replaced before the click', () => {
  const instance = componentInstance();
  renderView('expanded', instance);
  const action = monitorButtons.find((props) =>
    String(props['aria-label']).startsWith('models.instance.monitor.smg')
  );
  instance.restart_count = 4;
  instance.distributed_servers!.workloads![2].component!.attempt = 3;
  action.onClick();
  assert.deepEqual(targetAt(0), {
    restart_count: '3',
    worker_id: '1',
    component: 'sglang_smg',
    attempt: '2'
  });
  assert.equal(opened.length, 1);
});

test('existing monitoring callers retain default URLs and instance targets whitelist the five fields', () => {
  for (const [type, path] of [
    ['model', 'models'],
    ['worker', 'workers'],
    ['instance', 'model-instances'],
    ['cluster', 'clusters'],
    ['cache-service', 'cache-services']
  ]) {
    renderToStaticMarkup(
      createElement(LinkHarness, {
        type,
        row: { id: 42, restart_count: 99, dp_rank: 99 }
      })
    );
    monitorButtons.at(-1).onClick();
    assert.deepEqual(opened.at(-1), [`/v2/${path}/42/dashboard`, '_blank']);
  }
  opened.length = 0;
  renderToStaticMarkup(
    createElement(LinkHarness, {
      type: 'instance',
      target: {
        restart_count: 0,
        dp_rank: 0,
        worker_id: 9,
        scope: 'all',
        source_name: 'forged',
        host: 'https://forged.invalid',
        query: 'up'
      }
    })
  );
  monitorButtons.at(-1).onClick();
  assert.deepEqual(targetAt(0), {
    restart_count: '0',
    worker_id: '9',
    dp_rank: '0'
  });
});

test('rank groups sort numeric DP and node ranks without changing copy payloads or input order', () => {
  const instance = rankInstance();
  const entries = workloadInfoEntries(instance)!;
  const headless = {
    ...entries[1],
    placement: { ...entries[1].placement!, dp_rank: 0 }
  };
  const input = [entries[3], headless, entries[0], entries[2]];
  const groups = groupWorkloadInfoEntries(input);
  assert.deepEqual(
    groups.map((group) => group.rank),
    [0, 2, 3]
  );
  assert.deepEqual(
    groups[0].entries.map((entry) => entry.placement?.node_rank),
    [0, 1]
  );
  assert.equal(groups[0].entries[0].workerName, 'alpha');
  assert.equal(groups[0].entries[0].api, '10.0.0.1:9000');
  assert.equal(groups[0].entries[0].state, 'failed');
  assert.equal(groups[0].entries[0].detail, entries[0].detail);
  assert.equal(input[0], entries[3]);
  assert.equal(input[1], headless);
});

test('component groups retain each physical component and do not invent rank endpoints', () => {
  const entries = workloadInfoEntries(componentInstance())!;
  const groups = groupWorkloadInfoEntries(entries);
  assert.equal(groups.length, 3);
  assert.ok(
    groups.every(
      (group) => group.rank === undefined && group.entries.length === 1
    )
  );
  assert.equal(groups[1].entries[0].api, '-');
  assert.equal(groups[2].entries[0].component?.attempt, 2);
});

for (const view of ['standalone', 'expanded']) {
  test(`${view} rank sections show status once and preserve the diagnostic copy payload`, () => {
    const instance = rankInstance();
    const html = renderView(view, instance);
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    assert.deepEqual(
      [...doc.querySelectorAll('.workload-heading strong')].map(
        (el) => el.textContent
      ),
      ['DP 0', 'DP 1', 'DP 2', 'DP 3']
    );
    assert.equal(doc.querySelectorAll('.workload-heading button').length, 2);
    assert.equal(doc.querySelectorAll('.placement button').length, 0);
    assert.equal(
      doc.querySelectorAll('details, summary, .workload-detail').length,
      0
    );
    assert.equal(doc.querySelector('.worker-name')?.textContent, 'alpha');
    assert.equal(
      doc.querySelector('.placement-meta [data-status]')?.textContent,
      'failed'
    );
    const headless = doc.querySelectorAll('.workload-group')[1];
    assert.equal(headless.querySelector('.readiness'), null);
    assert.match(doc.querySelector('.readiness')!.textContent!, /apiNotReady/);
    assert.ok(
      workloadInfo(instance)!.every((detail) => !html.includes(detail))
    );
    assert.deepEqual([...copiedDetails].sort(), workloadInfo(instance)!.sort());
    dom.window.close();
  });
}

test('API readiness is independent of workload running state and unknown stays unknown', () => {
  const instance = rankInstance();
  instance.distributed_servers!.workloads![0].state = 'running';
  instance.distributed_servers!.workloads![0].dp_rank_placements[0].ready = true;
  let dom = new JSDOM(renderView('expanded', instance));
  assert.match(
    dom.window.document.querySelector('.readiness')!.textContent!,
    /apiReady/
  );
  dom.window.close();
  instance.distributed_servers!.workloads![0].dp_rank_placements[0].ready =
    null;
  dom = new JSDOM(renderView('expanded', instance));
  assert.match(
    dom.window.document.querySelector('.readiness')!.textContent!,
    /apiUnknown/
  );
  dom.window.close();
});

test('the scalar information groups stay separate and only managed tooltips get bounded sizing', () => {
  const instance = rankInstance();
  renderView('expanded', instance);
  const managedRows = infoGroups.at(-1).flat();
  assert.ok(
    managedRows.every((row: any) => row.label !== 'models.instance.workloads')
  );
  const managedTooltip = tooltips.find(
    (item) => item.styles?.container?.width === 'max-content'
  );
  assert.deepEqual(managedTooltip.styles.root, {
    width: 'max-content',
    maxWidth: 'calc(100vw - 32px)'
  });
  tooltips.length = 0;
  renderView('expanded', { ...instance, distributed_servers: undefined });
  const legacyRows = infoGroups.at(-1).flat();
  const displayRows = (rows: any[]) =>
    rows
      .filter((row) => row.label !== 'models.instance.workerip')
      .map(({ label, value }: any) => ({ label, value }));
  assert.deepEqual(displayRows(managedRows), displayRows(legacyRows));
  const legacyTooltip = tooltips.find(
    (item) => item.styles?.container?.width === 'max-content'
  );
  assert.equal(legacyTooltip.styles.root, undefined);
  assert.deepEqual(legacyTooltip.styles.container, { width: 'max-content' });
});
