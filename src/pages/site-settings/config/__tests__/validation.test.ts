import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultSiteSettings } from '../index';
import { parseSiteSettings, resolveFooterUrl } from '../validation';

for (const link of [
  'javascript:alert(1)',
  'data:text/html,hello',
  '//outside.test',
  '/\\outside.test',
  'https:///missing-host',
  'https://user:pass@example.com',
  'https://@example.com',
  'https://example.com:wrong',
  'https://example.com:65536',
  '/a\nb',
  '/a\x00b',
  '/a\x7fb'
]) {
  test(`rejects unsafe footer link ${JSON.stringify(link)}`, () => {
    assert.equal(resolveFooterUrl(link), undefined);
  });
}

for (const link of [
  'https://example.com/about',
  'HTTP://localhost:8080',
  'http://[::1]:8080',
  '/about?from=footer#info'
]) {
  test(`preserves valid footer link ${link}`, () => {
    assert.equal(resolveFooterUrl(` ${link} `), link);
  });
}

test('optional footer values use the default link', () => {
  for (const value of [null, undefined, '', ' ', 12, {}]) {
    assert.equal(resolveFooterUrl(value), undefined);
  }
});

for (const value of [
  '<html>GPUStack</html>',
  null,
  {},
  [],
  { ...defaultSiteSettings, primary_color: ['#123456'] },
  { ...defaultSiteSettings, site_name: ' ' },
  { ...defaultSiteSettings, logo: {} },
  { ...defaultSiteSettings, footer_name: false }
]) {
  test(`rejects malformed settings ${JSON.stringify(value)}`, () => {
    assert.throws(() => parseSiteSettings(value), /Invalid site settings/);
  });
}

test('valid partial responses fill only missing optional values with defaults', () => {
  assert.deepEqual(
    parseSiteSettings({ site_name: 'Lab', primary_color: '#123456' }),
    {
      ...defaultSiteSettings,
      site_name: 'Lab',
      primary_color: '#123456'
    }
  );
});
