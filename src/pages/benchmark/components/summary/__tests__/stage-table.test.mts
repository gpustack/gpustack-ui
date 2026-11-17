import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

let tableProps: any;
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    Table: (props: any) => {
      tableProps = props;
      return createElement(
        'div',
        null,
        props.dataSource.map((row: any) =>
          createElement(
            'div',
            { key: row.id, className: 'row-wrapper' },
            props.columns.map((column: any) =>
              createElement(
                'div',
                { key: column.dataIndex, className: 'cell' },
                column.render
                  ? column.render(row[column.dataIndex], row)
                  : row[column.dataIndex]
              )
            )
          )
        )
      );
    }
  }
});
const { default: StageTable } = await import('../stage-table');

test('loaded grid tables avoid the default spinner and support whole-row click, keyboard and selection', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true },
    document: { value: dom.window.document, configurable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    Element: { value: dom.window.Element, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
  });
  const selected: number[] = [];
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(StageTable, {
        rowKey: 'id',
        dataSource: [
          { id: 1, load: 24, value: 100 },
          { id: 2, load: 48, value: 200 }
        ],
        columns: [
          { dataIndex: 'load', title: 'Target' },
          { dataIndex: 'value', title: 'TPS' }
        ],
        selectedId: 2,
        onSelect: (point: any) => selected.push(point.id)
      })
    )
  );
  assert.equal(tableProps.loading, false);
  assert.equal(
    document.querySelector('[data-benchmark-selected="true"]')?.textContent,
    '48'
  );
  const firstValue = document.querySelector('.row-wrapper .cell:last-child')!;
  firstValue.dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true })
  );
  const secondTarget = document.querySelectorAll('[data-benchmark-point]')[1];
  secondTarget.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  );
  assert.deepEqual(selected, [1, 2]);
  await act(async () => root.unmount());
  dom.window.close();
});
