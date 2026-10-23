import { HolderOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import { useState } from 'react';
import { KeyEditor, KeyVocabulary } from './key-editor';

const useStyles = createStyles(({ css, token }) => ({
  list: css`
    width: 100%;
    min-width: 0;
  `,
  key: css`
    min-width: 0;
    padding: ${token.paddingXXS}px ${token.paddingXS}px;
    font-size: ${token.fontSizeSM}px;
    line-height: ${token.lineHeightSM};

    .grip,
    .lock {
      flex-shrink: 0;
      color: ${token.colorTextTertiary};
    }

    .grip {
      cursor: grab;
    }

    .value {
      min-width: 0;
      max-width: 100%;
      height: auto;
      min-height: 22px;
      white-space: normal;
      overflow-wrap: anywhere;

      .ant-tag-close-icon {
        opacity: 0;
        pointer-events: none;
      }

      &:hover .ant-tag-close-icon {
        opacity: 1;
        pointer-events: auto;
      }
    }

    &.dragging {
      opacity: 0.4;
    }
  `,
  add: css`
    align-self: flex-start;
    padding-inline: 0;
  `
}));

export interface KeyListProps {
  keys: string[];
  /** Rendered first with a lock; not removable, not draggable. */
  lockedKey?: string | null;
  /** The field the keys feed; decides which known keys are offered. */
  fieldId: string;
  vocabulary: KeyVocabulary;
  /** Start with the editor open, for a list that begins empty. */
  defaultEditing?: boolean;
  /** When provided, the parent controls whether the editor is open. */
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onChange: (keys: string[]) => void;
}

/** Candidate keys are tried top to bottom; the built-in key stays first. */
export const KeyList: React.FC<KeyListProps> = ({
  keys,
  lockedKey,
  fieldId,
  vocabulary,
  defaultEditing,
  editing: controlledEditing,
  onEditingChange,
  onChange
}) => {
  const intl = useIntl();
  const { styles, theme } = useStyles();
  const [dragging, setDragging] = useState<string | null>(null);
  const [localEditing, setLocalEditing] = useState(!!defaultEditing);
  const editing = controlledEditing ?? localEditing;
  const setEditing = (next: boolean) => {
    setLocalEditing(next);
    onEditingChange?.(next);
  };
  const movable = keys.filter((key) => key !== lockedKey);

  const drop = (target: string) => {
    const sourceIndex = dragging ? movable.indexOf(dragging) : -1;
    const targetIndex = movable.indexOf(target);
    if (
      sourceIndex !== -1 &&
      targetIndex !== -1 &&
      sourceIndex !== targetIndex
    ) {
      const next = [...movable];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      onChange(lockedKey ? [lockedKey, ...next] : next);
    }
    setDragging(null);
  };

  return (
    <Flex orientation="vertical" gap={theme.marginXS} className={styles.list}>
      {lockedKey && (
        <Flex align="center" gap={theme.marginXS} className={styles.key}>
          <Tooltip
            title={intl.formatMessage({
              id: 'clusters.topology.advanced.locked'
            })}
          >
            <LockOutlined className="lock" />
          </Tooltip>
          <ThemeTag className="value" opacity={1}>
            {lockedKey}
          </ThemeTag>
        </Flex>
      )}
      {movable.map((key) => (
        <Flex
          key={key}
          align="center"
          gap={theme.marginXS}
          className={classNames(styles.key, { dragging: dragging === key })}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', key);
            setDragging(key);
          }}
          onDragEnd={() => setDragging(null)}
          onDragOver={(event) => {
            if (dragging && dragging !== key) {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            drop(key);
          }}
        >
          <HolderOutlined className="grip" />
          <ThemeTag
            className="value"
            opacity={1}
            closable={{
              'aria-label': `${intl.formatMessage({ id: 'common.button.delete' })} ${key}`
            }}
            onClose={(event) => {
              event.preventDefault();
              onChange(keys.filter((item) => item !== key));
            }}
          >
            {key}
          </ThemeTag>
        </Flex>
      ))}
      {editing ? (
        <Flex>
          <KeyEditor
            fieldId={fieldId}
            vocabulary={vocabulary}
            existing={keys}
            onAdd={(key) => {
              onChange([...keys, key]);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </Flex>
      ) : (
        <Button
          type="link"
          size="small"
          className={styles.add}
          icon={<PlusOutlined />}
          onClick={() => setEditing(true)}
        >
          {intl.formatMessage({ id: 'clusters.topology.layer.addKey' })}
        </Button>
      )}
    </Flex>
  );
};

export default KeyList;
