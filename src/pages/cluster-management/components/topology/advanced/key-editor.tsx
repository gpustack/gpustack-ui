import { CheckOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { AutoComplete, Button, Flex } from 'antd';
import { useRef, useState } from 'react';
import { TopologyKnownKey } from '../../../config/types';

/** Custom layers can use presets from any built-in layer. */
export const CUSTOM_FIELD = 'custom';

/**
 * A Kubernetes label key: optional DNS-subdomain prefix (≤253), a slash, then
 * a name of at most 63 chars that starts and ends alphanumeric.
 */
const NAME_RE = /^[a-z0-9A-Z]([-a-z0-9A-Z_.]{0,61}[a-z0-9A-Z])?$/;
const PREFIX_RE =
  /^[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?(\.[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?)*$/;

export const isValidLabelKey = (key: string) => {
  const slash = key.indexOf('/');
  if (slash === -1) {
    return NAME_RE.test(key);
  }
  const prefix = key.slice(0, slash);
  const name = key.slice(slash + 1);
  return prefix.length <= 253 && PREFIX_RE.test(prefix) && NAME_RE.test(name);
};

/** What the editors need to offer and count keys; the same for every field. */
export interface KeyVocabulary {
  known: TopologyKnownKey[];
  /** Worker labels and discovered facts, for suggestions and usage counts. */
  workerLabels: Record<string, string>[];
}

export interface KnownKeyOption {
  value: string;
  label: string;
  disabled: boolean;
  note?: string | null;
}

export interface KnownKeyGroup {
  label: string;
  options: KnownKeyOption[];
}

/**
 * Worker keys come first, followed by applicable preset keys grouped by vendor.
 * A key appears once; already configured keys stay visible but disabled.
 */
export const labelKeyOptions = (
  vocabulary: KeyVocabulary,
  fieldId: string,
  existing: string[],
  workerLabel: string
): KnownKeyGroup[] => {
  const existingKeys = new Set(existing);
  const known = new Map(vocabulary.known.map((item) => [item.key, item]));
  const workerKeys = new Set(
    vocabulary.workerLabels.flatMap((labels) => Object.keys(labels))
  );
  const groups: KnownKeyGroup[] = [];
  if (workerKeys.size) {
    groups.push({
      label: workerLabel,
      options: [...workerKeys]
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({
          value: key,
          label: key,
          disabled: existingKeys.has(key),
          note: known.get(key)?.note
        }))
    });
  }

  const vendors = new Map<string, KnownKeyGroup>();
  const seen = new Set(workerKeys);
  vocabulary.known.forEach((item) => {
    if (
      seen.has(item.key) ||
      (fieldId !== CUSTOM_FIELD &&
        item.fits?.length &&
        !item.fits.includes(fieldId))
    ) {
      return;
    }
    seen.add(item.key);
    let group = vendors.get(item.vendor);
    if (!group) {
      group = { label: item.vendor, options: [] };
      vendors.set(item.vendor, group);
      groups.push(group);
    }
    group.options.push({
      value: item.key,
      label: item.key,
      disabled: existingKeys.has(item.key),
      note: item.note
    });
  });
  return groups;
};

export const renderKnownKey = (option: {
  data: KnownKeyOption | KnownKeyGroup;
}) => {
  // Only leaf options are rendered through here; groups draw their own label.
  const item = option.data as KnownKeyOption;
  return (
    <Flex orientation="vertical">
      <span>{item.value}</span>
      {item.note && <span className="text-tertiary">{item.note}</span>}
    </Flex>
  );
};

interface KeyEditorProps {
  fieldId: string;
  vocabulary: KeyVocabulary;
  existing: string[];
  onAdd: (key: string) => void;
  onCancel: () => void;
}

/**
 * [S2a] One line in place of the "+ add key" button: pick a key the industry
 * already uses or type your own. The live count under it answers "do we even
 * have that label" before anything is previewed.
 */
export const KeyEditor: React.FC<KeyEditorProps> = ({
  fieldId,
  vocabulary,
  existing,
  onAdd,
  onCancel
}) => {
  const intl = useIntl();
  const [typed, setTyped] = useState('');
  // Enter on a highlighted option fires onSelect and then onKeyDown; the flag
  // keeps the second one from also committing the stale typed text.
  const selectedRef = useRef(false);

  const key = typed.trim();
  const valid = !!key && isValidLabelKey(key);
  const exists = valid && existing.includes(key);
  const error = key && !valid ? 'invalid' : exists ? 'exists' : null;

  const carriers = valid
    ? vocabulary.workerLabels.filter((labels) => labels[key] !== undefined)
    : [];
  const distinct = new Set(carriers.map((labels) => labels[key])).size;

  const commit = (raw: string) => {
    const next = raw.trim();
    if (next && isValidLabelKey(next) && !existing.includes(next)) {
      onAdd(next);
    }
  };

  return (
    // Use the full candidate-key panel width, including for long label keys.
    <Flex orientation="vertical" gap={4} style={{ width: '100%', minWidth: 0 }}>
      <Flex align="center" gap={4}>
        <AutoComplete
          autoFocus
          size="middle"
          style={{ flex: 1, minWidth: 0 }}
          value={typed}
          status={error ? 'error' : undefined}
          placeholder={intl.formatMessage({
            id: 'clusters.topology.keys.placeholder'
          })}
          options={labelKeyOptions(
            vocabulary,
            fieldId,
            existing,
            intl.formatMessage({ id: 'clusters.topology.keys.workerLabels' })
          )}
          optionRender={renderKnownKey}
          defaultActiveFirstOption={false}
          filterOption={(input, option?: KnownKeyOption | KnownKeyGroup) =>
            !!option && 'value' in option && option.value.includes(input.trim())
          }
          onChange={setTyped}
          onSelect={(value: string) => {
            selectedRef.current = true;
            commit(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onCancel();
            } else if (e.key === 'Enter') {
              if (selectedRef.current) {
                selectedRef.current = false;
              } else {
                commit(typed);
              }
            }
          }}
          onBlur={() => {
            if (!key) {
              onCancel();
            }
          }}
        />
        <Button
          type="text"
          size="middle"
          style={{ flexShrink: 0 }}
          icon={<CheckOutlined />}
          disabled={!valid || exists}
          onClick={() => commit(typed)}
        />
      </Flex>
      {error ? (
        <span style={{ fontSize: 12, color: 'var(--ant-color-error)' }}>
          {intl.formatMessage({ id: `clusters.topology.keys.${error}` })}
        </span>
      ) : (
        valid &&
        vocabulary.workerLabels.length > 0 && (
          <span className="text-tertiary" style={{ fontSize: 12 }}>
            {intl.formatMessage(
              { id: 'clusters.topology.keys.usage' },
              { count: carriers.length, values: distinct }
            )}
          </span>
        )
      )}
    </Flex>
  );
};
