import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

let destination = '';
mock.module('@umijs/max', {
  namedExports: {
    useNavigate: () => (path: string) => {
      destination = path;
    }
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: { IconFont: () => null, icons: {} }
});
mock.module(new URL('../../../../atoms/user.ts', import.meta.url).href, {
  namedExports: { getCurrentOrg: () => null, getOrgById: () => null }
});
mock.module(new URL('../../../../plugins/index.ts', import.meta.url).href, {
  namedExports: { getGPUStackPlugin: () => null }
});

const { default: useOpenPlayground } = await import('../use-open-playground');

for (const [category, path] of [
  ['video', '/playground/video'],
  ['image', '/playground/text-to-image'],
  ['llm', '/playground/chat']
]) {
  test(`opening a ${category} route selects its matching playground`, () => {
    useOpenPlayground().handleOpenPlayGround({
      name: 'org/custom model',
      categories: [category]
    });
    assert.equal(destination, `${path}?model=org%2Fcustom%20model`);
  });
}
