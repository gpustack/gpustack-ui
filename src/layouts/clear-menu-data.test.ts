import { describe, expect, it } from 'vitest';
import { clearMenuData } from './clear-menu-data';

describe('clearMenuData', () => {
  it('uses routes fallback for children check', () => {
    const result = clearMenuData([
      {
        name: 'parent',
        routes: [{ name: 'child', path: '/child' }]
      }
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].children).toEqual([{ name: 'child', path: '/child' }]);
    expect(result[0]).not.toHaveProperty('routes');
  });

  it('removes routes from result', () => {
    const result = clearMenuData([
      {
        name: 'leaf',
        routes: [{ name: 'hidden', hideInMenu: true }]
      }
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('routes');
  });

  it('filters hideInMenu items', () => {
    const result = clearMenuData([
      { name: 'visible' },
      { name: 'hidden', hideInMenu: true }
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('visible');
  });

  it('flattens when hideChildrenInMenu is set', () => {
    const result = clearMenuData([
      {
        name: 'parent',
        hideChildrenInMenu: true,
        children: [{ name: 'child' }]
      }
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].children).toBeUndefined();
    expect(result[0]).not.toHaveProperty('routes');
  });
});
