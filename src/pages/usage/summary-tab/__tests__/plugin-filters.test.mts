import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, afterEach, mock, test } from 'node:test';
import React, { act, createElement } from 'react';

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  React: { configurable: true, value: React },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
const empty = () => null;
const wrapper = ({ children }: any) => createElement('div', null, children);
const resourceMeta = {
  creators: [],
  instances: [],
  volumes: [],
  organizations: [] as { value: number; label: string }[],
  user_groups: [] as { value: number; label: string }[]
};
const userIdentity = { value: { user_name: 'alice' }, current: { user_id: 7 } };
let tokenMeta = { users: [{ label: 'alice', identity: userIdentity }] };
let filterBar: any;
let plugin: any;
const summaryQuery = mock.fn(async (_params: any) => ({}));
const tokenQuery = mock.fn(async (_params: any) => ({}));
const resourceQuery = mock.fn(async (_params: any) => ({}));
const storageQuery = mock.fn(async (_params: any) => ({}));

mock.module('@umijs/max', {
  namedExports: {
    useAccess: () => ({ canSeeOrgAdmin: true }),
    useIntl: () => ({ formatMessage: ({ id }: any) => id }),
    useModel: () => ({ initialState: { currentUser: { id: 7 } } })
  }
});
mock.module('@gpustack/core-ui', { namedExports: { CardWrapper: wrapper } });
mock.module('antd', { namedExports: { Col: wrapper, Row: wrapper } });
mock.module(new URL('../../../../plugins/index.ts', import.meta.url).href, {
  namedExports: { getGPUStackPlugin: () => plugin }
});
mock.module(
  new URL('../../../../hooks/use-cool-colors.ts', import.meta.url).href,
  {
    namedExports: { useCoolAccents: () => () => [] }
  }
);
mock.module(new URL('../../../../utils/index.ts', import.meta.url).href, {
  namedExports: { formatLargeNumber: String }
});
for (const path of ['bar-chart', 'pie-chart']) {
  mock.module(
    new URL(`../../../_components/${path}/index.tsx`, import.meta.url).href,
    {
      defaultExport: empty
    }
  );
}
mock.module(
  new URL('../../components/resource-filter-bar.tsx', import.meta.url).href,
  {
    defaultExport: (props: any) => {
      filterBar = props;
      return null;
    }
  }
);
mock.module(new URL('../../hooks/use-resource-meta.ts', import.meta.url).href, {
  defaultExport: () => resourceMeta
});
mock.module(
  new URL('../../services/use-query-meta-data.ts', import.meta.url).href,
  {
    defaultExport: () => ({ detailData: tokenMeta, fetchData: empty })
  }
);
for (const [path, fetchData] of [
  ['use-query-usage-summary', summaryQuery],
  ['use-query-timeseries-data', tokenQuery],
  ['use-query-resource-breakdown', resourceQuery],
  ['use-query-storage-breakdown', storageQuery]
] as const) {
  mock.module(new URL(`../services/${path}.ts`, import.meta.url).href, {
    defaultExport: () => ({ detailData: {}, loading: false, fetchData })
  });
}
const { createRoot } = await import('react-dom/client');
const { default: SummaryTab } = await import('../index.tsx');
let root: ReturnType<typeof createRoot>;
const mount = async () => {
  root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(SummaryTab)));
};
afterEach(async () => {
  await act(async () => root?.unmount());
  plugin = undefined;
  resourceMeta.organizations = [];
  resourceMeta.user_groups = [];
  for (const query of [summaryQuery, tokenQuery, resourceQuery, storageQuery]) {
    query.mock.resetCalls();
  }
});
after(() => dom.window.close());

test('summary forwards both metadata sources to the option extension', async () => {
  const options = [{ value: 4, label: 'testa' }];
  const resolveOptions = mock.fn(() => ({ organizations: options }));
  plugin = { usage: { summaryFilterOptions: resolveOptions } };
  await mount();
  assert.deepEqual(filterBar.organizationOptions, options);
  assert.deepEqual(resolveOptions.mock.calls.at(-1)?.arguments, [
    { resourceMeta, tokenMeta }
  ]);
});

test('summary composes plugin token filters with the selected user and clears them', async () => {
  const identity = { value: {}, current: { route_id: 21 } };
  const buildFilters = mock.fn(
    ({
      selectedOrganizations,
      selectedUserGroups
    }: {
      selectedOrganizations: number[];
      selectedUserGroups: number[];
    }) =>
      selectedOrganizations.length || selectedUserGroups.length
        ? { routes: [{ identity }] }
        : {}
  );
  plugin = { usage: { summaryTokenFilters: buildFilters } };
  await mount();
  await act(async () => filterBar.onUsersChange([7]));
  await act(async () => filterBar.onOrganizationsChange([4]));
  await act(async () => filterBar.onUserGroupsChange([12]));
  assert.deepEqual(buildFilters.mock.calls.at(-1)?.arguments, [
    {
      selectedOrganizations: [4],
      selectedUserGroups: [12]
    }
  ]);
  assert.deepEqual(tokenQuery.mock.calls.at(-1)?.arguments[0].filters, {
    users: [{ identity: userIdentity }],
    routes: [{ identity }]
  });
  assert.deepEqual(
    summaryQuery.mock.calls.at(-1)?.arguments[0].organization_ids,
    [4]
  );
  assert.deepEqual(resourceQuery.mock.calls.at(-1)?.arguments[0].filters, {
    creator_ids: [7],
    organization_ids: [4],
    user_group_ids: [12]
  });
  await act(async () => filterBar.onOrganizationsChange([]));
  await act(async () => filterBar.onUserGroupsChange([]));
  assert.deepEqual(tokenQuery.mock.calls.at(-1)?.arguments[0].filters, {
    users: [{ identity: userIdentity }]
  });
});

test('summary works without filter extensions', async () => {
  await mount();
  assert.deepEqual(filterBar.organizationOptions, []);
  assert.deepEqual(tokenQuery.mock.calls.at(-1)?.arguments[0].filters, {});
  await act(async () => filterBar.onUsersChange([7]));
  assert.deepEqual(tokenQuery.mock.calls.at(-1)?.arguments[0].filters, {
    users: [{ identity: userIdentity }]
  });
});

for (const value of [undefined, null]) {
  test(`summary retains resource options when plugin fields are ${value}`, async () => {
    resourceMeta.organizations = [{ value: 4, label: 'testa' }];
    resourceMeta.user_groups = [{ value: 12, label: 'engineering' }];
    plugin = {
      usage: {
        summaryFilterOptions: () => ({
          organizations: value,
          user_groups: value
        })
      }
    };
    await mount();
    assert.deepEqual(filterBar.organizationOptions, resourceMeta.organizations);
    assert.deepEqual(filterBar.userGroupOptions, resourceMeta.user_groups);
  });
}

test('summary respects explicitly empty plugin option arrays', async () => {
  resourceMeta.organizations = [{ value: 4, label: 'testa' }];
  resourceMeta.user_groups = [{ value: 12, label: 'engineering' }];
  plugin = {
    usage: {
      summaryFilterOptions: () => ({ organizations: [], user_groups: [] })
    }
  };
  await mount();
  assert.deepEqual(filterBar.organizationOptions, []);
  assert.deepEqual(filterBar.userGroupOptions, []);
});
