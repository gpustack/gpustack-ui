import { ListInput } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import { EntryTitle } from './styled';
import { humanizeFieldName } from './utils';

// The frame the per-component editors share, so several roles read as
// one Parameters field rather than as a stack of separate ones: the
// outer frame is the one a single editor draws for itself, and each role
// inside carries the entry card the L2 backend list uses.
const useParametersStyles = createStyles(({ token, css }) => ({
  group: css`
    position: relative;
    width: 100%;
    padding: 16px;
    // room for the label the frame carries in its top-left corner
    padding-top: 36px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
  groupLabel: css`
    position: absolute;
    left: 16px;
    top: 12px;
    line-height: 1;
    color: ${token.colorTextTertiary};
  `,
  emptyNote: css`
    color: ${token.colorTextTertiary};
  `,
  entry: css`
    padding: 12px 16px 16px;
    border: 1px solid ${token.colorSplit};
    border-radius: ${token.borderRadiusLG}px;
  `,
  entryTitle: css`
    margin-bottom: 10px;
  `
}));

// Flags belong to the binary a role runs, so they are edited and stored
// per component rather than once for the service. Every enabled role is
// laid out at once: what one of them carries is configuration of the
// same service, and hiding it behind a switch is how it gets forgotten.
const ComponentParameters: React.FC<{
  value?: Record<string, string[]>;
  onChange?: (value: Record<string, string[]>) => void;
  // each role's own completion hints: they run different binaries, so
  // one's flags are the other's parse error
  components: { name: string; hints: { label: string; value: string }[] }[];
  btnText: string;
  label: string;
}> = ({ value, onChange, components, btnText, label }) => {
  const intl = useIntl();
  const { styles } = useParametersStyles();
  const editor = (component: (typeof components)[number]) => (
    <ListInput
      value={value?.[component.name] || []}
      onChange={(next: string[]) =>
        onChange?.({ ...(value || {}), [component.name]: next })
      }
      placeholder="--max-workers=8"
      options={component.hints}
      btnText={btnText}
      label={components.length > 1 ? undefined : label}
      styles={
        components.length > 1
          ? { wrapper: { border: 'none', borderRadius: 0, padding: 0 } }
          : undefined
      }
    ></ListInput>
  );

  if (!components.length) {
    // Every declared component is gated off, so there is no role whose binary
    // would read a flag. "" is not a fallback here: it keys the one process a
    // provider without components runs, and parameters stored under it would
    // reach nothing.
    return (
      <Flex vertical gap={12} className={styles.group}>
        <span className={styles.groupLabel}>{label}</span>
        <span className={styles.emptyNote}>
          {intl.formatMessage({ id: 'kvCache.form.parameters.noComponent' })}
        </span>
      </Flex>
    );
  }
  if (components.length === 1) {
    return editor(components[0]);
  }
  return (
    <Flex vertical gap={12} className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      {components.map((component) => (
        <div className={styles.entry} key={component.name}>
          <EntryTitle className={styles.entryTitle}>
            {humanizeFieldName(component.name)}
          </EntryTitle>
          {editor(component)}
        </div>
      ))}
    </Flex>
  );
};

export default ComponentParameters;
