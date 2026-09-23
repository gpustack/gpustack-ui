import { useIntl } from '@umijs/max';
import { Alert, Flex, Input, Modal } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import { useState } from 'react';
import { RACK_LAYER, TopologyKnownKey } from '../../../config/types';
import { DraftLayer } from './draft';
import { KeyList } from './field-chain';
import { CUSTOM_FIELD, KeyVocabulary } from './key-editor';

/** Indent per rung of the staircase, in px. */
const STEP = 14;

const useStyles = createStyles(({ css }) => ({
  /* The chain as a staircase with a clickable gap between every two rungs.
     A gap is a thin line until hovered, so the eye reads the chain first and
     the slots second; the chosen gap becomes the new layer's row. */
  picker: css`
    padding: 4px 0;
    .rung {
      position: relative;
      padding-left: 16px;
      line-height: 28px;
      color: var(--ant-color-text-tertiary);
    }
    .rung.child::before {
      content: '';
      position: absolute;
      left: 5px;
      top: -6px;
      width: 8px;
      height: 20px;
      border-left: 1px solid var(--ant-color-border);
      border-bottom: 1px solid var(--ant-color-border);
      border-bottom-left-radius: 3px;
    }
    .slot {
      position: relative;
      height: 12px;
      cursor: pointer;
    }
    .slot::before {
      content: '';
      position: absolute;
      left: 16px;
      right: 0;
      top: 5px;
      border-top: 1px dashed transparent;
    }
    .slot .hint {
      position: absolute;
      left: 50%;
      top: 5px;
      transform: translate(-50%, -50%);
      padding: 0 8px;
      border-radius: 10px;
      background: var(--ant-color-primary);
      color: var(--ant-color-white);
      font-size: 11px;
      line-height: 18px;
      white-space: nowrap;
      opacity: 0;
    }
    .slot:hover::before {
      border-color: var(--ant-color-primary);
    }
    .slot:hover .hint {
      opacity: 1;
    }
    .picked {
      color: var(--ant-color-text);
      padding: 4px 8px 4px 16px;
      border: 1px dashed var(--ant-color-primary);
      border-radius: 6px;
      background: var(--ant-color-primary-bg);
      line-height: 22px;
    }
    .picked .name {
      font-weight: 500;
    }
    .picked .explain {
      font-size: 12px;
      color: var(--ant-color-text-secondary);
    }
  `
}));

export interface CustomLayerValue {
  name: string;
  labelKeys: string[];
  /** Position in the chain (0 = right under the cluster root). */
  index: number;
}

interface CustomLayerProps {
  open: boolean;
  /** The chain as it stands, root to leaf, host excluded. */
  chain: DraftLayer[];
  /** Names a custom layer may not take — the leaf's, and the vocabulary's. */
  reserved: string[];
  /** Editing an existing layer; absent when creating. */
  initial?: (CustomLayerValue & { id: string }) | null;
  knownKeys: TopologyKnownKey[];
  /** Every worker's labels, for the editor's "N workers carry this key" hint. */
  workerLabels?: Record<string, string>[];
  onOk: (value: CustomLayerValue) => void;
  onCancel: () => void;
}

/**
 * [S2b] A layer the vocabulary does not have. Its name is also its id and
 * reaches the deployment form verbatim; its position is a gap in the chain,
 * because a layer only ever sits between two neighbours. Opened from the
 * column picker; confirming writes the cluster at once, nothing is staged.
 */
const CustomLayer: React.FC<CustomLayerProps> = ({
  open,
  chain,
  reserved,
  initial,
  knownKeys,
  workerLabels = [],
  onOk,
  onCancel
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [name, setName] = useState(initial?.name || '');
  const [labelKeys, setLabelKeys] = useState<string[]>(
    initial?.labelKeys || []
  );
  // Above the rack by default: the network block / pod case a vocabulary of
  // rows and racks has no word for.
  const [index, setIndex] = useState<number>(
    initial?.index ??
      Math.max(
        0,
        chain.findIndex((l) => l.id === RACK_LAYER)
      )
  );

  const others = chain.filter((layer) => layer.id !== initial?.id);
  const trimmed = name.trim();
  // Checked against what each rung is *called*, not against ids. Ids are
  // generated now and cannot collide by typing; two rungs sharing a label
  // still can, and that is the collision that matters — the deployment form's
  // "at least in the same ___" would offer the same word twice.
  const clash = (candidate: string) =>
    candidate.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase();
  const taken =
    reserved.some(clash) || others.some((l) => clash(l.label) || clash(l.name));
  const nameError = !trimmed
    ? intl.formatMessage({ id: 'clusters.topology.custom.name.required' })
    : taken
      ? intl.formatMessage({ id: 'clusters.topology.custom.name.taken' })
      : null;

  const host = intl.formatMessage({ id: 'clusters.topology.field.host' });
  const slot = Math.min(index, others.length);
  const shownName =
    trimmed ||
    intl.formatMessage({ id: 'clusters.topology.custom.slot.placeholder' });
  /** Slot i sits above rung i; the host is the rung after the last layer. */
  const rungs = [...others.map((layer) => layer.label), host];

  const explain = (at: number) =>
    at === 0
      ? intl.formatMessage(
          { id: 'clusters.topology.custom.slot.explain.top' },
          { name: shownName, child: rungs[0] }
        )
      : intl.formatMessage(
          { id: 'clusters.topology.custom.slot.explain' },
          { parent: rungs[at - 1], name: shownName, child: rungs[at] }
        );

  const vocabulary: KeyVocabulary = { known: knownKeys, workerLabels };

  const handleOk = () => {
    if (nameError) {
      return;
    }
    onOk({ name: trimmed, labelKeys, index: slot });
  };

  return (
    <Modal
      open={open}
      width={560}
      destroyOnHidden
      title={intl.formatMessage({ id: 'clusters.topology.custom.title' })}
      okText={intl.formatMessage({ id: 'common.button.confirm' })}
      cancelText={intl.formatMessage({ id: 'common.button.cancel' })}
      okButtonProps={{ disabled: !!nameError }}
      onOk={handleOk}
      onCancel={onCancel}
    >
      <Flex orientation="vertical" gap={16}>
        <Flex orientation="vertical" gap={4}>
          <span>
            {intl.formatMessage({ id: 'clusters.topology.layer.name' })}
          </span>
          <Input
            value={name}
            status={name && nameError ? 'error' : undefined}
            onChange={(e) => setName(e.target.value)}
          />
          <span
            className="text-tertiary"
            style={{
              fontSize: 12,
              color: name && nameError ? 'var(--ant-color-error)' : undefined
            }}
          >
            {(name && nameError) ||
              intl.formatMessage({ id: 'clusters.topology.custom.name.tips' })}
          </span>
        </Flex>
        <Flex orientation="vertical" gap={4}>
          <span>
            {intl.formatMessage({ id: 'clusters.topology.custom.position' })}
          </span>
          <div className={styles.picker} role="radiogroup">
            {rungs.map((rung, at) => {
              // Rungs below the picked slot step one further in: the new
              // layer is now between them and the root.
              const depth = at + (at >= slot ? 1 : 0);
              return (
                <div key={at}>
                  {at === slot ? (
                    <div
                      className={classNames('rung', 'picked', {
                        child: at > 0
                      })}
                      role="radio"
                      aria-checked
                      style={{ marginLeft: at * STEP }}
                    >
                      <div className="name">{shownName}</div>
                      <div className="explain">{explain(at)}</div>
                    </div>
                  ) : (
                    <div
                      className="slot"
                      role="radio"
                      aria-checked={false}
                      tabIndex={0}
                      style={{ marginLeft: at * STEP }}
                      onClick={() => setIndex(at)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setIndex(at);
                        }
                      }}
                    >
                      <span className="hint">
                        {intl.formatMessage({
                          id: 'clusters.topology.custom.slot.insert'
                        })}
                      </span>
                    </div>
                  )}
                  <div
                    className={classNames('rung', { child: depth > 0 })}
                    style={{ marginLeft: depth * STEP }}
                  >
                    {rung}
                  </div>
                </div>
              );
            })}
          </div>
        </Flex>
        <Flex orientation="vertical" gap={4}>
          <span>
            {intl.formatMessage({ id: 'clusters.topology.layer.labelKeys' })}
          </span>
          {/* The same chips-plus-inline-editor as the mapping drawer: a tags
              Select wraps badly once keys get long, and two ways of doing the
              same thing is one too many. No locked key — a custom layer has
              no owned key, its first key is the one the table writes. */}
          <KeyList
            keys={labelKeys}
            fieldId={CUSTOM_FIELD}
            vocabulary={vocabulary}
            defaultEditing={labelKeys.length === 0}
            onChange={setLabelKeys}
          />
        </Flex>
        <Alert
          type="info"
          showIcon
          message={intl.formatMessage({
            id: 'clusters.topology.custom.keys.tips'
          })}
        />
      </Flex>
    </Modal>
  );
};

export default CustomLayer;
