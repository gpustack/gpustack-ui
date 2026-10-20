import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

// DigitalOcean-style pages, shaped after the capture in gpustack#6495: page 1
// fills the `per_page=200` cap and points at page 2, while the GPU sizes NYC2
// actually offers only arrive on page 2.
const sizesPage1 = {
  sizes: [{ slug: 'gpu-4000adax1-20gb', regions: [] }],
  links: {
    pages: { next: 'https://api.digitalocean.com/v2/sizes?page=2&per_page=200' }
  },
  meta: { total: 311 }
};
const sizesPage2 = {
  sizes: [
    { slug: 'gpu-h100x1-80gb', regions: ['nyc2'] },
    { slug: 'gpu-h200x1-141gb', regions: ['nyc2'] }
  ],
  links: { pages: {} },
  meta: { total: 311 }
};

// Any other provider endpoint (Shuihua) answers without the pagination
// envelope, which must stay a single request returning the payload as-is.
const envelopeless = { data: [{ template_id: 1 }] };

// Per-test override for the page a walk lands on; the default serves the
// gpustack#6495 capture (page 1 links to page 2, page 2 ends the walk).
let sizesRespond: (page?: number) => any = (page) =>
  page === 2 ? sizesPage2 : sizesPage1;

const request = mock.fn(async (url: string, options: any) => {
  if (url.endsWith('/v2/sizes')) {
    return sizesRespond(options?.params?.page);
  }
  return envelopeless;
});
mock.module('@umijs/max', { namedExports: { request } });
// `../config` pulls provider icons from core-ui; the walk under test never
// touches them.
mock.module('@gpustack/core-ui', { namedExports: { icons: {} } });

const { queryCloudInstanceTypes, queryCloudOSImages } = await import(
  '../index.ts'
);

test('a provider-proxy list with a next link walks every page and merges the arrays', async () => {
  request.mock.resetCalls();
  const res: any = await queryCloudInstanceTypes({
    id: 5,
    provider: 'DigitalOcean'
  });

  assert.deepEqual(
    res.sizes.map((item: any) => item.slug),
    ['gpu-4000adax1-20gb', 'gpu-h100x1-80gb', 'gpu-h200x1-141gb']
  );
  // The merged payload keeps the envelope of the last page, so `meta.total`
  // still reads the provider's figure rather than a page-local count.
  assert.equal(res.meta.total, 311);
  assert.deepEqual(res.links.pages, {});

  assert.equal(request.mock.callCount(), 2);
  const [firstUrl, firstOptions] = request.mock.calls[0].arguments;
  const [secondUrl, secondOptions] = request.mock.calls[1].arguments;
  assert.equal(firstUrl, '/cloud-credentials/5/provider-proxy/v2/sizes');
  // The first request stays exactly the adapter's declaration — no `page`.
  assert.deepEqual(firstOptions, { method: 'GET', params: { per_page: 200 } });
  assert.equal(secondUrl, firstUrl);
  // `next` targets the provider host, so the follow-up re-issues through the
  // proxy with the original params plus an incrementing `page`.
  assert.deepEqual(secondOptions.params, { per_page: 200, page: 2 });
});

test('a payload without the pagination envelope is returned after one request', async () => {
  request.mock.resetCalls();
  const res = await queryCloudOSImages({ id: 9, provider: 'Shuihua' });

  assert.equal(res, envelopeless);
  assert.equal(request.mock.callCount(), 1);
});

test('a falsy follow-up page ends the walk on the last good envelope', async () => {
  sizesRespond = (page) => (page === 2 ? undefined : sizesPage1);
  request.mock.resetCalls();
  try {
    const res: any = await queryCloudInstanceTypes({
      id: 5,
      provider: 'DigitalOcean'
    });

    // Page 1's items survive with page 1's envelope — `meta.total` included.
    assert.deepEqual(res.sizes.map((item: any) => item.slug), [
      'gpu-4000adax1-20gb'
    ]);
    assert.equal(res.meta.total, 311);
    assert.equal(request.mock.callCount(), 2);
  } finally {
    sizesRespond = (page) => (page === 2 ? sizesPage2 : sizesPage1);
  }
});

test('a malformed follow-up page ends the walk on the last good envelope', async () => {
  sizesRespond = (page) =>
    page === 2
      ? { error: 'rate limited', links: { pages: {} } }
      : sizesPage1;
  request.mock.resetCalls();
  try {
    const res: any = await queryCloudInstanceTypes({
      id: 5,
      provider: 'DigitalOcean'
    });

    assert.deepEqual(res.sizes.map((item: any) => item.slug), [
      'gpu-4000adax1-20gb'
    ]);
    // The malformed page must not replace the last good envelope — its
    // `meta.total` survives and the `error` field never leaks in.
    assert.equal(res.meta.total, 311);
    assert.equal(res.error, undefined);
    assert.equal(request.mock.callCount(), 2);
  } finally {
    sizesRespond = (page) => (page === 2 ? sizesPage2 : sizesPage1);
  }
});

test('a walk that never ends fails loudly instead of truncating silently', async () => {
  sizesRespond = () => sizesPage1;
  request.mock.resetCalls();
  try {
    await assert.rejects(
      queryCloudInstanceTypes({ id: 5, provider: 'DigitalOcean' }),
      /exceeded 20 pages/
    );
    // The guard fires after the cap is fully served — no early bailout that
    // would hand back a partial list as though it were complete.
    assert.equal(request.mock.callCount(), 20);
  } finally {
    sizesRespond = (page) => (page === 2 ? sizesPage2 : sizesPage1);
  }
});

