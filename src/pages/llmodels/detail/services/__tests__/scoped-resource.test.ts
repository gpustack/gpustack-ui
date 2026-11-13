import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ScopedResource } from '../scoped-resource';
const deferred = <T>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

test('obsolete model or filter response cannot overwrite the active scope', async () => {
  const store = new ScopedResource<number>();
  const old = deferred<number>();
  const first = store.load('old', () => old.promise);
  await store.load('new', async () => 2);
  old.resolve(1);
  await first;
  assert.equal(store.snapshot.data, 2);
  assert.equal(store.snapshot.key, 'new');
});
test('same-scope transient failure retains last success and marks it stale', async () => {
  const store = new ScopedResource<number>();
  await store.load('a', async () => 0);
  await store.load('a', async () => {
    throw new Error('network');
  });
  assert.equal(store.snapshot.data, 0);
  assert.equal(store.snapshot.stale, true);
  const next = deferred<number>();
  const loading = store.load('b', () => next.promise);
  assert.equal(store.snapshot.data, null);
  assert.equal(store.snapshot.stale, false);
  next.resolve(3);
  await loading;
});
test('permission revocation clears retained values and cancellation rejects late success', async () => {
  const store = new ScopedResource<number>();
  await store.load('a', async () => 5);
  await store.load('a', async () => {
    throw { response: { status: 403 } };
  });
  assert.equal(store.snapshot.data, null);
  assert.equal(store.snapshot.stale, false);
  const later = deferred<number>();
  const pending = store.load('a', () => later.promise);
  store.reset();
  later.resolve(6);
  await pending;
  assert.equal(store.snapshot.data, null);
});

test('tenant headers can invalidate an in-flight response before the UI observes a switch', async () => {
  const store = new ScopedResource<number>();
  let tenant = 'org-a';
  const response = deferred<number>();
  const pending = store.load(
    'org-a:model-5',
    () => response.promise,
    () => tenant === 'org-a'
  );
  tenant = 'org-b';
  response.resolve(9);
  await pending;
  assert.equal(store.snapshot.data, null);
  assert.equal(store.snapshot.key, '');
});
