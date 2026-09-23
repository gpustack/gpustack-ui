import { LockOutlined } from '@ant-design/icons';
import { AutoTooltip, LabelInfo } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ css }) => ({
  // The platform's own configuration, shown wherever the platform writes some.
  // Rendered as disabled-looking rows rather than disabled inputs: they are not
  // fields, and an input the user can focus but not change reads as broken.
  managed: css`
    /* One bordered card per group, in the same border/radius vocabulary as
       RoleSection — these ARE sections, one level down. Grouping by card is
       what lets the locked rows and the user's own list sit under one heading
       and still read as one list: the card is the boundary, not the heading. */
    .managed-group {
      border: 1px solid var(--ant-color-border);
      border-radius: 6px;
      padding: 10px 12px 12px;
    }
    .managed-group + .managed-group {
      margin-top: 12px;
    }
    /* Title row: the group's own name on the left, and on the right the one
       sentence that explains every padlock under it. Said once per group
       instead of once per row — the rows are already marked, what they need is
       the legend. */
    .managed-title {
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--ant-color-text-secondary);
    }
    .managed-hint {
      font-size: 12px;
      color: var(--ant-color-text-quaternary);
      flex: 0 0 auto;
    }
    .managed-rows {
      border: 1px solid var(--ant-color-border);
      border-radius: var(--ant-border-radius-lg);
      background: var(--ant-color-fill-quaternary);
      overflow: hidden;
    }
    .managed-row {
      padding: 7px 10px;
      font-size: 12px;
      line-height: 20px;
    }
    .managed-row + .managed-row {
      border-top: 1px solid var(--ant-color-border-secondary);
    }
    /* A band header inside the rows box. The rows under one card do not all
       come from the same place — the connection flags are ours and unarguable,
       the policy knobs are defaults the user may take over, and the appended
       ones are theirs — and a reader deciding whether they may touch a row
       needs that grouping before they need the row. */
    .managed-band {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 5px 10px;
      font-size: 12px;
      line-height: 18px;
      color: var(--ant-color-text-tertiary);
      background: var(--ant-color-fill-tertiary);
    }
    .managed-band + .managed-row,
    .managed-row + .managed-band,
    .managed-band + .managed-content {
      border-top: 1px solid var(--ant-color-border-secondary);
    }
    .managed-band-hint {
      color: var(--ant-color-text-quaternary);
      flex: 0 0 auto;
    }
    /* A band whose contents are controls rather than locked rows. Sits in the
       same box so the user's half and the platform's half read as one list —
       which is what they are on the command line. */
    .managed-content {
      padding: 10px;
      background: var(--ant-color-bg-container);
      .label {
        display: none;
      }
      div:has(> .label) {
        padding: 0;
        border: none;
        border-radius: 0;
      }
      .ant-form-item {
        margin-bottom: 0;
      }
    }
    .managed-lock {
      color: var(--ant-color-warning);
      font-size: 12px;
      /* Fixed width so every key starts on the same column whether or not the
         row above wrapped. */
      flex: 0 0 18px;
      line-height: 20px;
    }
    .managed-key {
      font-family: var(--ant-font-family-code);
      color: var(--ant-color-text-secondary);
      min-width: 0;
    }
    .managed-value {
      font-family: var(--ant-font-family-code);
      color: var(--ant-color-text-tertiary);
      min-width: 0;
    }
    /* A flag whose value is a JSON blob: the flag on its own line, the value
       wrapped underneath and indented to the flag. Joined onto one line these
       wrapped mid-token — «--host {{wor / ker_ip}}» — which is the one thing a
       reader of an argument list must not have to reassemble. */
    .managed-detail {
      margin-top: 2px;
      padding-left: 18px;
      font-family: var(--ant-font-family-code);
      color: var(--ant-color-text-tertiary);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    /**
     * The user's own list, in the custom branch, directly under this group's
     * locked rows.
     *
     * 🔴 Stripped of its own border and heading on purpose. The engine receives
     * ONE backend-parameter list — «--kv-transfer-config» and
     * «--enable-log-requests» arrive on the same command line — so the form
     * shows one, under one heading, inside one card. Left alone the control
     * draws a second bordered box with «后端参数» on it, which says the two
     * halves are two settings and invites the user to re-add a flag the engine
     * already has.
     *
     * :has() rather than a prop: the heading lives in a styled-component
     * inside @gpustack/core-ui, whose class name is hashed, and
     * LabelSelector exposes no style hook at all. Selecting the box *by the
     * fact that it contains a label* survives both.
     */
    .managed-footer {
      margin-top: 8px;
      .label {
        display: none;
      }
      div:has(> .label) {
        padding: 0;
        border: none;
        border-radius: 0;
      }
      .ant-form-item {
        margin-bottom: 0;
      }
    }
  `
}));

/**
 * Regroup a flat token list into one line per flag.
 *
 * The catalog ships argument lists as the argv it will pass — «--kv-connector»
 * and «nixl» are two separate entries. Rendering the array joined put seven
 * flags on three wrapped lines; splitting on every token would put a bare
 * «nixl» on a line of its own. So a token that starts with a dash opens a new
 * line and everything after it that does not is its value.
 */
export const flagLines = (tokens: string[]): string[] => {
  const lines: string[] = [];
  tokens.forEach((token) => {
    if (token.startsWith('-') || !lines.length) {
      lines.push(token);
      return;
    }
    lines[lines.length - 1] = `${lines[lines.length - 1]} ${token}`;
  });
  return lines;
};

/**
 * One locked row, in the shape the thing actually has.
 *
 * 🔴 `flag` is not a styled `pair`. A command-line flag is one token the engine
 * receives, and splitting it into a left and a right column invites the reader
 * to treat the halves as separately editable — which is exactly the mistake
 * that has them re-adding a flag the engine already has. A key/value pair (an
 * env var) genuinely is two things and gets two columns.
 */
/**
 * Split an argv list into one row per flag, flag and value in two columns.
 *
 * 🔴 Not the same as joining them. `flagLines` produces «--host {{worker_ip}}»
 * as one string, which is what the engine sees but not what a reader scans:
 * with seven flags the eye wants a column of names and a column of values, and
 * a boolean flag like «--enable-igw» should read as complete rather than as
 * one whose value failed to load. So a value-less flag gets an empty right
 * column and no placeholder dash.
 *
 * `--flag=value` is split too — both spellings reach the same parser, and a
 * catalog that mixes them should not produce two different-looking tables.
 */
export const flagPairs = (tokens: string[]): LockedRow[] => {
  const rows: { kind: 'pair'; label: string; value: string }[] = [];
  tokens.forEach((token) => {
    if (token.startsWith('-')) {
      const eq = token.indexOf('=');
      rows.push(
        eq > 0
          ? {
              kind: 'pair',
              label: token.slice(0, eq),
              value: token.slice(eq + 1)
            }
          : { kind: 'pair', label: token, value: '' }
      );
      return;
    }
    if (!rows.length) {
      rows.push({ kind: 'pair', label: token, value: '' });
      return;
    }
    const last = rows[rows.length - 1];
    last.value = last.value ? `${last.value} ${token}` : token;
  });
  return rows;
};

export type LockedRow =
  | { kind: 'flag'; text: string; detail?: string }
  | { kind: 'pair'; label: string; value: string };

/**
 * One band inside a group's box: a labelled run of rows, or a labelled run of
 * controls.
 *
 * Both exist because the same card holds three kinds of thing whose only
 * difference that matters is who may change them — see `.managed-band`.
 */
export interface ManagedBand {
  /** Already-translated band label. */
  label: string;
  /** Right-hand end of the band header: what «locked» or «empty» means here. */
  hint?: string;
  rows?: LockedRow[];
  /** Controls, for a band the user owns. */
  content?: React.ReactNode;
}

/**
 * The «engine» row every system-managed role shows for «引擎与镜像».
 *
 * 🔴 Shared rather than written per role, because the two drifted the moment
 * they were written twice: prefill and decode resolved the value
 * («vLLM · 0.23.0-…») while the router printed the literal «与模型相同» — the
 * same fact, one of them stated and one of them deferred, in adjacent tabs of
 * one form. «Same as the model» is an answer that sends the reader somewhere
 * else to get the answer.
 *
 * Read off the MODEL, which is what «系统托管» means here: the role's own
 * `backend` / `backend_version` are null in this branch by construction — the
 * custom branch is the one that sets them — so the model's are what will run.
 * A managed router runs the model's runner image too; what makes it a router
 * is which executable inside it starts, and that is visible as the actual
 * flags under «路由参数 › 连接».
 */
export const useEngineRows = (): LockedRow[] => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const backend = Form.useWatch('backend', form);
  const backendVersion = Form.useWatch('backend_version', form);
  return [
    {
      kind: 'pair',
      label: intl.formatMessage({ id: 'models.form.roles.engine' }),
      value: [backend, backendVersion].filter(Boolean).join(' · ') || '-'
    }
  ];
};

export interface ManagedGroup {
  /** Already-translated heading. */
  title?: string;
  /** Already-translated tooltip behind the heading's «?». */
  description?: string;
  /** Right-hand end of the title row — the padlock legend, usually. */
  titleExtra?: React.ReactNode;
  rows?: LockedRow[];
  /** Used instead of `rows` when the group's contents need sub-headings. */
  bands?: ManagedBand[];
  /**
   * The editable half of this group, when the user owns one.
   *
   * A group with a footer and no rows still renders: that is the `custom` PD
   * mode, which injects nothing — dropping the card there would leave the user
   * with no way to add a parameter at all.
   */
  footer?: React.ReactNode;
}

interface SystemManagedProps {
  groups: ManagedGroup[];
}

/**
 * What the platform writes into a role, read-only.
 *
 * Shown in **both** branches of the switch above it, and that is the point
 * rather than an oversight: the injection does not depend on the switch. The
 * server keeps writing a prefill's connector configuration whether or not the
 * user also customized the role's parameters, so a block that vanished on
 * "custom" claimed the opposite of what runs — and left the user re-adding
 * flags the engine was already getting.
 *
 * `{{...}}` placeholders are left as placeholders. They resolve from where the
 * group lands, which the form does not know yet; showing them unrendered is
 * what makes "this one is an address we fill in" legible.
 */
const SystemManaged: React.FC<SystemManagedProps> = ({ groups }) => {
  const { styles } = useStyles();

  const renderRow = (row: LockedRow, key: number) => (
    <div className="managed-row" key={key}>
      {row.kind === 'flag' ? (
        <>
          <Flex align="flex-start" gap={0}>
            <LockOutlined className="managed-lock" />
            <span className="managed-key">{row.text}</span>
          </Flex>
          {row.detail && <div className="managed-detail">{row.detail}</div>}
        </>
      ) : (
        <Flex align="center" gap={8}>
          <LockOutlined className="managed-lock" />
          <span className="managed-key">{row.label}</span>
          {/* Pushed right and truncated rather than wrapped: a value is read
              as "what is this set to", and a ragged second line under a
              one-word key reads as a new row. */}
          {row.value !== '' && (
            <div className="managed-value" style={{ marginLeft: 'auto' }}>
              <AutoTooltip ghost maxWidth="100%">
                {row.value}
              </AutoTooltip>
            </div>
          )}
        </Flex>
      )}
    </div>
  );

  const bandsOf = (group: ManagedGroup) =>
    (group.bands || []).filter((band) => band.rows?.length || band.content);

  const visible = groups.filter(
    (group) => group.rows?.length || bandsOf(group).length || group.footer
  );

  if (!visible.length) {
    return null;
  }

  return (
    <div className={styles.managed}>
      {visible.map((group, groupIndex) => {
        const bands = bandsOf(group);
        return (
          <div className="managed-group" key={group.title || groupIndex}>
            {(group.title || group.titleExtra) && (
              <Flex
                className="managed-title"
                align="center"
                justify="space-between"
                gap={8}
              >
                <LabelInfo
                  label={group.title}
                  description={group.description}
                ></LabelInfo>
                {group.titleExtra}
              </Flex>
            )}
            {(group.rows?.length || bands.length) > 0 && (
              <div className="managed-rows">
                {group.rows?.map(renderRow)}
                {bands.map((band) => (
                  <React.Fragment key={band.label}>
                    <div className="managed-band">
                      <span>{band.label}</span>
                      {band.hint && (
                        <span className="managed-band-hint">{band.hint}</span>
                      )}
                    </div>
                    {band.rows?.map(renderRow)}
                    {band.content && (
                      <div className="managed-content">{band.content}</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            {group.footer && (
              <div className="managed-footer">{group.footer}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SystemManaged;
