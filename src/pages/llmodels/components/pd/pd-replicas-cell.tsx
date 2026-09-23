import { StatusMaps } from '@/config';
import type { StatusType } from '@/config/types';
import {
  CheckOutlined,
  FormOutlined,
  SyncOutlined,
  UndoOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { config as coreConfig, StatusDot } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, InputNumber, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import {
  InstanceDrainingLabel,
  isRestartInFlight,
  modelReplicaCounts,
  RESTART_LAPSE_MS,
  RoleValueMap
} from '../../config';
import { ListItem, RoleSpec } from '../../config/types';
import { MarkerReasons } from './pd-markers';
import {
  isRoleDraining,
  isRoleWaiting,
  orderedRoleStatus,
  roleDrainingCount,
  roleLabel,
  type RoleStatusItem
} from './role-status';
import RoleStatusDetail from './role-status-detail';

/** The role line's own metrics, from the design: 14px on a 22px line, so the
 *  block stacks to the same rhythm as the rest of the table's text. */
const ROLE_LINE: React.CSSProperties = {
  fontSize: 14,
  gap: 8,
  lineHeight: '22px'
};

/**
 * In the editor every line is as tall as the number box it holds, including
 * the router's, which has none — otherwise the router line would ride up.
 *
 * 🔴 The design specified the 32px box the aggregate row uses, for consistency
 * down the column. It cost more than it bought: three of them turned a 66px
 * block into a 112px one, so opening the editor shoved every row below this
 * one down the page and closing it pulled them back. A control that moves the
 * table to be used is worse than one that is a size off from its neighbour.
 * `small` is 24px — the smallest antd height that is still a real input — and
 * it holds the shift to ~14px, which reads as the row staying put.
 */
const EDIT_LINE_HEIGHT = 24;

const ROLE_LINE_EDITING: React.CSSProperties = {
  ...ROLE_LINE,
  minHeight: EDIT_LINE_HEIGHT
};

const useStyles = createStyles(({ css }) => ({
  // A grid, not a stack of flex rows: the counts have to line up under each
  // other across roles, and only a shared track can promise that when one role
  // reads «1 / 1» and the next «10 / 12». The track list is set by the caller,
  // because the editor adds one.
  roles: css`
    display: grid;
    column-gap: 12px;
    align-items: center;
    font-variant-numeric: tabular-nums;
  `,
  count: css`
    text-align: right;
    white-space: nowrap;
    color: var(--ant-color-text);
    font-size: 14px;
    line-height: 22px;
  `,
  // Matches the number box's own text inset, so the router's fixed count sits
  // on the same vertical as the editable ones beside it.
  fixed: css`
    padding-inline-start: 12px;
    color: var(--ant-color-text);
    font-size: 14px;
    line-height: 22px;
  `,
  // Its own track, left-aligned: the fractions to its left are right-aligned
  // against each other and these read down the column as a list, so the two
  // meet in the middle and neither has to move for the other.
  //
  // Subordinate to the fraction it trails, not a second number competing with
  // it: the reader's question is still «how many are serving out of how many I
  // asked for», and this is the footnote that accounts for the rows underneath.
  // A step down in size says so without a separator glyph, which at this width
  // would cost more than it carries.
  //
  // Warning-coloured to match the role's own dot on the same line. The dot is
  // what says «mid-change» at a glance and this is what says which change, so
  // sharing the colour is what ties them together; a neutral grey here would
  // leave the dot's colour unexplained on the one row that explains it.
  draining: css`
    text-align: start;
    white-space: nowrap;
    color: var(--ant-color-warning);
    font-size: 12px;
    line-height: 22px;
  `
}));

interface PDReplicasCellProps {
  record: ListItem;
  markers: string[];
  /** The deployment's own state, as the column already computed it from
   *  `Model.state`. A role that is short of its members borrows it, so the
   *  colour of a gap says what kind of gap it is — scaling or broken — without
   *  the cell second-guessing the backend's judgement. */
  status: StatusType;
  /** `state_message`. It used to hang off the single row-level dot; with that
   *  dot gone it moves onto the tooltip rather than disappearing. */
  statusMessage?: string;
  /** The disaggregation transport (`vllm-nixl`, …), for the tooltip. Came
   *  here with the shape when both left the name column. */
  mode?: string;
  className?: string;
  onSave: (roles: RoleSpec[]) => Promise<void>;
}

/**
 * The replica cell of a PD row: one line per role, and the control that changes
 * how many members each role should have.
 *
 * 🔴 Went through «2P2D · 5 / 5» — the declared shape beside the group total —
 * before landing here. That line was compact but it made the reader do the
 * arithmetic the row exists to spare them: «5 / 5» is silent about *which*
 * role is short, and on «4 / 5» the only way to find out was to hover. A
 * group's roles fail independently, so the column now prints them
 * independently, one per line, and the shape is no longer stated at all — the
 * desired counts down the right-hand track *are* the 1P3D.
 *
 * 🔑 Editing per-role counts here is safe because the server treats them as a
 * scale, not a shape: `replicas` sits in `_DIGEST_EXCLUDED_SPEC_FIELDS`
 * precisely so that 1P1D -> 2P1D converges role by role instead of restarting
 * the group. The router is displayed but not editable — every group has
 * exactly one, and a second one is not a thing the shape notation can express.
 */
const PDReplicasCell: React.FC<PDReplicasCellProps> = ({
  record,
  markers,
  status,
  statusMessage,
  mode,
  className,
  onSave
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, number>>({});

  /**
   * A restart the server is still carrying out, off the same `restarting_since`
   * — and through the same `isRestartInFlight` — that the row's ⋮ menu reads to
   * disable a second one. Shared so the banner and that entry cannot answer
   * differently about one deployment.
   *
   * Unlike the menu, which is evaluated afresh each time it opens, this is on
   * screen while the lapse passes, and a wedged group produces no events to
   * bring the re-render that would notice. Hence the timer: it carries no state
   * of its own, it just fires once at the moment the answer changes. Only while
   * a restart is actually believed — an idle row keeps no timer.
   */
  const [, lapse] = React.useState(0);
  const since = record.restarting_since
    ? Date.parse(record.restarting_since)
    : NaN;
  const restarting = isRestartInFlight(record.restarting_since);
  React.useEffect(() => {
    if (!restarting) return;
    const timer = setTimeout(
      () => lapse((tick) => tick + 1),
      Math.max(since + RESTART_LAPSE_MS - Date.now(), 0)
    );
    return () => clearTimeout(timer);
  }, [restarting, since]);

  const roles: RoleSpec[] = record.roles || [];
  // Role order, not `roles` order: a reader scans P before D, and the editor
  // has to agree with the list it opened from.
  const ordered = orderedRoleStatus(record.role_status, roles);

  /**
   * A role's dot.
   *
   * 🔑 **One rule: green means this role is at the count it was asked for.**
   * Anything else is mid-change and says so in the colour — scaling up, scaling
   * down, or replacing a member that died. The rest of the cases below are
   * about *which* non-green colour, never about letting an off-target role
   * stay green.
   *
   * That rule is the fix for the two ways this cell used to claim a group was
   * settled when it was not, and they are the same bug from opposite sides:
   *
   *  - **Scaling up.** A short role borrowed the deployment's own status, and
   *    a group that is still serving is RUNNING — so adding a prefill left the
   *    role reading «1 / 2» in green for the whole time the new member was
   *    starting. The backend disagreed the entire time (`degradations` carries
   *    `ratio_unmet`) and so did this cell's own tooltip, which renders
   *    «Starting» in warning colour one hover away from a green dot.
   *  - **Scaling down.** An over-target role is not short of anything, so it
   *    took the «all members up» branch and went green while a member sat in
   *    its drain window — «3 / 2» in the colour of a healthy group, which
   *    reads as «the edit did not take» and was reported as exactly that. The
   *    count cannot be corrected (`ready` is a published metric and a drained
   *    member is genuinely still RUNNING), so the colour is the only thing
   *    that can carry it.
   *
   * The deployment's own status is still borrowed, but only where it says
   * something this rule cannot: «failed» and «starting» stay the two colours
   * the backend distinguishes, instead of collapsing into one generic orange.
   * Its success value is the only one dropped — a serving deployment says
   * nothing about whether one of its roles has finished converging.
   *
   * A stopped deployment greys out entirely: with `replicas` at 0 no role is
   * «ready», it is simply switched off, and green on every line would read as
   * a healthy group.
   *
   * 🔴 The one case where the deployment's own state is not borrowed at all is
   * a restart in flight. Its members were torn down on purpose, so every role
   * reads «0 / n» in the deployment's failure colour — pixel-identical to the
   * group having died, which is the confusion this cell was measured making.
   * A short role under a restart is transitioning, and says so in the colour
   * before anything has to be read.
   */
  const roleStatus = (item: RoleStatusItem): StatusType => {
    if (status === StatusMaps.inactive) {
      return StatusMaps.inactive;
    }
    if (isRoleWaiting(item)) {
      if (restarting) {
        return StatusMaps.transitioning;
      }
      return status === StatusMaps.success ? StatusMaps.warning : status;
    }
    return isRoleDraining(item) ? StatusMaps.warning : StatusMaps.success;
  };

  const openEditor = () => {
    setDraft(
      roles.reduce<Record<string, number>>((acc, role) => {
        acc[role.name] = role.replicas ?? 0;
        return acc;
      }, {})
    );
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(
        roles.map((role) => ({
          ...role,
          replicas: draft[role.name] ?? role.replicas
        }))
      );
      setEditing(false);
    } catch (error) {
      // The request layer surfaces the failure; keep the editor open so the
      // numbers the user typed are not thrown away with it.
    } finally {
      setSaving(false);
    }
  };

  const dirty = roles.some(
    (role) => (draft[role.name] ?? role.replicas) !== role.replicas
  );

  /**
   * Whether any role is draining, which decides the track list below.
   *
   * 🔴 The annotation cannot live inside the count cell. That cell is
   * right-aligned so the fractions line up down the column, and a grid track is
   * as wide as its widest cell — so the one role with «1 draining» beside it
   * widened the track, and its «1 / 1» was pushed left of every other role's.
   * The numbers stopped lining up, which is the one thing the grid is here for.
   *
   * A track of its own fixes that, but only if every row contributes a cell to
   * it: a fragment that renders nothing leaves the next role's dot in the
   * draining column. Hence the empty span rather than a conditional element.
   */
  const anyDraining = ordered.some((item) => roleDrainingCount(item) !== null);

  const roleLines = ordered.map((item) => {
    // Only roles the spec actually declares can be scaled — `role_status` may
    // carry a name the group no longer has, and there is nothing to write to.
    const editable =
      item.name !== RoleValueMap.Router &&
      roles.some((role) => role.name === item.name);
    const draining = roleDrainingCount(item);
    return (
      <React.Fragment key={item.name}>
        <StatusDot
          statusValue={{
            status: roleStatus(item),
            text: roleLabel(intl, item.name)
          }}
          style={editing ? ROLE_LINE_EDITING : ROLE_LINE}
        />
        <span className={styles.count}>
          {editing ? `${item.ready} /` : `${item.ready} / ${item.desired}`}
        </span>
        {/* Suppressed while editing: the third track is the number box then,
            and a role that is mid-change is exactly the one being edited. */}
        {!editing && anyDraining && (
          <span className={styles.draining}>
            {draining === null
              ? null
              : `${draining} ${InstanceDrainingLabel.toLowerCase()}`}
          </span>
        )}
        {editing &&
          (editable ? (
            <InputNumber
              size="small"
              min={0}
              precision={0}
              style={{ width: 64 }}
              value={draft[item.name]}
              aria-label={roleLabel(intl, item.name)}
              onChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  [item.name]: (value as number) ?? 0
                }))
              }
            />
          ) : (
            <span className={styles.fixed}>{item.desired}</span>
          ))}
      </React.Fragment>
    );
  });

  const rolesBlock = (
    <div
      className={styles.roles}
      // A third track carries either the editor's input or the draining
      // annotation, and in both cases the first two stay exactly where the
      // reader last saw them — which is the point: the fractions line up down
      // the column whether or not one role has something to say beside it.
      // Inline rather than a second class, so the override does not depend on
      // emitted rule order.
      //
      // Reading rows stack flush, as drawn: they are text on a 22px line and
      // the leading is the separation. Editing rows cannot — two boxes with a
      // row gap of zero meet border to border and read as one control with a
      // line through it. The design drew them flush because its boxes were
      // borderless blocks; a real bordered input needs the gap to stay a
      // discrete field. Kept to 4px because every pixel here is a pixel the
      // rows below move when the editor opens.
      style={{
        gridTemplateColumns:
          editing || anyDraining ? 'auto auto auto' : 'auto auto',
        rowGap: editing ? 4 : 0,
        cursor: editing ? undefined : 'help'
      }}
    >
      {roleLines}
    </div>
  );

  /**
   * The restart banner. Permanent while it lasts rather than hover-only: the
   * ⋮ menu already said this on hover and nobody found it, because a reader
   * looking at «0 / 1» three times over has no reason to suspect the menu
   * knows something the cell does not.
   *
   * One word, and the numbers stay in the role lines below. This column's
   * floor is 280px and a worded progress line wraps to two or three of them in
   * every Latin locale — a restarting row would stand half again as tall as
   * its neighbours, and the fraction it bought is the sum of the three lines
   * directly underneath it. The same fact twice is what the status dot above
   * this cell exists to avoid. The count the reader might still want is one
   * hover away.
   *
   * ⚠️ The hover says `{ready}/{total}` and not how many are *stopped*,
   * because that number is not knowable here. The list response carries no
   * member count — `role_status` counts ready members, not existing ones — and
   * a list row never sees the members themselves. `{ready}` alone answers the
   * question the banner is here for anyway: how far along the rebuild is.
   */
  const { ready, total } = modelReplicaCounts(record);
  const restartingNotice = restarting ? (
    <Tooltip
      title={intl.formatMessage(
        { id: 'models.pd.group.restarting.progress' },
        { ready, total }
      )}
    >
      <Flex
        align="center"
        gap={6}
        style={{
          alignSelf: 'flex-start',
          cursor: 'help',
          fontSize: 12,
          lineHeight: '18px',
          color: coreConfig.StatusColorMap[StatusMaps.transitioning].text
        }}
      >
        <SyncOutlined spin style={{ flexShrink: 0 }} />
        <span>
          {intl.formatMessage({ id: 'models.pd.group.restarting.brief' })}
        </span>
      </Flex>
    </Tooltip>
  ) : null;

  return (
    <Flex vertical gap={4} className={className}>
      {restartingNotice}
      <Flex align="flex-start" gap={12}>
        {/* The lines carry the tooltip, so the thing you hover is the thing it
          explains. It is no longer where the per-role counts live — they are
          printed now — but it is still the only place that can say how far the
          running ratio has drifted from the declared one, why a marker is up,
          and which transport the group uses. Suppressed while editing: a
          tooltip over the inputs would cover the numbers being typed. */}
        {editing ? (
          rolesBlock
        ) : (
          <Tooltip
            title={
              <RoleStatusDetail
                roleStatus={record.role_status}
                roles={record.roles}
                footer={
                  <>
                    <MarkerReasons texts={markers} />
                    {!!statusMessage && (
                      <span style={{ opacity: 0.75 }}>{statusMessage}</span>
                    )}
                    {!!mode && (
                      <span style={{ opacity: 0.75 }}>
                        {intl.formatMessage({ id: 'models.form.pd.mode' })}:{' '}
                        {mode}
                      </span>
                    )}
                  </>
                }
              ></RoleStatusDetail>
            }
          >
            {rolesBlock}
          </Tooltip>
        )}

        {/* Deliberately the same controls a role-less row gets from the column's
          `editable` hook — antd `Button type="text" size="small"` around
          `FormOutlined`, then `CheckOutlined` / `UndoOutlined` once open. That
          editor is one number and cannot express a shape, so this row hides it
          (see `pdReplicas`) and puts identical-looking ones here that drive one
          input per role instead. Matching the control is the point: from the
          reader's side the two kinds of row offer the same affordance in the
          same place. Only the spacing is the cell's own, because here the
          buttons sit beside a block rather than trailing a single number, and
          they hold the first line of it. */}
        {editing ? (
          <Flex
            align="center"
            gap={2}
            style={{ height: EDIT_LINE_HEIGHT, flexShrink: 0 }}
          >
            <Tooltip
              title={intl.formatMessage({ id: 'common.button.confirm' })}
            >
              <Button
                type="text"
                size="small"
                loading={saving}
                disabled={!dirty}
                icon={<CheckOutlined />}
                onClick={handleSave}
                aria-label={intl.formatMessage({ id: 'common.button.confirm' })}
              />
            </Tooltip>
            <Tooltip title={intl.formatMessage({ id: 'common.button.cancel' })}>
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                onClick={() => setEditing(false)}
                aria-label={intl.formatMessage({ id: 'common.button.cancel' })}
              />
            </Tooltip>
          </Flex>
        ) : (
          <Flex align="center" gap={2} style={{ height: 22, flexShrink: 0 }}>
            {/* 🔴 The reasons ride the glyph, not only the role lines to its
              left. They are in that tooltip too — as its footer, beside what
              each role is doing — but this is the thing that says something is
              wrong, so it is the thing a reader hovers, and hovering it used
              to produce nothing at all. A role-less row already does this
              (`use-models-columns`); the group row is the one that did not,
              which is exactly the rule `pd-markers` states about itself: a
              marker without a reason is just another silent failure. */}
            {markers.length > 0 && (
              <Tooltip title={<MarkerReasons texts={markers} />}>
                <WarningOutlined
                  style={{ flexShrink: 0, color: 'var(--ant-color-warning)' }}
                />
              </Tooltip>
            )}
            <Tooltip
              title={intl.formatMessage({ id: 'models.table.replicas.edit' })}
            >
              <Button
                type="text"
                size="small"
                icon={<FormOutlined />}
                onClick={openEditor}
                aria-label={intl.formatMessage({
                  id: 'models.table.replicas.edit'
                })}
              />
            </Tooltip>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default PDReplicasCell;
