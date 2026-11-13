import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
let response: any;
const request = mock.fn(async () => response);
mock.module('@umijs/max', { namedExports: { request } });
const { queryReadOnlyRevisions, queryReadOnlyRevision } =
  await import('../read-only-revisions');
test('revision reader uses authorized GET endpoints and excludes foreign model revisions', async () => {
  request.mock.resetCalls();
  response = {
    items: [
      { model_id: 7, revision: 2 },
      { model_id: 8, revision: 9 },
      { model_id: 7, revision: 3 }
    ]
  };
  const signal = new AbortController().signal;
  assert.deepEqual(
    (await queryReadOnlyRevisions(7, signal)).items.map(
      (item) => item.revision
    ),
    [3, 2]
  );
  response = { model_id: 7, revision: 3, spec: { backend: 'vLLM' } };
  assert.equal((await queryReadOnlyRevision(7, 3, signal)).model_id, 7);
  assert.deepEqual(
    request.mock.calls.map((call) => call.arguments[0]),
    ['/models/7/revisions', '/models/7/revisions/3']
  );
  for (const call of request.mock.calls) {
    assert.equal(call.arguments[1].method, 'GET');
    assert.equal(call.arguments[1].signal, signal);
    assert.equal(call.arguments[1].skipErrorHandler, true);
  }
});
test('a revision detail with a different model or revision is rejected', async () => {
  response = { model_id: 8, revision: 3, spec: { backend: 'foreign' } };
  await assert.rejects(
    queryReadOnlyRevision(7, 3, new AbortController().signal),
    /unavailable/
  );
});
