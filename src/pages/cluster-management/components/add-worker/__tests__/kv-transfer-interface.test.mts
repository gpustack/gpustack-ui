import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, Fragment, useState } from 'react';
import { createRoot } from 'react-dom/client';

const fieldLabel = 'resources.worker.kvTransferInterface';
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const empty = () => null;
const steps = new Map<string, any>();
let kvSwitch: any;
let kvInput: any;
let registrationArgs: any;

mock.module('@ant-design/icons', {
  namedExports: { ExclamationCircleFilled: empty }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AlertBlockInfo: empty,
    HighlightCode: ({ code }) => createElement('pre', null, code),
    SwitchCard: passChildren
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }) => id }) }
});
mock.module('antd', {
  namedExports: {
    Typography: { Text: passChildren, Paragraph: passChildren },
    Radio: { Group: passChildren },
    Switch: (props: any) => {
      if (props['aria-label'] === fieldLabel) kvSwitch = props;
      return null;
    },
    Input: (props: any) => {
      if (props['aria-label'] !== fieldLabel) return null;
      kvInput = props;
      return createElement('input', {
        'aria-label': props['aria-label'],
        value: props.value,
        onChange: props.onChange
      });
    }
  }
});
mock.module('styled-components', {
  defaultExport: { div: () => passChildren }
});
mock.module(new URL('../constainers.tsx', import.meta.url).href, {
  namedExports: {
    NotesWrapper: passChildren,
    SwitchWrapper: passChildren,
    Title: passChildren
  }
});
mock.module(new URL('../step-collapse.tsx', import.meta.url).href, {
  defaultExport: (props: any) => {
    steps.set(props.name, props);
    return passChildren(props);
  }
});
mock.module(new URL('../../add-worker-command.tsx', import.meta.url).href, {
  defaultExport: (props: any) => {
    registrationArgs = props;
    return null;
  }
});
for (const file of ['summary-data', 'vendor-notes']) {
  mock.module(new URL(`../${file}.tsx`, import.meta.url).href, {
    defaultExport: empty
  });
}

const dom = new JSDOM('<div id="root"></div>');
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true
});
after(() => dom.window.close());

const { AddWorkerContext } = await import('../add-worker-context.ts');
const { default: SpecifyArguments } = await import('../specify-arguments.tsx');
const { default: DockerRunCommand } = await import('../docker-run-command.tsx');

function Harness({
  initialInterface
}: {
  initialInterface?: { enable: boolean; value?: string | null };
}) {
  const [summary, setSummary] = useState(
    () =>
      new Map<string, any>([
        ['currentGPU', 'cuda'],
        ['selectedGPUs', ['cuda']],
        ['kvTransferIfnameConfig', initialInterface]
      ])
  );
  return createElement(
    AddWorkerContext.Provider,
    {
      value: {
        provider: 'Docker',
        stepList: ['SpecifyArgs', 'RunCommand'],
        collapseKey: new Set(),
        onToggle() {},
        registrationInfo: {
          token: '',
          image: '',
          server_url: '',
          cluster_id: 1
        },
        summary,
        registerField: () => () => {},
        updateField: (key, value) =>
          setSummary((previous) => new Map(previous).set(key, value))
      }
    },
    createElement(SpecifyArguments, {}),
    createElement(DockerRunCommand, {})
  );
}

test('only an enabled, nonblank interface can reach the Docker registration command', async (t) => {
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => act(async () => root.unmount()));
  await act(async () => root.render(createElement(Harness)));
  assert.match(
    document.body.textContent!,
    /clusters\.addworker\.extraVolume.*resources\.worker\.kvTransferInterface.*clusters\.addworker\.dataVolume/s
  );
  const input = () => document.querySelector(`[aria-label="${fieldLabel}"]`);
  assert.equal(kvSwitch.checked, false);
  assert.equal(input(), null);
  assert.equal(registrationArgs.kvTransferIfname, undefined);

  await act(async () => kvSwitch.onChange(true));
  assert.ok(input());
  assert.equal(steps.get('SpecifyArgs').nextDisabled, true);
  assert.equal(steps.get('RunCommand').disabled, true);
  assert.match(document.body.textContent!, /grep -lw ACTIVE.*paste -sd, -/);
  await act(async () => kvInput.onChange({ target: { value: ' \t ' } }));
  assert.equal(steps.get('RunCommand').disabled, true);
  const value = ' ens5f0,  ens6f0 ';
  await act(async () => kvInput.onChange({ target: { value } }));
  assert.equal(steps.get('SpecifyArgs').nextDisabled, false);
  assert.equal(steps.get('RunCommand').disabled, false);
  assert.equal(registrationArgs.kvTransferIfname, value);

  await act(async () => kvSwitch.onChange(false));
  assert.equal(input(), null);
  assert.equal(steps.get('RunCommand').disabled, false);
  assert.equal(registrationArgs.kvTransferIfname, undefined);
});

for (const value of [undefined, null]) {
  test(`enabled KV input stays blank with ${value}`, async (t) => {
    const root = createRoot(document.getElementById('root')!);
    t.after(async () => act(async () => root.unmount()));
    await act(async () =>
      root.render(
        createElement(Harness, { initialInterface: { enable: true, value } })
      )
    );

    assert.ok(document.querySelector(`[aria-label="${fieldLabel}"]`));
    assert.equal(kvInput.value, '');
    assert.equal(steps.get('SpecifyArgs').nextDisabled, true);
    assert.equal(steps.get('RunCommand').disabled, true);
    assert.equal(registrationArgs.kvTransferIfname, undefined);
  });
}
