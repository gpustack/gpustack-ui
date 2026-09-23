import { useIntl } from '@umijs/max';
import { Input, Modal } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { topologyFieldLabel } from '../../../config';
import { DraftLayer } from './draft';

const useStyles = createStyles(({ css }) => ({
  hint: css`
    margin-top: 8px;
    font-size: 12px;
    color: var(--ant-color-text-tertiary);
    .layer-id {
      font-family: var(--ant-font-family-code);
      color: var(--ant-color-text-quaternary);
    }
  `,
  error: css`
    margin-top: 6px;
    font-size: 12px;
    color: var(--ant-color-error);
  `
}));

interface RenameLayerProps {
  open: boolean;
  layer: DraftLayer;
  /** Every other rung's effective label, for the uniqueness check. */
  taken: string[];
  /** `null` clears the override and restores the default. */
  onOk: (displayName: string | null) => void;
  onCancel: () => void;
}

/**
 * Rename one rung.
 *
 * What this writes is `displayName`, never `name`. The distinction is the
 * whole reason renaming is possible at all: `name` is the layer's canonical
 * word and the i18n lookup key, so a rung keeps answering to the same handle
 * in every language while the operator calls it whatever suits their machine
 * room. The id is untouched, which is what keeps saved model configurations
 * pointing at it — said in the dialog, because "renaming breaks references"
 * is the reasonable thing to assume otherwise.
 */
const RenameLayer: React.FC<RenameLayerProps> = ({
  open,
  layer,
  taken,
  onOk,
  onCancel
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  // Seeded with what is on screen, so the field opens on the thing being
  // renamed rather than empty.
  const [value, setValue] = useState(layer.label);

  const fallback = topologyFieldLabel(intl, layer.name, layer.name);
  const trimmed = value.trim();
  const collides = taken.some(
    (other) => other.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase()
  );

  const handleOk = () => {
    if (collides) {
      return;
    }
    // Empty, or unchanged from the default, clears the override rather than
    // storing it.
    //
    // ⚠️ The second half is what stops the commonest accident: the field is
    // pre-filled with the *current language's* label, so "open the dialog,
    // change nothing, press OK" would otherwise freeze «机柜» into the data
    // and hand it to every English reader — a change nobody made, with no
    // trace of where it came from.
    onOk(!trimmed || trimmed === fallback ? null : trimmed);
  };

  return (
    <Modal
      open={open}
      title={intl.formatMessage({ id: 'clusters.topology.layer.rename' })}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: collides }}
      destroyOnHidden
      width={420}
    >
      <Input
        autoFocus
        value={value}
        placeholder={fallback}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleOk}
      />
      {collides && (
        <div className={styles.error}>
          {intl.formatMessage({ id: 'clusters.topology.layer.rename.taken' })}
        </div>
      )}
      <div className={styles.hint}>
        {intl.formatMessage({ id: 'clusters.topology.layer.rename.tips' })}
        <br />
        <span className="layer-id">{layer.id}</span>
      </div>
    </Modal>
  );
};

export default RenameLayer;
