import { CheckOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { AutoComplete, Button, Flex } from 'antd';
import { useRef, useState } from 'react';
import { TopologyKnownKey } from '../../../config/types';

/** The field id a known key lists in `fits` to be offered for a custom layer. */
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
  /** Every worker's labels and discovered facts, for "N workers carry this key". */
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
 * The known keys that make sense for `fieldId` (an empty `fits` fits all),
 * grouped by vendor; the ones already in `existing` are greyed, not hidden.
 */
export const knownKeyOptions = (
  known: TopologyKnownKey[],
  fieldId: string,
  existing: string[]
): KnownKeyGroup[] => {
  const fitting = known.filter(
    (item) => !item.fits?.length || item.fits.includes(fieldId)
  );
  const vendors = Array.from(new Set(fitting.map((item) => item.vendor)));
  return vendors.map((vendor) => ({
    label: vendor,
    options: fitting
      .filter((item) => item.vendor === vendor)
      .map(
        (item): KnownKeyOption => ({
          value: item.key,
          label: item.key,
          disabled: existing.includes(item.key),
          note: item.note
        })
      )
  }));
};

export const renderKnownKey = (option: {
  data: KnownKeyOption | KnownKeyGroup;
}) => {
  // Only leaf options are rendered through here; groups draw their own label.
  const item = option.data as KnownKeyOption;
  return (
    <Flex orientation="vertical">
      <code style={{ fontSize: 12 }}>{item.value}</code>
      {item.note && (
        <span className="text-tertiary" style={{ fontSize: 12 }}>
          {item.note}
        </span>
      )}
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
    // Takes what is left of the chip line, or a line of its own in a narrow card.
    <Flex
      orientation="vertical"
      gap={4}
      style={{ flex: '1 1 200px', minWidth: 0 }}
    >
      <Flex align="center" gap={4}>
        <AutoComplete
          autoFocus
          size="small"
          style={{ flex: 1, minWidth: 0, maxWidth: 320 }}
          value={typed}
          status={error ? 'error' : undefined}
          placeholder={intl.formatMessage({
            id: 'clusters.topology.keys.placeholder'
          })}
          options={knownKeyOptions(vocabulary.known, fieldId, existing)}
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
          size="small"
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
