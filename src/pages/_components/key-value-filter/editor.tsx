import { OverlayScroller } from '@gpustack/core-ui';
import { Flex } from 'antd';
import { useState } from 'react';
import styles from './index.module.less';
import KeyValueFilterRow from './row';
import type { KeyValueFilterOption, KeyValueFilterValue } from './types';

interface FilterRow {
  id: number;
  key?: string;
  value?: string;
}

interface EditorProps {
  value: KeyValueFilterValue[];
  options: KeyValueFilterOption[];
  onChange: (value: KeyValueFilterValue[]) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
  loading?: boolean;
  autoFocus?: boolean;
}

const initialRows = (value: KeyValueFilterValue[]): FilterRow[] =>
  value.length ? value.map((pair, id) => ({ ...pair, id })) : [{ id: 0 }];

const filterSignature = (value: KeyValueFilterValue[]) =>
  JSON.stringify(value.map((pair) => [pair.key, pair.value]));

export default function KeyValueFilterEditor({
  value,
  options,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
  loading,
  autoFocus
}: EditorProps) {
  const signature = filterSignature(value);
  const [editor, setEditor] = useState(() => ({
    rows: initialRows(value),
    signature
  }));

  // External replacements reset drafts; echoed local changes retain row identity.
  if (editor.signature !== signature) {
    setEditor({ rows: initialRows(value), signature });
  }

  const changeRows = (rows: FilterRow[]) => {
    const pairs: KeyValueFilterValue[] = [];
    for (const row of rows) {
      if (
        row.key !== undefined &&
        row.value !== undefined &&
        !pairs.some((pair) => pair.key === row.key && pair.value === row.value)
      ) {
        pairs.push({ key: row.key, value: row.value });
      }
    }
    const nextSignature = filterSignature(pairs);
    setEditor({
      rows: rows.length ? rows : [{ id: 0 }],
      signature: nextSignature
    });
    if (nextSignature !== signature) onChange(pairs);
  };

  return (
    <OverlayScroller
      maxHeight="min(360px, calc(100dvh - 180px))"
      styles={{ wrapper: { padding: 0 } }}
    >
      <Flex vertical gap="small" className={styles.rows}>
        {editor.rows.map((row, index) => (
          <KeyValueFilterRow
            key={row.id}
            value={{ key: row.key, value: row.value }}
            options={options}
            disabledValues={editor.rows.flatMap((other) =>
              other.id !== row.id &&
              other.key === row.key &&
              other.value !== undefined
                ? [other.value]
                : []
            )}
            index={index}
            keyPlaceholder={keyPlaceholder}
            valuePlaceholder={valuePlaceholder}
            loading={loading}
            autoFocus={autoFocus && index === 0}
            onChange={(nextValue) =>
              changeRows(
                editor.rows.map((item) =>
                  item.id === row.id ? { id: item.id, ...nextValue } : item
                )
              )
            }
            onDelete={() =>
              changeRows(editor.rows.filter((item) => item.id !== row.id))
            }
            onAdd={
              index === editor.rows.length - 1
                ? () =>
                    changeRows([
                      ...editor.rows,
                      {
                        id: Math.max(...editor.rows.map((item) => item.id)) + 1
                      }
                    ])
                : undefined
            }
          />
        ))}
      </Flex>
    </OverlayScroller>
  );
}
