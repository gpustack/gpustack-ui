import { atom } from 'jotai';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let replicaCss = '';
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: passChildren,
    DropdownButtons: passChildren,
    GrafanaIcon: passChildren,
    IconFont: passChildren,
    icons: {},
    StatusDot: ({ statusValue }: any) =>
      createElement('span', null, statusValue.text)
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (fn: unknown) => fn }
});
mock.module('antd', {
  namedExports: {
    Flex: ({ children, className, component = 'div' }: any) =>
      createElement(component, { className }, children),
    Tooltip: passChildren
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: (factory: any) => {
      const styles = factory({
        css: (parts: TemplateStringsArray) => parts.join('')
      });
      replicaCss = styles.pdReplicas.replaceAll('&', '.pd-replicas');
      return () => ({ styles: { pdReplicas: 'pd-replicas' } });
    }
  }
});
mock.module(new URL('../../../atoms/system.ts', import.meta.url).href, {
  namedExports: { systemConfigAtom: atom({}) }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: { StatusMaps: { inactive: 'inactive' } }
});
mock.module(new URL('../../../config/settings.ts', import.meta.url).href, {
  namedExports: { OPENAI_COMPATIBLE: 'v1', tableSorter: () => ({}) }
});
mock.module(
  new URL('../../../plugins/list-extra-columns.ts', import.meta.url).href,
  {
    namedExports: { usePluginListColumns: () => [] }
  }
);
mock.module(
  new URL('../../model-routes/config/index.ts', import.meta.url).href,
  {
    namedExports: { TargetStatusValueMap: { Active: 'active' } }
  }
);
mock.module(new URL('../../_components/model-tag.tsx', import.meta.url).href, {
  defaultExport: passChildren
});
mock.module(new URL('../config/index.ts', import.meta.url).href, {
  namedExports: {
    isModelServable: () => true,
    isPDModel: (record: any) => !!record.roles?.length,
    isRestartInFlight: () => false,
    modelCategoriesMap: {},
    modelReplicaCounts: (record: any) => ({ ready: 1, total: record.replicas }),
    ModelStateLabelMap: {},
    ModelStateMap: {},
    ModelStateValueMap: { Running: 'running', Pending: 'pending' },
    MyModelsStatusLabelMap: {},
    MyModelsStatusValueMap: { Stopped: 'stopped' }
  }
});
mock.module(new URL('../config/button-actions.ts', import.meta.url).href, {
  namedExports: { generateSource: () => '' }
});
mock.module(new URL('../components/pd/pd-markers.tsx', import.meta.url).href, {
  namedExports: { MarkerReasons: passChildren, markerTexts: () => [] }
});
mock.module(
  new URL('../components/pd/pd-replicas-cell.tsx', import.meta.url).href,
  {
    defaultExport: ({ record }: any) =>
      createElement(
        'div',
        null,
        record.roles.map((role: any) =>
          createElement(
            'button',
            { key: role.name, 'data-role-editor': role.name },
            role.name
          )
        )
      )
  }
);

const dom = new JSDOM('<html><head></head><body></body></html>');
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: dom.window
});
const { default: useModelsColumns } = await import('./use-models-columns.tsx');

const ReplicaCell = ({ record }: any) => {
  const columns = useModelsColumns({
    handleSelect() {},
    clusterList: [],
    sortOrder: [],
    targetList: [],
    onUpdateRoles: async () => {}
  });
  const column = columns.find((item) => item.key === 'replicas')!;
  return createElement(
    'div',
    null,
    (column.render as any)(record.replicas, record),
    createElement(
      'span',
      { 'data-ordinary-editor': true },
      createElement('button', null, 'edit replicas')
    )
  );
};

test('PD rows hide the ordinary editor and retain the role editors', () => {
  const style = dom.window.document.createElement('style');
  style.textContent = replicaCss;
  dom.window.document.head.appendChild(style);
  for (const roles of [null, [{ name: 'prefill' }, { name: 'decode' }]]) {
    dom.window.document.body.innerHTML = renderToStaticMarkup(
      createElement(ReplicaCell, { record: { replicas: 1, roles } })
    );
    const ordinaryEditor = dom.window.document.querySelector(
      '[data-ordinary-editor]'
    )!;
    assert.equal(
      dom.window.getComputedStyle(ordinaryEditor).display === 'none',
      !!roles
    );
    assert.equal(
      dom.window.document.querySelectorAll('[data-role-editor]').length,
      roles?.length ?? 0
    );
  }
});
